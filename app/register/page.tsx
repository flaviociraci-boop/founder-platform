import RegisterForm from "./RegisterForm";

// Connectyfind ist seit Juni 2026 kostenlos — kein Bezahl-Gate mehr,
// kein status/payment_id-Param. Direktaufruf von /register reicht.
// Die einzige Eintrittshürde ist die Email-DOI (verifyOtp in
// /auth/callback) nach der Registrierung.
export default function RegisterPage() {
  return <RegisterForm prefilledEmail="" />;
}
