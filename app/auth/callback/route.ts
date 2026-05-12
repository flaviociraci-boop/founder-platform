import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { categories } from "@/app/lib/data";

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.color])
);

async function ensureProfile(supabase: any, user: any) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existing) return;

  const meta = user.user_metadata ?? {};

  const name =
    meta.name ??
    meta.full_name ??
    user.email?.split("@")[0] ??
    "Nutzer";

  const initials =
    meta.avatar ??
    name
      .split(" ")
      .map((n: string) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const { error: insertError } = await supabase.from("profiles").insert({
    auth_id: user.id,
    name,
    age: meta.age ?? null,
    category: meta.category ?? null,
    seeking: meta.seeking ?? null,
    avatar: initials,
    color: meta.color ?? CATEGORY_COLORS.apps,
    followers: 0,
    following: 0,
    tags: [],
  });

  if (insertError) {
    console.error("Profile creation failed:", insertError);
  }
}

// Phase 2B: verknüpft eine offene Whop-Subscription (user_id IS NULL)
// mit dem frisch bestätigten Auth-User. Match läuft über whop_user_email
// (case-insensitiv normalisiert beim Webhook-Schreiben). Service-role,
// damit RLS umgangen wird.
async function linkPendingSubscription(authUserId: string, email: string | null | undefined) {
  if (!email) return;
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("subscriptions")
    .update({ user_id: authUserId })
    .eq("whop_user_email", email.toLowerCase())
    .is("user_id", null)
    .select("id");
  if (error) {
    console.error("linkPendingSubscription failed:", error);
    return;
  }
  if (!data || data.length === 0) {
    console.warn(`linkPendingSubscription: no pending subscription for ${email}`);
  } else {
    console.log(`linkPendingSubscription: linked ${data.length} subscription(s) to user ${authUserId}`);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Pfad 1: OAuth-Flow (Google) – bestehend
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await ensureProfile(supabase, data.user);
      await linkPendingSubscription(data.user.id, data.user.email);
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Pfad 2: Email-Bestätigung (Token-Hash-Flow)
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash: tokenHash,
    });

    if (!error && data.user) {
      await ensureProfile(supabase, data.user);
      await linkPendingSubscription(data.user.id, data.user.email);
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Email verify error:", error);
    return NextResponse.redirect(`${origin}/login?error=verify`);
  }

  // Kein gültiger Parameter
  return NextResponse.redirect(`${origin}/login?error=missing_params`);
}
