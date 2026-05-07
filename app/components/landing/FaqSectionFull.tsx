"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Wer kann sich registrieren?",
    a: "Connectyfind ist exklusiv für Menschen die wirklich etwas aufgebaut haben — Gründer, Selbstständige, Unternehmer mit echten Firmen oder Projekten. Wir sind kein Networking-Spielplatz für Anfänger ohne Erfahrung.",
  },
  {
    q: "Wann launcht ihr das Projekt?",
    a: "Wir arbeiten gerade mit voller Kraft am Projekt. Unser Ziel ist es vom ersten Tag an einen echten Mehrwert zu bieten — deshalb nehmen wir uns die Zeit alles richtig zu machen. Trag dich auf die Waitlist ein und sei der Erste der erfährt wann es losgeht.",
  },
  {
    q: "Was unterscheidet euch von ähnlichen Plattformen?",
    a: "Bei uns triffst du echte Founder — Menschen die wirklich etwas aufgebaut haben. Du siehst auf den ersten Blick welche Firmen und Projekte jemand bereits realisiert hat. Hier sind nur Unternehmer die Gas geben und Lust haben gemeinsam zu wachsen. Wir sind keine offene Plattform für jeden — sondern ein exklusives Netzwerk in dem du echte Connections knüpfst, gemeinsam Projekte startest, Co-Working betreibst und die richtigen Leute für dein nächstes Vorhaben findest.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja, jederzeit mit einem Klick — direkt in deinen Einstellungen. Keine Mindestlaufzeit, keine versteckten Kosten.",
  },
  {
    q: "Werden meine Daten sicher gespeichert?",
    a: "Absolut. Wir nutzen Supabase mit europäischen Servern und sind DSGVO-konform. Deine Daten gehören dir.",
  },
];

export function FaqSectionFull({ isDesktop }: { isDesktop: boolean }) {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section style={{
      padding: isDesktop ? "60px 32px" : "40px 24px",
      position: "relative", zIndex: 1,
      maxWidth: isDesktop ? 1280 : undefined,
      margin: isDesktop ? "0 auto" : undefined,
    }}>
      <div style={{ textAlign: "center", margin: isDesktop ? "0 0 48px" : "0 0 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 2, marginBottom: 8 }}>FAQ</div>
        <h2 style={{ fontSize: isDesktop ? 40 : 24, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>Häufige Fragen</h2>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        maxWidth: isDesktop ? 800 : undefined,
        margin: isDesktop ? "0 auto" : undefined,
      }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, overflow: "hidden",
          }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              style={{
                width: "100%", padding: "16px 18px",
                background: "none", border: "none", color: "#fff",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                textAlign: "left",
              }}
            >
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{faq.q}</span>
              <span style={{
                fontSize: 14, color: "#6366f1", flexShrink: 0,
                transform: openFaq === i ? "rotate(45deg)" : "none",
                transition: "transform 0.2s",
                display: "inline-block",
              }}>+</span>
            </button>
            {openFaq === i && (
              <div style={{ padding: "0 18px 16px", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
