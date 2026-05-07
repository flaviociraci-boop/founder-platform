"use client";

import { useState, useEffect } from "react";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type State = "idle" | "loading" | "success" | "already" | "error";

export default function EmailSignupForm() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = EMAIL_RE.test(email) && agreed && state === "idle";

  const submit = async () => {
    if (!canSubmit) return;
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error ?? "Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        setState("error");
        return;
      }

      setState(data.alreadySubscribed ? "already" : "success");
    } catch {
      setErrorMsg("Keine Verbindung. Bitte versuche es erneut.");
      setState("error");
    }
  };

  const done = state === "success" || state === "already";

  return (
    <div style={{
      maxWidth: isDesktop ? 700 : 420, width: "100%",
      background: "linear-gradient(160deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))",
      border: "1px solid rgba(99,102,241,0.25)",
      borderRadius: 24, padding: isDesktop ? "40px 48px" : "32px 24px",
      margin: isDesktop ? "0 auto" : undefined,
      position: "relative", overflow: "hidden",
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute", top: -80, right: -80, width: 200, height: 200,
        background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {!done ? (
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-block", padding: "5px 12px", marginBottom: 16,
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#6366f1",
            letterSpacing: 1,
          }}>✦ EARLY ACCESS</div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.25 }}>
            Sei der erste<br />
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>der Zugang bekommt</span>
          </h2>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, margin: "0 0 22px" }}>
            Trage dich ein und erhalte als Erster Zugang zur exklusiven Connectyfind sobald wir live gehen.
          </p>

          <div style={{ marginBottom: 12 }}>
            <input
              type="email"
              placeholder="deine@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              style={{
                width: "100%", padding: "14px 16px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${state === "error" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 12, color: "#fff",
                fontSize: 14, outline: "none", boxSizing: "border-box",
                fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
            <div
              onClick={() => setAgreed(!agreed)}
              style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
                background: agreed ? "#6366f1" : "transparent",
                border: agreed ? "none" : "1px solid rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 11, color: "#fff",
                transition: "all 0.15s",
              }}
            >{agreed ? "✓" : ""}</div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
              Ich möchte Updates erhalten und akzeptiere die{" "}
              <span style={{ color: "#6366f1", cursor: "pointer", textDecoration: "underline" }}>Datenschutzerklärung</span>.
            </p>
          </div>

          {state === "error" && (
            <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 12px" }}>{errorMsg}</p>
          )}

          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              width: "100%", padding: "14px 0",
              background: canSubmit
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "rgba(255,255,255,0.06)",
              border: "none", color: "#fff", borderRadius: 12,
              fontSize: 14, fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: state === "loading" ? 0.7 : canSubmit ? 1 : 0.5,
              boxShadow: canSubmit ? "0 8px 20px rgba(99,102,241,0.35)" : "none",
              transition: "all 0.2s",
            }}
          >
            {state === "loading" ? "Wird eingetragen…" : "Early Access sichern →"}
          </button>

          <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            100% kostenlos · Kein Spam · Jederzeit abbestellbar
          </p>
        </div>
      ) : (
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "20px 0" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: "0 auto 20px",
            background: state === "already"
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "linear-gradient(135deg, #10b981, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32,
          }}>
            {state === "already" ? "✦" : "✓"}
          </div>

          {state === "already" ? (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 12px", lineHeight: 1.3 }}>
                Du bist bereits dabei!
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: "#fff" }}>{email}</strong> ist bereits auf der Early-Access-Liste. Wir melden uns sobald wir live gehen.
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 12px", lineHeight: 1.3 }}>
                Fast geschafft!
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 20px" }}>
                Wir haben dir eine Bestätigungsmail an{" "}
                <strong style={{ color: "#fff" }}>{email}</strong> geschickt. Klicke auf den Link um deine Anmeldung abzuschließen.
              </p>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "14px 16px",
                fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5,
              }}>
                💡 Tipp: Schau auch im Spam-Ordner nach falls du die E-Mail nicht findest.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
