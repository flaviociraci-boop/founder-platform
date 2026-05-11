import type { Metadata } from "next";
import Image from "next/image";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Preise — Connectyfind",
  description: "Connectyfind Pro — Das Founder-Netzwerk für den DACH-Raum.",
};

const MONTHLY_URL = "https://whop.com/checkout/plan_guzJNAzucfCXz";
const YEARLY_URL = "https://whop.com/checkout/plan_x7IVn5qGLXsfM";

const features = [
  "Unbegrenzte Connect-Anfragen",
  "Echtzeit-Chat mit Connections",
  "Projekte veröffentlichen & bewerben",
  "Vollständiges Matching-System",
  "Profil mit Kategorien & Tags",
];

export default function PricingPage() {
  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      padding: "0 0 60px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "fixed", top: -150, left: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -150, right: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 500, margin: "0 auto", padding: "0 20px" }}>
        {/* Nav */}
        <div style={{ padding: "20px 0 0" }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Image src="/logo-icon.png" alt="Connectyfind" width={32} height={32} style={{ borderRadius: 8 }} quality={100} />
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>Connectyfind</span>
          </a>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "48px 0 32px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            Wähle deinen Plan
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            3 Tage kostenlos testen — kein Risiko
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Monthly */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 24,
          }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                Monatlich
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>$29</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/Monat</span>
              </div>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {features.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                  <Check size={15} color="#10b981" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={MONTHLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", padding: "15px 0", borderRadius: 14,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "center",
                textDecoration: "none",
              }}
            >
              3 Tage gratis starten
            </a>
          </div>

          {/* Yearly */}
          <div style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 20,
            padding: 24,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -12, right: 20,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", fontSize: 11, fontWeight: 700,
              padding: "4px 12px", borderRadius: 20, letterSpacing: 0.5,
            }}>
              SPARE 28%
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                Jährlich
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>$249</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/Jahr</span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>≈ $20.75/Monat</div>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {features.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                  <Check size={15} color="#10b981" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={YEARLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", padding: "15px 0", borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "center",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
              }}
            >
              3 Tage gratis starten
            </a>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 20, lineHeight: 1.6 }}>
          Mit Klick wirst du zu unserem sicheren Zahlungspartner Whop weitergeleitet.
        </p>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a href="/" style={{ fontSize: 14, color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
            ← Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
