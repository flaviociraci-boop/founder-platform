"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (password.length < 6) { setError("Passwort muss mindestens 6 Zeichen lang sein."); return; }
    if (password !== confirm) { setError("Passwörter stimmen nicht überein."); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/"), 2000);
    }
    setLoading(false);
  };

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
    }}>
      <div style={{ position: "fixed", top: -150, left: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -150, right: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image
            src="/connectyfind-logo-light.svg"
            alt="Connectyfind"
            width={40}
            height={40}
            style={{ borderRadius: 12, margin: "0 auto 12px", display: "block" }}
            quality={100}
          />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: "#fff" }}>
            Connectyfind
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            {done ? "Passwort gesetzt! ✓" : "Neues Passwort wählen"}
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 28,
        }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.7)" }}>
                Passwort erfolgreich geändert. Du wirst weitergeleitet…
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
                  Neues Passwort
                </label>
                <input type="password" placeholder="••••••••" style={inputStyle}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
                  Passwort bestätigen
                </label>
                <input type="password" placeholder="••••••••" style={inputStyle}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>

              {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}

              <button onClick={handleReset} disabled={loading} style={{
                width: "100%", padding: "15px 0", borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none", color: "#fff", fontWeight: 700, fontSize: 16,
                cursor: "pointer", opacity: loading ? 0.7 : 1,
              }}>
                {loading ? "Speichern..." : "Passwort speichern"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
