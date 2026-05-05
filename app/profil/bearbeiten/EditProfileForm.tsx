"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories, seekingColors } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  id: number;
  name: string;
  username: string | null;
  age: number | null;
  location: string | null;
  bio: string | null;
  seeking: string | null;
  category: string | null;
  tags: string[] | null;
  avatar: string;
  color: string;
};

const SEEKING_OPTIONS = Object.keys(seekingColors);

const input: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14,
  padding: "13px 16px",
  color: "#fff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
};

const lbl: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.38)",
  textTransform: "uppercase",
  letterSpacing: 1,
  display: "block",
  marginBottom: 8,
  fontWeight: 600,
};

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: profile.name ?? "",
    username: profile.username ?? "",
    age: profile.age?.toString() ?? "",
    location: profile.location ?? "",
    bio: profile.bio ?? "",
    seeking: profile.seeking ?? "",
    category: profile.category ?? "",
    tags: profile.tags ?? [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag) && form.tags.length < 12) {
      set("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const save = async () => {
    if (!form.name.trim()) { setError("Name ist erforderlich."); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({
        name: form.name.trim(),
        username: form.username.trim() || null,
        age: form.age ? parseInt(form.age) : null,
        location: form.location.trim() || null,
        bio: form.bio.trim() || null,
        seeking: form.seeking || null,
        category: form.category || null,
        tags: form.tags,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (err) {
      setError(err.code === "23505" ? "Dieser Benutzername ist bereits vergeben." : err.message);
    } else {
      setSaved(true);
      setTimeout(() => router.push("/"), 1200);
    }
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
    }}>
      {/* Fixed header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px",
        background: "rgba(10,10,15,0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, width: 36, height: 36,
            color: "#fff", cursor: "pointer", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >←</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Profil bearbeiten</span>
        <button
          onClick={save}
          disabled={saving || saved}
          style={{
            padding: "9px 20px", borderRadius: 12,
            background: saved ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: saved ? "1px solid rgba(16,185,129,0.35)" : "none",
            color: saved ? "#10b981" : "#fff",
            fontWeight: 700, fontSize: 14, cursor: saving || saved ? "default" : "pointer",
            flexShrink: 0,
            opacity: saving ? 0.6 : 1,
            boxShadow: saved ? "none" : "0 4px 12px rgba(99,102,241,0.3)",
          }}
        >
          {saving ? "…" : saved ? "✓ Gespeichert" : "Speichern"}
        </button>
      </div>

      <div style={{ padding: "28px 20px 80px" }}>
        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, margin: "0 auto 12px",
            background: `linear-gradient(135deg, ${profile.color}, ${profile.color}88)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 700,
            boxShadow: `0 8px 24px ${profile.color}44`,
          }}>
            {profile.avatar}
          </div>
          <button style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "7px 16px",
            color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer",
          }}>
            Foto ändern
          </button>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Name</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Dein vollständiger Name"
            style={input}
          />
        </div>

        {/* Username */}
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Benutzername</label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 16, top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.35)", fontSize: 15, pointerEvents: "none",
            }}>@</span>
            <input
              value={form.username}
              onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="benutzername"
              style={{ ...input, paddingLeft: 32 }}
            />
          </div>
        </div>

        {/* Age + Location */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: "0 0 80px" }}>
            <label style={lbl}>Alter</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
              placeholder="25"
              min="16" max="99"
              style={input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Standort</label>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="z.B. Zürich, CH"
              style={input}
            />
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Beschreibe dich und was du aufbaust…"
            rows={4}
            style={{ ...input, resize: "none", lineHeight: 1.55 }}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
            {form.bio.length}/280
          </div>
        </div>

        {/* Kategorie */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Kategorie</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {categories.filter((c) => c.id !== "all").map((cat) => {
              const active = form.category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => set("category", active ? "" : cat.id)}
                  style={{
                    padding: "11px 14px", borderRadius: 12, textAlign: "left",
                    border: active ? `1px solid ${cat.color}55` : "1px solid rgba(255,255,255,0.08)",
                    background: active ? `${cat.color}15` : "rgba(255,255,255,0.04)",
                    color: active ? cat.color : "rgba(255,255,255,0.5)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sucht gerade */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Sucht gerade</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SEEKING_OPTIONS.map((opt) => {
              const color = seekingColors[opt];
              const active = form.seeking === opt;
              return (
                <button
                  key={opt}
                  onClick={() => set("seeking", active ? "" : opt)}
                  style={{
                    padding: "9px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: active ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.08)",
                    background: active ? `${color}15` : "rgba(255,255,255,0.04)",
                    color: active ? color : "rgba(255,255,255,0.5)",
                    transition: "all 0.15s",
                  }}
                >
                  {active ? "✓ " : ""}{opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills / Tags */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Skills & Tags</label>
          {form.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "7px 12px", borderRadius: 20,
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    fontSize: 13, color: "#a5b4fc",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => set("tags", form.tags.filter((t) => t !== tag))}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.35)", cursor: "pointer",
                      fontSize: 16, padding: 0, lineHeight: 1,
                    }}
                  >×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Skill eingeben und Enter drücken…"
              style={{ ...input, flex: 1 }}
            />
            <button
              onClick={addTag}
              style={{
                padding: "13px 18px", borderRadius: 14,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#6366f1", fontSize: 18, fontWeight: 700,
                cursor: "pointer", flexShrink: 0,
              }}
            >+</button>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
            {form.tags.length}/12 Skills
          </div>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", fontSize: 14, marginBottom: 16,
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
