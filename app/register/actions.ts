"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { categories } from "@/app/lib/data";

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.color]),
);

const ONE_HOUR_MS = 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  age: string;
  category: string;
  seeking: string;
};

export type RegisterResult = { error: string } | undefined;

/**
 * Register-Server-Action:
 *  1. Validiert Input
 *  2. Verifiziert, dass für die Email eine offene Whop-Subscription existiert
 *     (status active/trial/trialing, user_id NULL, < 1h alt)
 *  3. Legt User via Admin-API an mit email_confirm: true → keine Bestätigungs-
 *     mail, weil Whop die Email schon verifiziert hat
 *  4. Verknüpft die Subscription mit dem neuen User
 *  5. Legt die Profile-Row an
 *  6. Setzt die Session (signInWithPassword schreibt Cookies via SSR-Client)
 *  7. Redirect auf "/" — Middleware lässt durch, Sub ist verknüpft
 */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const name = input.name.trim();

  if (!EMAIL_RE.test(email)) return { error: "Ungültige Email-Adresse." };
  if (password.length < 6) return { error: "Passwort muss mindestens 6 Zeichen lang sein." };
  if (!name) return { error: "Bitte Namen eingeben." };
  if (!input.category) return { error: "Bitte eine Kategorie wählen." };
  if (!input.seeking) return { error: "Bitte auswählen was du suchst." };

  const admin = createServiceRoleClient();

  // 1) Subscription muss zu dieser Email passen, frisch sein, noch nicht
  //    verknüpft. Service-Role bypasst RLS.
  const oneHourAgoIso = new Date(Date.now() - ONE_HOUR_MS).toISOString();
  const { data: sub, error: subErr } = await admin
    .from("subscriptions")
    .select("id")
    .eq("whop_user_email", email)
    .in("status", ["active", "trial", "trialing"])
    .is("user_id", null)
    .gt("created_at", oneHourAgoIso)
    .maybeSingle();

  if (subErr) {
    console.error("[register] subscription lookup failed:", subErr);
    return { error: "Datenbankfehler beim Abo-Check. Bitte erneut versuchen." };
  }
  if (!sub) {
    return {
      error:
        "Kein Premium-Abo für diese Email gefunden. Bitte zuerst auf /pricing kaufen.",
    };
  }

  // 2) User via Admin-API anlegen. email_confirm: true verhindert die
  //    Supabase-Bestätigungsmail.
  const initials = name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const age = input.age ? Number.parseInt(input.age, 10) : null;
  const color = CATEGORY_COLORS[input.category] ?? "#6366f1";

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      age,
      category: input.category,
      seeking: input.seeking,
      avatar: initials,
      color,
    },
  });
  if (createErr || !created?.user) {
    console.error("[register] createUser failed:", createErr);
    return { error: createErr?.message ?? "Account-Erstellung fehlgeschlagen." };
  }
  const newUserId = created.user.id;

  // 3) Subscription verknüpfen.
  const { error: linkErr } = await admin
    .from("subscriptions")
    .update({ user_id: newUserId })
    .eq("id", sub.id);
  if (linkErr) {
    // User existiert, Sub nicht verknüpft — Middleware-Paywall würde greifen.
    // Loggen + abbrechen, damit der User nicht in einer kaputten Session
    // landet. Account-Cleanup ist Post-Launch-Aufgabe.
    console.error("[register] subscription link failed:", linkErr);
    return { error: "Verknüpfung mit Abo fehlgeschlagen. Bitte Support kontaktieren." };
  }

  // 4) Profile-Row anlegen (analog ensureProfile in /auth/callback).
  const { error: profileErr } = await admin.from("profiles").insert({
    auth_id: newUserId,
    name,
    age,
    category: input.category,
    seeking: input.seeking,
    avatar: initials,
    color,
    followers: 0,
    following: 0,
    tags: [],
  });
  if (profileErr) {
    console.error("[register] profile insert failed:", profileErr);
    return { error: "Profil konnte nicht angelegt werden. Bitte erneut versuchen." };
  }

  // 5) Session setzen — schreibt sb-*-Cookies via Server-Supabase-Client.
  const cookieStore = await cookies();
  const serverClient = createServerSupabase(cookieStore);
  const { error: signInErr } = await serverClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    console.error("[register] auto sign-in failed:", signInErr);
    return {
      error: "Account angelegt, aber Auto-Login fehlgeschlagen. Bitte manuell einloggen.",
    };
  }

  // 6) Redirect — Middleware lässt durch, weil Sub jetzt verknüpft ist.
  redirect("/");
}
