"use client";

const features = [
  { icon: "◆", title: "Connect", desc: "Sende gezielte Connect-Anfragen an Founder die zu dir und deinen Zielen passen.", color: "#6366f1" },
  { icon: "◈", title: "Match", desc: "Beidseitiges Connect = Match. Nur dann könnt ihr direkt chatten — kein Spam, nur echte Verbindungen.", color: "#8b5cf6" },
  { icon: "◉", title: "Chat", desc: "Direkter Echtzeit-Chat mit deinen Matches. Tausche Ideen, Strategien und Erfahrungen aus.", color: "#ec4899" },
  { icon: "◎", title: "Projekte", desc: "Poste Projekte und finde Mitgründer, Co-Founder oder Partner für dein nächstes Venture.", color: "#10b981" },
];

export function FeaturesSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <section style={{
      padding: isDesktop ? "60px 32px" : "20px 24px 40px",
      position: "relative", zIndex: 1,
      maxWidth: isDesktop ? 1280 : undefined,
      margin: isDesktop ? "0 auto" : undefined,
    }}>
      <div style={{ textAlign: "center", maxWidth: isDesktop ? 700 : undefined, margin: isDesktop ? "0 auto 48px" : "0 0 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 2, marginBottom: 8 }}>FEATURES</div>
        <h2 style={{ fontSize: isDesktop ? 40 : 24, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
          Alles was du brauchst<br />um zu wachsen
        </h2>
      </div>

      <div style={{
        display: isDesktop ? "grid" : "flex",
        flexDirection: isDesktop ? undefined : "column",
        gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined,
        gap: isDesktop ? 20 : 12,
      }}>
        {features.map(f => (
          <div key={f.title} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "18px",
            display: "flex", gap: 14, alignItems: "flex-start",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg, ${f.color}, ${f.color}88)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700,
              boxShadow: `0 4px 16px ${f.color}40`,
            }}>{f.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
