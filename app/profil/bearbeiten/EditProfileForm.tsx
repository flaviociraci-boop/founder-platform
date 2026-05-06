"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { categories, seekingColors } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";

type Form = {
  id: number;
  name: string;
  username: string;
  age: string;
  location: string;
  bio: string;
  seeking: string;
  category: string;
  tags: string[];
  avatar: string;
  color: string;
};

const SEEKING = Object.keys(seekingColors);

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

/** Crop + resize to a square JPEG blob (max 480px, 88% quality). */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = Math.min(img.width, img.height, 480);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const ox = (img.width - size) / 2;
      const oy = (img.height - size) / 2;
      ctx.drawImage(img, ox, oy, size, size, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.88
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function EditProfileForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let row: any = null;

      const { data: byAuth, error: authErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (authErr) {
        setFetchError(`Fehler beim Laden: ${authErr.message}`);
        setLoading(false);
        return;
      }

      if (byAuth) {
        row = byAuth;
      } else {
        const name =
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ?? "Nutzer";
        const initials = name.split(" ")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((n: any) => n[0] ?? "").join("").toUpperCase().slice(0, 2);

        const { data: created, error: createErr } = await supabase
          .from("profiles")
          .insert({ auth_id: user.id, name, avatar: initials, color: "#6366f1", followers: 0, following: 0, tags: [] })
          .select("*").single();

        if (createErr) {
          setFetchError(`Kein Profil gefunden: ${createErr.message}`);
          setLoading(false);
          return;
        }
        row = created;
      }

      setForm({
        id: row.id, name: row.name ?? "", username: row.username ?? "",
        age: row.age?.toString() ?? "", location: row.location ?? "",
        bio: row.bio ?? "", seeking: row.seeking ?? "", category: row.category ?? "",
        tags: row.tags ?? [], avatar: row.avatar ?? "", color: row.color ?? "#6366f1",
      });
      setLoading(false);
    };
    load();
  }, [supabase, router]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((p) => p ? { ...p, [k]: v } : p);

  const addTag = () => {
    if (!form) return;
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag) && form.tags.length < 12)
      set("tags", [...form.tags, tag]);
    setTagInput("");
  };

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    e.target.value = "";             // reset so same file can be re-selected

    if (!file.type.startsWith("image/")) {
      setUploadError("Nur Bilder erlaubt.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Bild ist zu groß (max. 10 MB).");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      // Always fetch the auth user fresh — never rely on state for the UUID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt.");

      const blob = await resizeImage(file);
      const path = `${user.id}/avatar.jpg`;

      console.log("[avatar upload] user.id (auth UUID):", user.id);
      console.log("[avatar upload] path:", path);
      console.log("[avatar upload] blob size:", blob.size);

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });

      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Add cache-bust so the browser reloads the new image
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar: url })
        .eq("id", form.id);

      if (dbErr) throw dbErr;

      set("avatar", url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  };

  // ── Remove avatar ──────────────────────────────────────────────────────────
  const removeAvatar = async () => {
    if (!form) return;
    setRemoving(true);
    setUploadError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`]);
      }
      const initials = form.name.trim()
        .split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
      await supabase.from("profiles").update({ avatar: initials }).eq("id", form.id);
      set("avatar", initials);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Entfernen fehlgeschlagen.");
    } finally {
      setRemoving(false);
    }
  };

  // ── Save text fields ───────────────────────────────────────────────────────
  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) { setSaveError("Name ist erforderlich."); return; }
    setSaving(true);
    setSaveError("");
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
      .eq("id", form.id);
    setSaving(false);
    if (err) {
      setSaveError(err.code === "23505" ? "Dieser Benutzername ist bereits vergeben." : err.message);
    } else {
      setSaved(true);
      setTimeout(() => router.push("/"), 1200);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
        Lade Profil…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <p style={{ color: "#f87171", textAlign: "center" }}>{fetchError}</p>
        <button onClick={() => router.push("/")} style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>Zurück</button>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#0a0a0f", minHeight: "100vh", color: "#fff" }}>
      {/* Sticky header */}
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
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Profil bearbeiten</span>
        <button onClick={save} disabled={saving || saved} style={{
          padding: "9px 20px", borderRadius: 12,
          background: saved ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: saved ? "1px solid rgba(16,185,129,0.35)" : "none",
          color: saved ? "#10b981" : "#fff",
          fontWeight: 700, fontSize: 14, cursor: saving || saved ? "default" : "pointer",
          opacity: saving ? 0.6 : 1,
          boxShadow: saved ? "none" : "0 4px 12px rgba(99,102,241,0.3)",
        }}>{saving ? "…" : saved ? "✓ Gespeichert" : "Speichern"}</button>
      </div>

      <div style={{ padding: "28px 20px 80px" }}>
        {/* ── Avatar upload ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Clickable avatar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ background: "none", border: "none", cursor: uploading ? "default" : "pointer", padding: 0, margin: "0 auto 12px", display: "block", position: "relative" }}
          >
            <Avatar src={form.avatar} color={form.color} size={88} radius={26}
              style={{ boxShadow: `0 8px 24px ${form.color}44`, margin: "0 auto" }} />

            {/* Camera overlay */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 26,
              background: uploading ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => { if (!uploading) (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.4)"; }}
              onMouseLeave={(e) => { if (!uploading) (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0)"; }}
            >
              {uploading
                ? <span style={{ fontSize: 22, animation: "spin 1s linear infinite" }}>⟳</span>
                : <span style={{ fontSize: 20, opacity: 0 }} className="camera-icon">📷</span>
              }
            </div>
          </button>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "7px 16px",
                color: (uploading || removing) ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)",
                fontSize: 13, cursor: (uploading || removing) ? "default" : "pointer",
              }}
            >
              {uploading ? "Wird hochgeladen…" : "Profilbild ändern"}
            </button>

            {(form.avatar.startsWith("http") || form.avatar.startsWith("blob:")) && (
              <button
                onClick={removeAvatar}
                disabled={uploading || removing}
                style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10, padding: "7px 16px",
                  color: removing ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.7)",
                  fontSize: 13, cursor: (uploading || removing) ? "default" : "pointer",
                }}
              >
                {removing ? "Wird entfernt…" : "Bild entfernen"}
              </button>
            )}
          </div>

          {uploadError && (
            <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{uploadError}</p>
          )}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dein vollständiger Name" style={inp} />
        </div>

        {/* Username */}
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Benutzername</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", fontSize: 15, pointerEvents: "none" }}>@</span>
            <input value={form.username} onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="benutzername" style={{ ...inp, paddingLeft: 32 }} />
          </div>
        </div>

        {/* Age + Location */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: "0 0 80px" }}>
            <label style={lbl}>Alter</label>
            <input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="25" min="16" max="99" style={inp} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Standort</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="z.B. Zürich, CH" style={inp} />
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Bio</label>
          <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Beschreibe dich…" rows={4} style={{ ...inp, resize: "none", lineHeight: 1.55 }} />
          <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{form.bio.length}/280</div>
        </div>

        {/* Kategorie */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Kategorie</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {categories.filter((c) => c.id !== "all").map((cat) => {
              const active = form.category === cat.id;
              return (
                <button key={cat.id} onClick={() => set("category", active ? "" : cat.id)} style={{
                  padding: "11px 14px", borderRadius: 12, textAlign: "left",
                  border: active ? `1px solid ${cat.color}55` : "1px solid rgba(255,255,255,0.08)",
                  background: active ? `${cat.color}15` : "rgba(255,255,255,0.04)",
                  color: active ? cat.color : "rgba(255,255,255,0.5)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}>{cat.icon} {cat.label}</button>
              );
            })}
          </div>
        </div>

        {/* Sucht gerade */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Sucht gerade</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SEEKING.map((opt) => {
              const color = seekingColors[opt];
              const active = form.seeking === opt;
              return (
                <button key={opt} onClick={() => set("seeking", active ? "" : opt)} style={{
                  padding: "9px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: active ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.08)",
                  background: active ? `${color}15` : "rgba(255,255,255,0.04)",
                  color: active ? color : "rgba(255,255,255,0.5)", transition: "all 0.15s",
                }}>{active ? "✓ " : ""}{opt}</button>
              );
            })}
          </div>
        </div>

        {/* Skills/Tags */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Skills & Tags</label>
          {form.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {form.tags.map((tag) => (
                <span key={tag} style={{ padding: "7px 12px", borderRadius: 20, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", fontSize: 13, color: "#a5b4fc", display: "flex", alignItems: "center", gap: 8 }}>
                  {tag}
                  <button onClick={() => set("tags", form.tags.filter((t) => t !== tag))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Skill eingeben und Enter drücken…" style={{ ...inp, flex: 1 }} />
            <button onClick={addTag} style={{ padding: "13px 18px", borderRadius: 14, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#6366f1", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>+</button>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>{form.tags.length}/12</div>
        </div>

        {saveError && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 14 }}>{saveError}</div>
        )}
      </div>
    </div>
  );
}
