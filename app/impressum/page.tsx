import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Impressum — Connectyfind",
  description: "Impressum der Connectyfind-Plattform der Bodensee-Spiele GmbH.",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}

export default function ImpressumPage() {
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
          Impressum
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 40px" }}>
          Angaben gemäss Schweizer Recht und § 5 TMG (Deutschland)
        </p>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: "28px 28px",
          marginBottom: 32,
        }}>
          <Section label="Anbieter">
            Bodensee-Spiele GmbH<br />
            Hauptstrasse 4<br />
            8280 Kreuzlingen<br />
            Schweiz
          </Section>

          <Section label="Vertretung">
            Vertretungsberechtigt: Flavio Ciraci<br />
            Handelsregister: Thurgau, CHE-195.187.021<br />
            UID: CHE-195.187.021
          </Section>

          <Section label="Kontakt">
            E-Mail:{" "}
            <a
              href="mailto:business.flavio.ciraci@gmail.com"
              style={{ color: "#6366f1", textDecoration: "none" }}
            >
              business.flavio.ciraci@gmail.com
            </a>
          </Section>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0 24px" }} />

          <Section label="Angebot">
            Connectyfind ist ein Angebot der Bodensee-Spiele GmbH.
          </Section>

          <Section label="Verantwortlich für den Inhalt">
            Flavio Ciraci<br />
            Bodensee-Spiele GmbH<br />
            Hauptstrasse 4<br />
            8280 Kreuzlingen<br />
            Schweiz
          </Section>

          <Section label="Haftungsausschluss">
            Die Inhalte unserer Seiten wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          </Section>

          <Section label="Urheberrecht">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem Schweizer Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.
          </Section>
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
