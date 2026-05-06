"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
  padding: "13px 16px", color: "#fff", fontSize: 15, outline: "none",
  boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
};
const lbl: React.CSSProperties = {
  fontSize: 12, color: "rgba(255,255,255,0.38)", textTransform: "uppercase",
  letterSpacing: 1, display: "block", marginBottom: 8, fontWeight: 600,
};

export default function PasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const save = async () => {
    if (!currentPw) { setError("Bitte aktuelles Passwort eingeben."); return; }
    if (newPw.length < 6) { setError("Neues Passwort muss mindestens 6 Zeichen haben."); return; }
    if (newPw !== confirmPw) { setError("Passwörter stimmen nicht überein."); return; }
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email, password: currentPw,
      });
      if (authErr) {
        setError("Aktuelles Passwort ist falsch.");
        setLoading(false);
        return;
      }
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (updateErr) {
      setError(updateErr.message);
    } else {
      setDone(true);
      setTimeout(() => router.back(), 1800);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#0a0a0f", minHeight: "100vh", color: "#fff" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
        background: "rgba(10,10,15,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.back()} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, width: 36, height: 36, color: "#fff", cursor: "pointer",
          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
        }}>←</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Passwort ändern</span>
      </div>

      <div style={{ padding: "32px 20px" }}>
        {done ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>Passwort geändert!</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>Du wirst zurückgeleitet…</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Aktuelles Passwort</label>
              <input
                type="password" value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••" style={inp}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Neues Passwort</label>
              <input
                type="password" value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••" style={inp}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>Passwort bestätigen</label>
              <input
                type="password" value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="••••••••" style={inp}
              />
            </div>

            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: 12, marginBottom: 16,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171", fontSize: 14,
              }}>{error}</div>
            )}

            <button
              onClick={save} disabled={loading}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
                color: "#fff", fontWeight: 700, fontSize: 16, cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >{loading ? "Prüfe…" : "Passwort ändern"}</button>
          </>
        )}
      </div>
    </div>
  );
}
