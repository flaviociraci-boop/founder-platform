"use client";

import { useEffect, useState, useMemo } from "react";
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

export default function UsernamePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profileId, setProfileId] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (data) {
        setProfileId(data.id);
        setValue(data.username ?? "");
      }
      setLoading(false);
    };
    load();
  }, [supabase, router]);

  const save = async () => {
    if (!profileId) return;
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
    if (!clean) { setError("Benutzername darf nicht leer sein."); return; }
    setSaving(true);
    setError("");

    const { error: err } = await supabase
      .from("profiles")
      .update({ username: clean })
      .eq("id", profileId);

    setSaving(false);
    if (err) {
      setError(err.code === "23505" ? "Dieser Benutzername ist bereits vergeben." : err.message);
    } else {
      setSaved(true);
      setTimeout(() => router.back(), 1500);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
        Lade…
      </div>
    );
  }

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
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Benutzername</span>
        <button
          onClick={save} disabled={saving || saved}
          style={{
            padding: "9px 20px", borderRadius: 12,
            background: saved ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: saved ? "1px solid rgba(16,185,129,0.35)" : "none",
            color: saved ? "#10b981" : "#fff",
            fontWeight: 700, fontSize: 14, cursor: saving || saved ? "default" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >{saving ? "…" : saved ? "✓ Gespeichert" : "Speichern"}</button>
      </div>

      <div style={{ padding: "32px 20px" }}>
        <div style={{ marginBottom: 8 }}>
          <label style={lbl}>Benutzername</label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.35)", fontSize: 15, pointerEvents: "none",
            }}>@</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="benutzername"
              style={{ ...inp, paddingLeft: 32 }}
              autoFocus
            />
          </div>
        </div>
        <p style={{ margin: "8px 0 24px", fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
          Nur Kleinbuchstaben, Zahlen und _ erlaubt.
        </p>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 12, marginBottom: 16,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", fontSize: 14,
          }}>{error}</div>
        )}
      </div>
    </div>
  );
}
