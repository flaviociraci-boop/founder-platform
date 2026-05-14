import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Willkommen bei Pro — Connectyfind",
};

export default async function WelcomeProPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string }>;
}) {
  // payment_id durchreichen, damit /register die Email aus der Sub-Row
  // lookupen und vorausfüllen kann. Fehlt sie, fällt /register auf
  // manuelles Tippen zurück.
  const params = await searchParams;
  const paymentId = params.payment_id;
  const registerHref = `/register?status=success${
    paymentId ? `&payment_id=${encodeURIComponent(paymentId)}` : ""
  }`;

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "fixed", top: -150, left: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -150, right: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image
            src="/logo-icon.png"
            alt="Connectyfind"
            width={40}
            height={40}
            style={{ borderRadius: 12, margin: "0 auto 12px", display: "block" }}
            quality={100}
          />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Connectyfind</h1>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 32,
          textAlign: "center",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <CheckCircle size={36} color="#10b981" strokeWidth={1.5} />
          </div>

          <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>
            Willkommen bei Connectyfind Pro! 🎉
          </h2>
          <p style={{ margin: "0 0 10px", fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            Deine Zahlung war erfolgreich. Dein Pro-Zugang ist jetzt aktiv.
          </p>
          <p style={{ margin: "0 0 28px", fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
            Es kann ein paar Sekunden dauern bis dein Pro-Status überall aktiv ist.
          </p>

          <a
            href={registerHref}
            style={{
              display: "block", padding: "15px 0", borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", fontWeight: 700, fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            }}
          >
            Profil einrichten →
          </a>
        </div>
      </div>
    </div>
  );
}
