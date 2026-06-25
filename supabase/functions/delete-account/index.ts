// Connectyfind — In-App-Account-Löschung (Apple 5.1.1(v), DSGVO).
//
// Sequenz:
//   1. JWT aus Authorization-Header → User-UUID. NIEMALS aus Body.
//   2. profile_id via profiles.auth_id = userId ermitteln.
//   3. subscriptions löschen (kein FK-Cascade — Whop-Legacy).
//   4. profiles löschen → cascadet via FKs zu applications, companies,
//      connections, follows, messages, notifications, projects.
//   5. Avatar-Objekte unter {userId}/ aus dem avatars-Bucket löschen.
//   6. auth.admin.deleteUser(userId).
//
// Fehler in Schritt 3–5 sind nicht-fatal (geloggt, aber Löschung läuft
// weiter). Fehler in Schritt 6 ist fatal — falls auth.users nicht weg
// ist, kann der User sich noch einloggen und das wäre gegen den Zweck.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "missing_authorization" }, 401);
  }
  const accessToken = authHeader.slice("Bearer ".length).trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("delete-account: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "server_misconfigured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData?.user) {
    return json({ error: "invalid_token" }, 401);
  }
  const userId = userData.user.id;

  const { data: profileRow, error: profileErr } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_id", userId)
    .maybeSingle();
  if (profileErr) {
    console.error("delete-account: profile lookup failed", profileErr);
  }
  const profileId = profileRow?.id ?? null;

  const { error: subsErr } = await admin
    .from("subscriptions")
    .delete()
    .eq("user_id", userId);
  if (subsErr) console.error("delete-account: subscriptions cleanup failed", subsErr);

  if (profileId !== null) {
    const { error: profDelErr } = await admin
      .from("profiles")
      .delete()
      .eq("id", profileId);
    if (profDelErr) {
      console.error("delete-account: profile delete failed", profDelErr);
      return json({ error: "profile_delete_failed", detail: profDelErr.message }, 500);
    }
  }

  try {
    const { data: files } = await admin.storage.from("avatars").list(userId, { limit: 100 });
    const paths = (files ?? []).map((f) => `${userId}/${f.name}`);
    if (paths.length > 0) {
      const { error: storageErr } = await admin.storage.from("avatars").remove(paths);
      if (storageErr) console.error("delete-account: storage cleanup failed", storageErr);
    }
  } catch (e) {
    console.error("delete-account: storage step threw", e);
  }

  const { error: authDelErr } = await admin.auth.admin.deleteUser(userId);
  if (authDelErr) {
    console.error("delete-account: auth user delete failed", authDelErr);
    return json({ error: "auth_delete_failed", detail: authDelErr.message }, 500);
  }

  return json({ ok: true, deleted_user_id: userId });
});
