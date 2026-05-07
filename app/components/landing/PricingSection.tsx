"use client";

const proFeatures = [
  "Unbegrenzt Connecten",
  "Direkte Chats mit allen Matches",
  "Unbegrenzt Co-Working Projekte posten",
  "Verified Founder Badge ✓",
  "Exklusiver Zugang zu erfolgreichen Unternehmern",
  "Exklusiver Zugang zu Founder-Projekten",
  "Starte Projekte mit Foundern aus deiner Region",
  "Priority Support",
];

export function PricingSection({
  isDesktop,
  onScrollToSignup,
}: {
  isDesktop: boolean;
  onScrollToSignup?: () => void;
}) {
  return (
    <section style={{
      padding: isDesktop ? "60px 32px" : "40px 24px",
      position: "relative", zIndex: 1,
      maxWidth: isDesktop ? 1280 : undefined,
      margin: isDesktop ? "0 auto" : undefined,
    }}>
      <div style={{ textAlign: "center", margin: isDesktop ? "0 0 48px" : "0 0 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 2, marginBottom: 8 }}>PREISE</div>
        <h2 style={{ fontSize: isDesktop ? 40 : 24, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>Einfach & transparent</h2>
      </div>

      <div style={{
        background: "linear-gradient(160deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))",
        border: "2px solid rgba(99,102,241,0.4)",
        borderRadius: 24, padding: isDesktop ? "40px" : "28px 22px", position: "relative",
        maxWidth: isDesktop ? 600 : undefined,
        margin: isDesktop ? "0 auto" : undefined,
      }}>
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          padding: "5px 14px", borderRadius: 20,
          fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
        }}>FOUNDING MEMBERS</div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>Pro Plan</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5 }}>Coming Soon</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 10, lineHeight: 1.5 }}>
            Early Access Preis wird bald verkündet —<br />Founding Member sichern sich Vorzugskonditionen
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {proFeatures.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#6366f1",
              }}>✓</div>
              <span style={{ color: "rgba(255,255,255,0.85)" }}>{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onScrollToSignup}
          style={{
            width: "100%", padding: "16px 0",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", color: "#fff", borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
          }}
        >Auf die Waitlist setzen</button>
        <p style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          100% kostenlos · Kein Spam · Jederzeit abbestellbar
        </p>
      </div>
    </section>
  );
}
