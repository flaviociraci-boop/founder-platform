import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

// Phase 2B pre-check: bevor ein User sich registriert, prüft die /register-
// Seite mit dieser Route, ob für die eingegebene Email eine unverknüpfte
// Subscription existiert. Antwortet ausschließlich mit { matched: boolean } —
// keine Subscription-Daten, kein Email-Echo, kein Error-Detail.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ matched: false }, { status: 400 });
  }

  const email = (body as { email?: unknown })?.email;
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ matched: false }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("id")
    .eq("whop_user_email", email.toLowerCase())
    .is("user_id", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("check-subscription lookup failed:", error);
    return NextResponse.json({ matched: false }, { status: 500 });
  }

  return NextResponse.json({ matched: !!data });
}
