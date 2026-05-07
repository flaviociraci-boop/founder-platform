"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Rocket, Users, MessageCircle, TrendingUp, ChevronDown } from "lucide-react";
import WaitlistForm from "@/app/components/WaitlistForm";

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
  {
    Icon: Users,
    title: "Verifizierte Connects",
    desc: "Echte Unternehmer, keine Recruiter, keine Fake-Profile. Jedes Profil wird verifiziert.",
  },
  {
    Icon: MessageCircle,
    title: "Direkte Gespräche",
    desc: "Statt LinkedIn-Spam: Direkter Chat mit anderen Foundern auf Augenhöhe. Realtime.",
  },
  {
    Icon: TrendingUp,
    title: "Gemeinsam wachsen",
    desc: "Finde Co-Founder für dein nächstes Projekt. Veröffentliche eigene Projekte. Bewirb dich auf andere.",
  },
];

const faqs = [
  {
    q: "Wann startet Connectyfind?",
    a: "Wir launchen in Kürze. Trag dich ein, dann bist du der erste der Bescheid weiß.",
  },
  {
    q: "Was kostet Connectyfind?",
    a: "In der Early-Access-Phase komplett kostenlos. Später wird es einen Pro-Plan geben — aber Early-Access-Member behalten Zugriff zu Sonderkonditionen.",
  },
  {
    q: "Wer kann mitmachen?",
    a: "Verifizierte Founder, Selbstständige und Unternehmer aus dem DACH-Raum. Keine Anfänger, keine Recruiter.",
  },
  {
    q: "Wie unterscheidet ihr euch von LinkedIn?",
    a: "Wir bauen explizit keine 'Karriere-Plattform'. Bei uns geht es um echte Connections zwischen Unternehmern — nicht um Sales-Pitches und Spam.",
  },
  {
    q: "Wie sicher sind meine Daten?",
    a: "Server in der EU. DSGVO-konform. Keine Datenweitergabe an Dritte.",
  },
];

const footerLinks = ["Impressum", "Datenschutz", "AGB", "Kontakt"];

export default function LandingPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const inner: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: isDesktop ? "0 48px" : "0 20px",
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
    }}>
      {/* Background glows */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 500, height: 500,
        background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -200, left: -200, width: 500, height: 500,
        background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ ...inner, paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image
                src="/logo-icon.png"
                alt="Connectyfind"
                width={64}
                height={64}
                className="w-8 h-8 rounded-lg"
                priority
                quality={100}
              />
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>Connectyfind</span>
            </div>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isDesktop && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px",
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 20,
                  fontSize: 12, fontWeight: 600, color: "#6366f1",
                }}>
                  <Rocket size={12} />
                  Early Access
                </div>
              )}
              <button
                onClick={() => router.push("/login")}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", padding: "7px 16px", borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >Login</button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        padding: isDesktop ? "100px 0 90px" : "56px 0 52px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ ...inner, textAlign: "center" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "6px 14px", marginBottom: 28,
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#6366f1",
          }}>
            <Rocket size={13} />
            Early Access — Bald verfügbar
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: isDesktop ? 64 : 38,
            fontWeight: 800,
            margin: "0 0 18px",
            lineHeight: isDesktop ? 1.08 : 1.15,
            letterSpacing: -0.5,
            maxWidth: isDesktop ? 820 : undefined,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Wo Unternehmer{" "}
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              matchen, chatten und gemeinsam wachsen
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: isDesktop ? 17 : 15,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.65,
            margin: "0 0 36px",
            maxWidth: isDesktop ? 520 : 340,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Die exklusive Founder-Community für den DACH-Raum.
            Verifiziert. Ohne Recruiter-Spam. Bald live.
          </p>

          {/* Waitlist form */}
          <div
            id="waitlist"
            style={{
              maxWidth: isDesktop ? 480 : undefined,
              margin: "0 auto",
              textAlign: "left",
            }}
          >
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* 3 FEATURES */}
      <section style={{ padding: isDesktop ? "72px 0" : "48px 0", position: "relative", zIndex: 1 }}>
        <div style={inner}>
          <div style={{
            display: isDesktop ? "grid" : "flex",
            flexDirection: isDesktop ? undefined : "column",
            gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : undefined,
            gap: isDesktop ? 24 : 14,
          }}>
            {features.map((f, i) => {
              const hovered = hoveredFeature === i;
              return (
                <div
                  key={f.title}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  style={{
                    background: hovered ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${hovered ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 20,
                    padding: isDesktop ? "32px 28px" : "24px 20px",
                    transition: "background 0.2s, border-color 0.2s",
                    cursor: "default",
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, marginBottom: 20,
                    background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <f.Icon size={26} color="#6366f1" strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: isDesktop ? "72px 0" : "48px 0", position: "relative", zIndex: 1 }}>
        <div style={inner}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: isDesktop ? 48 : 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 2, marginBottom: 10 }}>
                FAQ
              </div>
              <h2 style={{ fontSize: isDesktop ? 40 : 26, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: -0.3 }}>
                Häufige Fragen
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    style={{
                      background: isOpen ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isOpen ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 14, overflow: "hidden",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: "100%", padding: isDesktop ? "18px 22px" : "16px 18px",
                        background: "none", border: "none", color: "#fff",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                        textAlign: "left",
                      }}
                    >
                      <span style={{ flex: 1, fontSize: isDesktop ? 15 : 14, fontWeight: 600, lineHeight: 1.4 }}>
                        {faq.q}
                      </span>
                      <ChevronDown
                        size={17}
                        color="#6366f1"
                        style={{
                          flexShrink: 0,
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: isDesktop ? "0 22px 18px" : "0 18px 16px",
                        fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.65,
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECOND CTA */}
      <section style={{ padding: isDesktop ? "72px 0 96px" : "48px 0 72px", position: "relative", zIndex: 1 }}>
        <div style={inner}>
          <div style={{
            maxWidth: 600, margin: "0 auto",
            background: "linear-gradient(160deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 24,
            padding: isDesktop ? "52px 48px" : "36px 24px",
          }}>
            <h2 style={{
              fontSize: isDesktop ? 30 : 22,
              fontWeight: 800, margin: "0 0 10px", lineHeight: 1.25,
              textAlign: "center", letterSpacing: -0.3,
            }}>
              Bereit für eine Founder-Community ohne Recruiter-Spam?
            </h2>
            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6,
              textAlign: "center", margin: "0 0 28px",
            }}>
              Trag dich jetzt ein und sei dabei wenn wir launchen.
            </p>
            <WaitlistForm compact />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        position: "relative", zIndex: 1,
        padding: isDesktop ? "36px 0" : "28px 0",
      }}>
        <div style={inner}>
          <div style={{
            display: "flex",
            flexDirection: isDesktop ? "row" : "column",
            alignItems: isDesktop ? "center" : "flex-start",
            justifyContent: "space-between",
            gap: 20,
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image
                src="/logo-icon.png"
                alt="Connectyfind"
                width={64}
                height={64}
                className="w-7 h-7 rounded-lg"
                quality={100}
              />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Connectyfind</span>
            </div>

            {/* Links */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
              {footerLinks.map((link) => (
                <a
                  key={link}
                  href={`/${link.toLowerCase()}`}
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              © {new Date().getFullYear()} Connectyfind
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
