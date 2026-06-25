"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { createClient, SUPABASE_URL } from "@/utils/supabase/client";

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
  padding: "13px 16px", color: "#fff", fontSize: 15, outline: "none",
  boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
  letterSpacing: 1,
};
const lbl: React.CSSProperties = {
  fontSize: 12, color: "rgba(255,255,255,0.38)", textTransform: "uppercase",
  letterSpacing: 1, display: "block", marginBottom: 8, fontWeight: 600,
};

const CONFIRM_WORD = "LÖSCHEN";

export default function DeleteAccountPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canDelete || loading) return;
    setLoading(true);
    setError("");

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (sessionErr || !accessToken) {
      setError("Keine aktive Sitzung. Bitte erneut einloggen.");
      setLoading(false);
      return;
    }

    let res: Response;
    try {
      res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: "{}",
      });
    } catch (e) {
      console.error("delete-account fetch failed", e);
      setError("Netzwerkfehler. Bitte später erneut versuchen.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json())?.error ?? ""; } catch {}
      console.error("delete-account responded", res.status, detail);
      setError(
        detail === "invalid_token"
          ? "Sitzung ungültig. Bitte erneut einloggen."
          : "Löschen fehlgeschlagen. Bitte später erneut versuchen.",
      );
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1800);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#0a0a0f", minHeight: "100vh", color: "#fff" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
        background: "rgba(10,10,15,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          disabled={loading}
          style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, width: 36, height: 36, color: "#fff",
            cursor: loading ? "default" : "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >←</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Account löschen</span>
      </div>

      <div style={{ padding: "28px 20px", maxWidth: 560, margin: "0 auto" }}>
        {done ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <CheckCircle2 size={56} color="#10b981" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>
              Account gelöscht
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
              Du wirst zur Startseite geleitet…
            </p>
          </div>
        ) : (
        <>
        <div style={{
          display: "flex", justifyContent: "center", marginBottom: 16,
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle size={32} color="#f87171" strokeWidth={1.8} />
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", margin: "0 0 8px" }}>
          Account endgültig löschen
        </h1>
        <p style={{
          fontSize: 14, color: "rgba(255,255,255,0.55)", textAlign: "center",
          margin: "0 0 24px", lineHeight: 1.5,
        }}>
          Diese Aktion ist <strong style={{ color: "#fca5a5" }}>nicht umkehrbar</strong>.
          Es gibt kein Zurück.
        </p>

        <div style={{
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.18)",
          borderRadius: 16, padding: "18px 18px 14px", marginBottom: 24,
        }}>
          <div style={{
            fontSize: 12, color: "#fca5a5", textTransform: "uppercase",
            letterSpacing: 1, fontWeight: 700, marginBottom: 10,
          }}>
            Folgendes wird dauerhaft gelöscht
          </div>
          <ul style={{
            margin: 0, paddingLeft: 18, fontSize: 14,
            color: "rgba(255,255,255,0.78)", lineHeight: 1.7,
          }}>
            <li>Dein Profil, Bio, Avatar und alle Profil-Daten</li>
            <li>Alle deine Projekte und Bewerbungen</li>
            <li>Deine Firmen-Einträge</li>
            <li>Alle Nachrichten, Chats und Verbindungen</li>
            <li>Followers, Following und Benachrichtigungen</li>
            <li>Dein Login-Account bei Connectyfind</li>
          </ul>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>
            Zur Bestätigung tippe <span style={{ color: "#fca5a5" }}>{CONFIRM_WORD}</span> ein
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            disabled={loading}
            style={inp}
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
          onClick={handleDelete}
          disabled={!canDelete || loading}
          style={{
            width: "100%", padding: "15px 0", borderRadius: 14,
            background: canDelete && !loading
              ? "linear-gradient(135deg, #dc2626, #ef4444)"
              : "rgba(239,68,68,0.18)",
            border: "none",
            color: canDelete && !loading ? "#fff" : "rgba(255,255,255,0.4)",
            fontWeight: 700, fontSize: 16,
            cursor: canDelete && !loading ? "pointer" : "default",
            boxShadow: canDelete && !loading ? "0 4px 16px rgba(239,68,68,0.3)" : "none",
            transition: "background 0.18s ease",
          }}
        >
          {loading ? "Lösche…" : "Account endgültig löschen"}
        </button>

        <button
          onClick={() => router.back()}
          disabled={loading}
          style={{
            width: "100%", marginTop: 10, padding: "13px 0",
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, color: "rgba(255,255,255,0.7)",
            fontWeight: 600, fontSize: 15,
            cursor: loading ? "default" : "pointer",
          }}
        >
          Abbrechen
        </button>
        </>
        )}
      </div>
    </div>
  );
}
