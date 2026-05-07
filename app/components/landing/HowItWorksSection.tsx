"use client";

const steps = [
  {
    num: "01",
    title: "Anmelden",
    desc: "Erstelle dein Profil in unter 2 Minuten. Beschreibe deine Firmen, Skills und was du suchst.",
  },
  {
    num: "02",
    title: "Connecten",
    desc: "Entdecke verifizierte Founder. Klicke auf Connect bei Profilen die dich inspirieren — beidseitig wird daraus ein Match.",
  },
  {
    num: "03",
    title: "Wachsen",
    desc: "Chatte mit deinen Matches, gründe gemeinsame Projekte und baue dein Founder-Netzwerk im DACH-Raum auf.",
  },
];

export function HowItWorksSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <section style={{
      padding: isDesktop ? "60px 32px" : "40px 24px",
      position: "relative", zIndex: 1,
      maxWidth: isDesktop ? 1280 : undefined,
      margin: isDesktop ? "0 auto" : undefined,
    }}>
      <div style={{ textAlign: "center", maxWidth: isDesktop ? 700 : undefined, margin: isDesktop ? "0 auto 48px" : "0 0 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 2, marginBottom: 8 }}>SO FUNKTIONIERTS</div>
        <h2 style={{ fontSize: isDesktop ? 40 : 24, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
          In 3 Schritten<br />zum Erfolg
        </h2>
      </div>

      <div style={{
        display: isDesktop ? "grid" : "flex",
        flexDirection: isDesktop ? undefined : "column",
        gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : undefined,
        gap: isDesktop ? 20 : 14,
      }}>
        {steps.map((s) => (
          <div key={s.num} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "20px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -10, right: -10,
              fontSize: 80, fontWeight: 800,
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.05))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              lineHeight: 1, pointerEvents: "none",
            }}>{s.num}</div>
            <div style={{ position: "relative" }}>
              <div style={{
                display: "inline-block", padding: "4px 10px", marginBottom: 10,
                background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#6366f1",
              }}>Schritt {s.num}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
