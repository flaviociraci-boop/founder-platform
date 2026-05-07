"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "forgot" | "forgot-sent";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14,
  padding: "14px 16px",
  color: "#fff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "15px 0",
  borderRadius: 14,
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  border: "none",
  color: "#fff",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 8,
};

const label: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.4)",
  textTransform: "uppercase",
  letterSpacing: 1,
  display: "block",
  marginBottom: 6,
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleLogin = async () => {
    if (!email || !password) { setError("Bitte alle Felder ausfüllen."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("E-Mail oder Passwort falsch.");
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleForgot = async () => {
    if (!email) { setError("Bitte Email eingeben."); return; }
    setLoading(true);
    setError("");
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    setMode("forgot-sent");
    setLoading(false);
  };

  const subtitle =
    mode === "login" ? "Willkommen zurück 👋"
    : mode === "forgot-sent" ? "Email gesendet!"
    : "Passwort zurücksetzen";

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "fixed", top: -150, left: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -150, right: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
          }}>◈</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
            Founder<span style={{ color: "#6366f1" }}>Connect</span>
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{subtitle}</p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 28,
        }}>
          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={label}>Email</label>
                <input type="email" placeholder="deine@email.com" style={inputStyle}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={label}>Passwort</label>
                <input type="password" placeholder="••••••••" style={inputStyle}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
              <div style={{ textAlign: "right", marginBottom: 20 }}>
                <span onClick={() => { setMode("forgot"); setError(""); }}
                  style={{ fontSize: 13, color: "#6366f1", cursor: "pointer" }}>
                  Passwort vergessen?
                </span>
              </div>

              {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</p>}

              <button onClick={handleLogin} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Einloggen..." : "Einloggen"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>oder</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>

              <button onClick={handleGoogle} style={{
                ...btnPrimary,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                marginTop: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}>
                <GoogleIcon />
                Mit Google einloggen
              </button>

              <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                Noch kein Zugang?{" "}
                <a href="/#waitlist" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
                  Trag dich auf die Waitlist ein →
                </a>
              </p>
            </div>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <div>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                Gib deine Email ein — wir schicken dir einen Link zum Zurücksetzen.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={label}>Email</label>
                <input type="email" placeholder="deine@email.com" style={inputStyle}
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button onClick={handleForgot} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sende..." : "Link senden"}
              </button>
              <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                <span onClick={() => { setMode("login"); setError(""); }}
                  style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>
                  ← Zurück zum Login
                </span>
              </p>
            </div>
          )}

          {/* ── FORGOT SENT ── */}
          {mode === "forgot-sent" && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 17 }}>Email ist unterwegs!</p>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                Prüfe dein Postfach und klicke auf den Link um dein Passwort zurückzusetzen.
              </p>
              <span onClick={() => { setMode("login"); setError(""); }}
                style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                ← Zurück zum Login
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
