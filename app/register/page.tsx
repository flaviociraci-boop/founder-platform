import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import RegisterForm from "./RegisterForm";

const ONE_HOUR_MS = 60 * 60 * 1000;

// Server-Side Gate: Whop hängt ?status=success an die Redirect-URL an, wenn
// der Checkout erfolgreich war. Ohne diesen Query-Parameter ist /register
// unsichtbar — Direktaufruf landet auf /pricing. Der tatsächliche Schutz
// (Email muss eine echte Whop-Subscription matchen) kommt in der Server-
// Action beim Submit, das hier ist nur die UI-Sichtbarkeit.
//
// Zusätzlich: Wenn Whop ?payment_id=… mitgibt, lookupen wir die zugehörige
// Sub-Row (per service-role) und füllen das Email-Feld vorab aus. Fehlt
// payment_id oder findet sich keine Row (z.B. Webhook-Race), fällt das
// Form auf manuelles Tippen zurück.
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment_id?: string }>;
}) {
  const params = await searchParams;
  if (params.status !== "success") {
    redirect("/pricing");
  }

  let prefilledEmail = "";
  if (params.payment_id) {
    const admin = createServiceRoleClient();
    const oneHourAgoIso = new Date(Date.now() - ONE_HOUR_MS).toISOString();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("whop_user_email")
      .eq("whop_payment_id", params.payment_id)
      .is("user_id", null)
      .gt("created_at", oneHourAgoIso)
      .maybeSingle();
    if (sub?.whop_user_email) {
      prefilledEmail = sub.whop_user_email;
    }
  }

  return <RegisterForm prefilledEmail={prefilledEmail} />;
}
