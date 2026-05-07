"use client";

import { useState } from "react";
import { Mail, ArrowRight, Check } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type State = "idle" | "loading" | "success" | "already" | "error";

export default function WaitlistForm({ compact = false }: { compact?: boolean }) {
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

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: compact ? "16px 0" : "24px 0" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
          background: "linear-gradient(135deg, #10b981, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={24} color="#fff" strokeWidth={2.5} />
        </div>
        {state === "already" ? (
          <>
            <p style={{ fontWeight: 700, fontSize: 17, margin: "0 0 8px", color: "#fff" }}>
              Du bist bereits dabei!
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "#fff" }}>{email}</strong> ist bereits auf der Early-Access-Liste.
              Wir melden uns sobald wir live gehen.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 700, fontSize: 17, margin: "0 0 8px", color: "#fff" }}>
              Fast geschafft!
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: "0 0 16px", lineHeight: 1.6 }}>
              Wir haben dir eine Bestätigungsmail an{" "}
              <strong style={{ color: "#fff" }}>{email}</strong> geschickt.
              Klicke auf den Link um deine Anmeldung abzuschließen.
            </p>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "12px 16px",
              fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, textAlign: "left",
            }}>
              Schau auch im Spam-Ordner nach falls du die E-Mail nicht findest.
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Email input with icon */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <div style={{
          position: "absolute", left: compact ? 13 : 15,
          top: "50%", transform: "translateY(-50%)",
          pointerEvents: "none", display: "flex", alignItems: "center",
        }}>
          <Mail size={compact ? 15 : 17} color="rgba(255,255,255,0.3)" />
        </div>
        <input
          type="email"
          placeholder="deine@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={{
            width: "100%",
            padding: compact ? "12px 14px 12px 40px" : "14px 16px 14px 46px",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${state === "error" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 14,
            color: "#fff",
            fontSize: compact ? 14 : 15,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "'DM Sans', sans-serif",
            transition: "border-color 0.15s",
          }}
        />
      </div>

      {/* DSGVO checkbox */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
        <div
          onClick={() => setAgreed(!agreed)}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
            background: agreed ? "#6366f1" : "transparent",
            border: agreed ? "none" : "1px solid rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {agreed && <Check size={11} color="#fff" strokeWidth={3} />}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
          Ich möchte Updates erhalten und akzeptiere die{" "}
          <a href="/datenschutz" style={{ color: "#6366f1", textDecoration: "underline" }}>
            Datenschutzerklärung
          </a>.
        </p>
      </div>

      {state === "error" && (
        <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 12px" }}>{errorMsg}</p>
      )}

      {/* Submit button */}
      <button
        onClick={submit}
        disabled={!canSubmit}
        style={{
          width: "100%",
          padding: compact ? "13px 0" : "15px 0",
          background: canSubmit
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "rgba(255,255,255,0.06)",
          border: "none",
          color: "#fff",
          borderRadius: 14,
          fontSize: compact ? 14 : 15,
          fontWeight: 700,
          cursor: canSubmit ? "pointer" : "not-allowed",
          opacity: state === "loading" ? 0.7 : canSubmit ? 1 : 0.5,
          boxShadow: canSubmit ? "0 8px 20px rgba(99,102,241,0.35)" : "none",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {state === "loading" ? "Wird eingetragen…" : (
          <>
            Auf die Waitlist
            <ArrowRight size={16} strokeWidth={2.5} />
          </>
        )}
      </button>

      <p style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
        Sei einer der ersten. Komplett kostenlos für Early-Access-Member.
      </p>
    </div>
  );
}
