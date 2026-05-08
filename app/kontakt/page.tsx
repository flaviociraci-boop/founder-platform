import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Kontakt — Connectyfind",
};

export default function KontaktPage() {
  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 20px 80px",
    }}>
      <div style={{ width: "100%", maxWidth: 600 }}>
        {/* Logo */}
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 48, textDecoration: "none" }}>
          <Image src="/logo-icon.png" alt="Connectyfind" width={64} height={64} className="w-8 h-8 rounded-lg" quality={100} />
          <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>Connectyfind</span>
        </a>

        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 32px", letterSpacing: -0.3 }}>Kontakt</h1>

        <div style={{
          background: "rgba(99,102,241,0.07)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 16,
          padding: "24px 28px",
          fontSize: 14,
          color: "rgba(255,255,255,0.65)",
          lineHeight: 1.7,
        }}>
          <p style={{ margin: "0 0 14px" }}>
            Diese Seite wird derzeit erstellt und ist in Kürze verfügbar. Wir befinden uns aktuell in der Early-Access-Phase und arbeiten an der vollständigen Dokumentation.
          </p>
          <p style={{ margin: 0 }}>
            Für Fragen erreichst du uns unter{" "}
            <a href="mailto:mail@connectyfind.com" style={{ color: "#6366f1", textDecoration: "underline" }}>
              mail@connectyfind.com
            </a>
          </p>
        </div>

        <a href="/" style={{
          display: "inline-block", marginTop: 40,
          fontSize: 14, color: "#6366f1", textDecoration: "none", fontWeight: 600,
        }}>← Zurück zur Startseite</a>
      </div>
    </div>
  );
}
