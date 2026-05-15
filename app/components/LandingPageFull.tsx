"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EmailSignupForm from "@/app/components/EmailSignupForm";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
}

const features = [
  { icon: "◆", title: "Connect", desc: "Sende gezielte Connect-Anfragen an Founder die zu dir und deinen Zielen passen.", color: "#6366f1" },
  { icon: "◈", title: "Match", desc: "Beidseitiges Connect = Match. Nur dann könnt ihr direkt chatten — kein Spam, nur echte Verbindungen.", color: "#8b5cf6" },
  { icon: "◉", title: "Chat", desc: "Direkter Echtzeit-Chat mit deinen Matches. Tausche Ideen, Strategien und Erfahrungen aus.", color: "#ec4899" },
  { icon: "◎", title: "Projekte", desc: "Poste Projekte und finde Mitgründer, Co-Founder oder Partner für dein nächstes Venture.", color: "#10b981" },
];

const steps = [
  { num: "01", title: "Anmelden", desc: "Erstelle dein Profil in unter 2 Minuten. Beschreibe deine Firmen, Skills und was du suchst." },
  { num: "02", title: "Connecten", desc: "Entdecke verifizierte Founder. Klicke auf Connect bei Profilen die dich inspirieren — beidseitig wird daraus ein Match." },
  { num: "03", title: "Wachsen", desc: "Chatte mit deinen Matches, gründe gemeinsame Projekte und baue dein Founder-Netzwerk im DACH-Raum auf." },
];

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

const faqs = [
  { q: "Wer kann sich registrieren?", a: "Connectyfind ist exklusiv für Menschen die wirklich etwas aufgebaut haben — Gründer, Selbstständige, Unternehmer mit echten Firmen oder Projekten. Wir sind kein Networking-Spielplatz für Anfänger ohne Erfahrung." },
  { q: "Wann launcht ihr das Projekt?", a: "Wir arbeiten gerade mit voller Kraft am Projekt. Unser Ziel ist es vom ersten Tag an einen echten Mehrwert zu bieten — deshalb nehmen wir uns die Zeit alles richtig zu machen. Trag dich auf die Waitlist ein und sei der Erste der erfährt wann es losgeht." },
  { q: "Was unterscheidet euch von ähnlichen Plattformen?", a: "Bei uns triffst du echte Founder — Menschen die wirklich etwas aufgebaut haben. Du siehst auf den ersten Blick welche Firmen und Projekte jemand bereits realisiert hat. Hier sind nur Unternehmer die Gas geben und Lust haben gemeinsam zu wachsen. Wir sind keine offene Plattform für jeden — sondern ein exklusives Netzwerk in dem du echte Connections knüpfst, gemeinsam Projekte startest, Co-Working betreibst und die richtigen Leute für dein nächstes Vorhaben findest." },
  { q: "Kann ich jederzeit kündigen?", a: "Ja, jederzeit mit einem Klick — direkt in deinen Einstellungen. Keine Mindestlaufzeit, keine versteckten Kosten." },
  { q: "Werden meine Daten sicher gespeichert?", a: "Absolut. Wir nutzen Supabase mit europäischen Servern und sind DSGVO-konform. Deine Daten gehören dir." },
];

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Direkte Registrierung ist hinter dem Whop-Checkout gegated — alle
  // "Get started"-CTAs führen auf /pricing.
  const goRegister = () => router.push("/pricing");
  const goLogin = () => router.push("/login");
  const scrollToSignup = () => document.getElementById("email-signup")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f", minHeight: "100vh", color: "#fff",
      maxWidth: isDesktop ? "none" : 430,
    margin: "0 auto",
    overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{ position: "fixed", top: -150, right: -150, width: 400, height: 400, background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -150, left: -150, width: 400, height: 400, background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(20px)", background: "rgba(10,10,15,0.7)",
        padding: "14px 20px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/connectyfind-logo-light.svg" alt="Connectyfind Logo" width={64} height={64} className="w-8 h-8 rounded-lg" priority quality={100} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Connectyfind</span>
        </div>
        <button onClick={goLogin} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>Login</button>
      </nav>

      {/* Hero */}
      <section style={{
        padding: isDesktop ? "120px 32px 80px" : "60px 24px 40px",
        position: "relative", zIndex: 1, textAlign: "center",
        maxWidth: isDesktop ? 1280 : undefined,
        margin: isDesktop ? "0 auto" : undefined,
      }}>
        <div style={{ maxWidth: isDesktop ? 900 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
          <div style={{
            display: "inline-block", padding: "6px 14px", marginBottom: 24,
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#6366f1",
          }}>✦ Nur für ernsthafte Founder</div>

          <h1 style={{
            fontSize: isDesktop ? 60 : 36, fontWeight: 800, margin: "0 0 16px",
            lineHeight: isDesktop ? 1.1 : 1.15, letterSpacing: -0.5,
          }}>
            Wo Unternehmer<br />
            <span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              matchen, chatten und<br />gemeinsam wachsen
            </span>
          </h1>

          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 28px", maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
            Die exklusive Plattform für Gründer im DACH-Raum. Verbinde dich mit Menschen die wirklich etwas aufgebaut haben.
          </p>

          <button onClick={goRegister} style={{
            width: "100%", maxWidth: 320, padding: "16px 32px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", color: "#fff", borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
          }}>Jetzt 3 Tage kostenlos starten</button>

          <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Kreditkarte erforderlich · Jederzeit kündbar</p>
        </div>

        {/* Stats */}
        <div style={{
          marginTop: isDesktop ? 60 : 40,
          padding: isDesktop ? "32px 40px" : "20px 16px",
          maxWidth: isDesktop ? 800 : undefined,
          margin: isDesktop ? "60px auto 0" : undefined,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, display: "flex", justifyContent: "space-around",
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>500+</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Verifizierte Founder</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#8b5cf6" }}>250+</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Aktive Projekte</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ec4899" }}>1.2k+</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Matches</div>
          </div>
        </div>
      </section>

      {/* USP */}
      <section style={{ padding: isDesktop ? "60px 32px" : "40px 24px", position: "relative", zIndex: 1, maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 20, padding: isDesktop ? "40px 48px" : "24px 20px",
          maxWidth: isDesktop ? 900 : undefined,
          margin: isDesktop ? "0 auto" : undefined,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 2, marginBottom: 8 }}>
            UNSER VERSPRECHEN
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 14px", lineHeight: 1.3 }}>
            Hier kommen nur echte Founder rein.
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
            Andere Communities sind voll mit Anfängern ohne Erfahrung. Bei uns? Nur Menschen die etwas aufgebaut haben — mit echten Firmen, echten Projekten, echten Resultaten. Du siehst sofort wer ernst meint.
          </p>
        </div>
      </section>

      {/* Email signup — between USP and Features */}
      <section id="email-signup" style={{ padding: "0 24px 40px", display: "flex", justifyContent: "center", position: "relative", zIndex: 1, maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <EmailSignupForm />
      </section>

      {/* Features */}
      <section style={{ padding: isDesktop ? "60px 32px" : "20px 24px 40px", position: "relative", zIndex: 1, maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ textAlign: "center", maxWidth: isDesktop ? 700 : undefined, margin: isDesktop ? "0 auto 48px" : "0 0 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 2, marginBottom: 8 }}>FEATURES</div>
          <h2 style={{ fontSize: isDesktop ? 40 : 24, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            Alles was du brauchst<br />um zu wachsen
          </h2>
        </div>

        <div style={{ display: isDesktop ? "grid" : "flex", flexDirection: isDesktop ? undefined : "column", gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined, gap: isDesktop ? 20 : 12 }}>
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

      {/* How it works */}
      <section style={{ padding: isDesktop ? "60px 32px" : "40px 24px", position: "relative", zIndex: 1, maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ textAlign: "center", maxWidth: isDesktop ? 700 : undefined, margin: isDesktop ? "0 auto 48px" : "0 0 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 2, marginBottom: 8 }}>SO FUNKTIONIERTS</div>
          <h2 style={{ fontSize: isDesktop ? 40 : 24, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            In 3 Schritten<br />zum Erfolg
          </h2>
        </div>

        <div style={{ display: isDesktop ? "grid" : "flex", flexDirection: isDesktop ? undefined : "column", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : undefined, gap: isDesktop ? 20 : 14 }}>
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

      {/* Pricing */}
      <section style={{ padding: isDesktop ? "60px 32px" : "40px 24px", position: "relative", zIndex: 1, maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
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

          <button onClick={scrollToSignup} style={{
            width: "100%", padding: "16px 0",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", color: "#fff", borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
          }}>Auf die Waitlist setzen</button>
          <p style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            100% kostenlos · Kein Spam · Jederzeit abbestellbar
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: isDesktop ? "60px 32px" : "40px 24px", position: "relative", zIndex: 1, maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ textAlign: "center", margin: isDesktop ? "0 0 48px" : "0 0 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 2, marginBottom: 8 }}>FAQ</div>
          <h2 style={{ fontSize: isDesktop ? 40 : 24, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>Häufige Fragen</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: isDesktop ? 800 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, overflow: "hidden",
            }}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} style={{
                width: "100%", padding: "16px 18px",
                background: "none", border: "none", color: "#fff",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                textAlign: "left",
              }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{faq.q}</span>
                <span style={{
                  fontSize: 14, color: "#6366f1", flexShrink: 0,
                  transform: openFaq === i ? "rotate(45deg)" : "none",
                  transition: "transform 0.2s",
                  display: "inline-block",
                }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{
                  padding: "0 18px 16px",
                  fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6,
                }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: isDesktop ? "60px 32px" : "40px 24px", position: "relative", zIndex: 1, maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{
          background: "linear-gradient(160deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 24, padding: isDesktop ? "48px" : "32px 24px", textAlign: "center",
          maxWidth: isDesktop ? 800 : undefined,
          margin: isDesktop ? "0 auto" : undefined,
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🚀</div>
          <h2 style={{ fontSize: isDesktop ? 32 : 22, fontWeight: 700, margin: "0 0 12px", lineHeight: 1.3 }}>
            Bereit dein Netzwerk<br />zu transformieren?
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 22px" }}>
            Schliesse dich Hunderten von Foundern an die bereits gematcht haben.
          </p>
          <button onClick={goRegister} style={{
            width: isDesktop ? "auto" : "100%", padding: "16px 32px",
            maxWidth: isDesktop ? 320 : undefined,
            margin: isDesktop ? "0 auto" : undefined,
            display: isDesktop ? "block" : undefined,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", color: "#fff", borderRadius: 14,
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 8px 20px rgba(99,102,241,0.4)",
          }}>Jetzt 3 Tage kostenlos starten</button>
        </div>
      </section>

      {/* Email signup — before footer */}
      <section style={{ padding: "0 24px 48px", display: "flex", justifyContent: "center", position: "relative", zIndex: 1, maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <EmailSignupForm />
      </section>

      {/* Footer */}
      <footer style={{
        padding: isDesktop ? "40px 32px" : "32px 24px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        position: "relative", zIndex: 1,
        maxWidth: isDesktop ? 1280 : undefined,
        margin: isDesktop ? "0 auto" : undefined,
      }}>
        <div style={{ display: isDesktop ? "flex" : "block", justifyContent: isDesktop ? "space-between" : undefined, alignItems: isDesktop ? "flex-start" : undefined }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Image src="/connectyfind-logo-light.svg" alt="Connectyfind Logo" width={64} height={64} className="w-8 h-8 rounded-lg" quality={100} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Connectyfind</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 20px" }}>
              Die exklusive Plattform für ernsthafte Gründer im DACH-Raum.
            </p>
          </div>
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", fontSize: 12, marginBottom: 20 }}>
              {["AGB", "Datenschutz", "Impressum", "Kontakt"].map((link) => (
                <span key={link} style={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>{link}</span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              © 2026 Connectyfind. Alle Rechte vorbehalten.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
