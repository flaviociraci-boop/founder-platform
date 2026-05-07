"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { categories, modelColors } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";

const MODELS = Object.keys(modelColors);

const inp: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14,
  padding: "14px 16px",
  color: "#fff",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
};

const lbl: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.4)",
  textTransform: "uppercase",
  letterSpacing: 1,
  display: "block",
  marginBottom: 8,
  fontWeight: 600,
};

export default function ProjektBearbeitenPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(false);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("apps");
  const [model, setModel] = useState("Equity");
  const [location, setLocation] = useState("Remote");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("id").eq("auth_id", user.id).maybeSingle();
      if (!profile) { router.replace("/profil/projekte"); return; }

      const { data: proj } = await supabase
        .from("projects")
        .select("id, title, description, category, model, location, tags, user_id")
        .eq("id", id)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!proj) { router.replace("/profil/projekte"); return; }

      setTitle(proj.title ?? "");
      setDesc(proj.description ?? "");
      setCategory(proj.category ?? "apps");
      setModel(proj.model ?? "Equity");
      setLocation(proj.location ?? "Remote");
      setTags(proj.tags ?? []);
      setLoading(false);
    };
    load();
  }, [supabase, router, id]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) setTags((p) => [...p, t]);
    setTagInput("");
    tagInputRef.current?.focus();
  };

  const save = async () => {
    if (!title.trim()) { setError("Bitte gib einen Titel ein."); return; }
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("projects")
      .update({
        title: title.trim(),
        description: desc.trim(),
        category,
        model,
        location: location.trim() || "Remote",
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSaving(false);
    if (err) { setError(err.message); return; }

    setToast(true);
    setTimeout(() => router.push("/profil/projekte"), 1500);
  };

  if (loading) {
    return (
      <div style={{
        background: "#0a0a0f", minHeight: "100vh",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, color: "rgba(255,255,255,0.3)",
      }}>
        Lade…
      </div>
    );
  }

  return (
    <div style={{
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      maxWidth: 430,
      margin: "0 auto",
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)",
          color: "#34d399", padding: "12px 24px", borderRadius: 14,
          fontSize: 14, fontWeight: 700, zIndex: 999,
          backdropFilter: "blur(12px)",
        }}>
          Projekt aktualisiert ✓
        </div>
      )}

      {/* Sticky header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px",
        background: "rgba(10,10,15,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, width: 36, height: 36, color: "#fff", cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >←</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Projekt bearbeiten</span>
        <button
          onClick={save}
          disabled={saving || !title.trim()}
          style={{
            padding: "9px 22px", borderRadius: 12,
            background: title.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.06)",
            border: title.trim() ? "none" : "1px solid rgba(255,255,255,0.1)",
            color: title.trim() ? "#fff" : "rgba(255,255,255,0.3)",
            fontWeight: 700, fontSize: 14,
            cursor: saving || !title.trim() ? "default" : "pointer",
            opacity: saving ? 0.6 : 1,
            boxShadow: title.trim() ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
            transition: "all 0.2s",
          }}
        >{saving ? "…" : "Speichern"}</button>
      </div>

      <div style={{ padding: "28px 20px 100px" }}>

        {/* Titel */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Titel *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Marketing-Partner gesucht"
            style={inp}
          />
        </div>

        {/* Beschreibung */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Beschreibung</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Was ist dein Projekt? Wen suchst du genau und was bietest du an?"
            rows={5}
            style={{ ...inp, resize: "none", lineHeight: 1.6 }}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
            {desc.length}/500
          </div>
        </div>

        {/* Kategorie */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Kategorie</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {categories.filter((c) => c.id !== "all").map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    padding: "12px 14px", borderRadius: 12, textAlign: "left",
                    border: active ? `1px solid ${cat.color}55` : "1px solid rgba(255,255,255,0.08)",
                    background: active ? `${cat.color}15` : "rgba(255,255,255,0.04)",
                    color: active ? cat.color : "rgba(255,255,255,0.5)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  }}
                >{cat.icon} {cat.label}</button>
              );
            })}
          </div>
        </div>

        {/* Kooperationsmodell */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Kooperationsmodell</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MODELS.map((m) => {
              const active = model === m;
              const color = modelColors[m];
              return (
                <button
                  key={m}
                  onClick={() => setModel(m)}
                  style={{
                    padding: "13px 16px", borderRadius: 12, textAlign: "left",
                    border: active ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.08)",
                    background: active ? `${color}15` : "rgba(255,255,255,0.04)",
                    color: active ? color : "rgba(255,255,255,0.5)",
                    fontSize: 14, fontWeight: active ? 700 : 500, cursor: "pointer",
                    transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: active ? color : "rgba(255,255,255,0.2)",
                  }} />
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Standort */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Standort</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="z.B. Remote, Berlin, München…"
            style={inp}
          />
        </div>

        {/* Gesuchte Skills / Rollen */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Gesuchte Skills & Rollen</label>
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "7px 12px", borderRadius: 20,
                    background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                    fontSize: 13, color: "#a5b4fc",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => setTags((p) => p.filter((t) => t !== tag))}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}
                  >×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="z.B. Developer, Designer, Sales…"
              style={{ ...inp, flex: 1, fontSize: 15 }}
            />
            <button
              onClick={addTag}
              style={{
                padding: "14px 18px", borderRadius: 14,
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                color: "#6366f1", fontSize: 20, fontWeight: 700, cursor: "pointer", flexShrink: 0,
              }}
            >+</button>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
            {tags.length}/10 · Enter zum Hinzufügen
          </div>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", fontSize: 14, marginBottom: 16,
          }}>{error}</div>
        )}

        {/* Bottom save button */}
        <button
          onClick={save}
          disabled={saving || !title.trim()}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 16,
            background: title.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.06)",
            border: title.trim() ? "none" : "1px solid rgba(255,255,255,0.1)",
            color: title.trim() ? "#fff" : "rgba(255,255,255,0.3)",
            fontWeight: 700, fontSize: 16,
            cursor: saving || !title.trim() ? "default" : "pointer",
            opacity: saving ? 0.6 : 1,
            boxShadow: title.trim() ? "0 8px 24px rgba(99,102,241,0.35)" : "none",
            transition: "all 0.2s",
            marginBottom: 12,
          }}
        >{saving ? "Wird gespeichert…" : "Änderungen speichern ✦"}</button>

        <button
          onClick={() => router.back()}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 16,
            background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.35)", fontWeight: 600, fontSize: 15,
            cursor: "pointer",
          }}
        >Abbrechen</button>
      </div>
    </div>
  );
}
