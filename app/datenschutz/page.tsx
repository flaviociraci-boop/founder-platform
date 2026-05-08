import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — Connectyfind",
  description: "Datenschutzerklärung der Connectyfind-Plattform der Bodensee-Spiele GmbH.",
};

export default function DatenschutzPage() {
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
            src="/logo-icon.png"
            alt="Connectyfind"
            width={32}
            height={32}
            style={{ borderRadius: 8 }}
            quality={100}
          />
          <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>Connectyfind</span>
        </a>

        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", letterSpacing: -0.3 }}>
          Datenschutzerklärung
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 36px" }}>
          Bodensee-Spiele GmbH · Stand: {new Date().getFullYear()}
        </p>

        {/* iubenda inline embed */}
        <div style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.75)" }}>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="https://www.iubenda.com/privacy-policy/19358914"
            className="iubenda-white iubenda-noiframe iubenda-embed iub-body-embed"
            title="Datenschutzerklärung"
          >
            Datenschutzerklärung
          </a>
        </div>

        <Script
          id="iubenda-privacy-loader"
          src="https://cdn.iubenda.com/iubenda.js"
          strategy="afterInteractive"
        />

        {/* Cookie link */}
        <div style={{
          marginTop: 32,
          padding: "16px 20px",
          background: "rgba(99,102,241,0.07)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 14,
        }}>
          <a
            href="/cookie-richtlinie"
            style={{ fontSize: 14, color: "#6366f1", textDecoration: "none", fontWeight: 600 }}
          >
            Cookie-Richtlinie ansehen →
          </a>
        </div>

        {/* Back link */}
        <a
          href="/"
          style={{ display: "inline-block", marginTop: 40, fontSize: 14, color: "#6366f1", textDecoration: "none", fontWeight: 600 }}
        >
          ← Zurück zur Startseite
        </a>
      </div>
    </div>
  );
}
