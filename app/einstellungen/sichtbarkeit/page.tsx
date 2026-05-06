"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Visibility = "public" | "private";

const OPTIONS: { key: Visibility; label: string; desc: string; icon: string }[] = [
  { key: "public", label: "Öffentlich", desc: "Alle Nutzer können dein Profil sehen", icon: "🌍" },
  { key: "private", label: "Privat", desc: "Nur Matches können dein Profil sehen", icon: "🔒" },
];

export default function VisibilityPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profileId, setProfileId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Visibility>("public");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id, is_public")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (data) {
        setProfileId(data.id);
        setSelected(data.is_public !== false ? "public" : "private");
      }
      setLoading(false);
    };
    load();
  }, [supabase, router]);

  const save = async () => {
    if (!profileId) return;
    setSaving(true);
    setError("");

    const { error: err } = await supabase
      .from("profiles")
      .update({ is_public: selected === "public" })
      .eq("id", profileId);

    setSaving(false);
    if (err) {
      setError(err.message);
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
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Profil Sichtbarkeit</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {OPTIONS.map((opt) => {
            const active = selected === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => { setSelected(opt.key); setSaved(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "18px 16px",
                  background: active ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
                  border: active ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 28 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: active ? "#6366f1" : "#fff" }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{opt.desc}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  border: active ? "none" : "2px solid rgba(255,255,255,0.2)",
                  background: active ? "#6366f1" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#fff",
                }}>{active ? "✓" : ""}</div>
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 12,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", fontSize: 14,
          }}>{error}</div>
        )}
      </div>
    </div>
  );
}
