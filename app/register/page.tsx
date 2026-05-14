import { redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";

// Server-Side Gate: Whop hängt ?status=success an die Redirect-URL an, wenn
// der Checkout erfolgreich war. Ohne diesen Query-Parameter ist /register
// unsichtbar — Direktaufruf landet auf /pricing. Der tatsächliche Schutz
// (Email muss eine echte Whop-Subscription matchen) kommt in der Server-
// Action beim Submit, das hier ist nur die UI-Sichtbarkeit.
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  if (params.status !== "success") {
    redirect("/pricing");
  }
  return <RegisterForm />;
}
