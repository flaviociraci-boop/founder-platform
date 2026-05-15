import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Kontakt — Connectyfind",
  description: "Kontaktmöglichkeiten für die Connectyfind-Plattform der Bodensee-Spiele GmbH.",
};

export default function KontaktPage() {
  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Logo */}
        <a
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 48, textDecoration: "none" }}
        >
          <Image
            src="/connectyfind-logo-light.svg"
            alt="Connectyfind"
            width={32}
            height={32}
            style={{ borderRadius: 8 }}
            quality={100}
          />
          <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>Connectyfind</span>
        </a>

        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 40px", letterSpacing: -0.3 }}>
          Kontakt
        </h1>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: "32px 28px",
          marginBottom: 32,
        }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: "0 0 20px", lineHeight: 1.7 }}>
            Du erreichst uns per E-Mail unter:
          </p>
          <a
            href="mailto:business.flavio.ciraci@gmail.com"
            style={{
              display: "inline-block",
              fontSize: 18,
              fontWeight: 700,
              color: "#6366f1",
              textDecoration: "none",
              letterSpacing: -0.2,
            }}
          >
            business.flavio.ciraci@gmail.com
          </a>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "16px 0 0", lineHeight: 1.6 }}>
            Wir antworten in der Regel innerhalb von 7 Tagen.
          </p>
        </div>

        {/* Back link */}
        <a
          href="/"
          style={{ display: "inline-block", fontSize: 14, color: "#6366f1", textDecoration: "none", fontWeight: 600 }}
        >
          ← Zurück zur Startseite
        </a>
      </div>
    </div>
  );
}
