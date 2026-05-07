"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { categories, modelColors } from "@/app/lib/data";

type ProjectStatus = "active" | "paused" | "closed";

type OwnProject = {
  id: number;
  title: string;
  category: string;
  model: string;
  location: string;
  status: ProjectStatus;
  applicants: number;
  updated_at: string;
};

const STATUS_ORDER: Record<ProjectStatus, number> = { active: 0, paused: 1, closed: 2 };

const STATUS_OPTS: { value: ProjectStatus; label: string }[] = [
  { value: "active",  label: "Aktiv" },
  { value: "paused",  label: "Pausiert" },
  { value: "closed",  label: "Geschlossen" },
];

function statusStyle(status: ProjectStatus) {
  const map = {
    active:  { label: "● AKTIV",       color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.28)" },
    paused:  { label: "⏸ PAUSIERT",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.28)" },
    closed:  { label: "■ GESCHLOSSEN", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
  };
  return map[status] ?? map.active;
}

export default function MeineProjektePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [projects, setProjects] = useState<OwnProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("id").eq("auth_id", user.id).maybeSingle();
      if (!profile) { setLoading(false); return; }
      setCurrentUserId(profile.id);

      const { data } = await supabase
        .from("projects")
        .select("id, title, category, model, location, status, applicants, updated_at")
        .eq("user_id", profile.id)
        .order("updated_at", { ascending: false });

      setProjects((data ?? []).map((p) => ({
        id: p.id,
        title: p.title ?? "",
        category: p.category ?? "",
        model: p.model ?? "",
        location: p.location ?? "Remote",
        status: (p.status ?? "active") as ProjectStatus,
        applicants: p.applicants ?? 0,
        updated_at: p.updated_at ?? new Date().toISOString(),
      })));
      setLoading(false);
    };
    init();
  }, [supabase, router]);

  const sorted = [...projects].sort((a, b) => {
    const so = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
    if (so !== 0) return so;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const updateStatus = async (id: number, status: ProjectStatus) => {
    if (!currentUserId) return;
    setUpdatingStatus(id);
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    await supabase.from("projects").update({ status }).eq("id", id).eq("user_id", currentUserId);
    setUpdatingStatus(null);
  };

  const deleteProject = async (id: number) => {
    if (!currentUserId) return;
    await supabase.from("applications").delete().eq("project_id", id);
    await supabase.from("projects").delete().eq("id", id).eq("user_id", currentUserId);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f", minHeight: "100vh", color: "#fff",
      maxWidth: 430, margin: "0 auto",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: -100, left: -100, width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "rgba(255,255,255,0.08)", border: "none", color: "#fff",
              padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13,
            }}
          >← Zurück</button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Meine Projekte</h1>
        </div>
        <button
          onClick={() => router.push("/projekte/neu")}
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", color: "#fff", padding: "8px 14px",
            borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >+ Neu</button>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "16px 20px 100px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
            Lade…
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 16 }}>Noch keine Projekte</p>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              Erstelle dein erstes Projekt und finde Partner.
            </p>
            <button
              onClick={() => router.push("/projekte/neu")}
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none", color: "#fff", padding: "12px 24px",
                borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >+ Neues Projekt erstellen</button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sorted.map((proj) => {
            const cat = categories.find((c) => c.id === proj.category);
            const catColor = cat?.color ?? "#6366f1";
            const ss = statusStyle(proj.status);
            const isDeleting = confirmDelete === proj.id;

            return (
              <div
                key={proj.id}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: 16,
                }}
              >
                {/* Project info row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${catColor}33, ${catColor}11)`,
                    border: `1px solid ${catColor}33`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>{cat?.icon ?? "✦"}</div>

                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{proj.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginBottom: 5 }}>
                      {[cat?.label, modelColors[proj.model] ? proj.model : null, proj.location].filter(Boolean).join(" · ")}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 600,
                        background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color,
                      }}>{ss.label}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                        {proj.applicants} Bewerbung{proj.applicants !== 1 ? "en" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status toggle */}
                <div style={{
                  display: "flex", gap: 4, marginBottom: 10,
                  background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4,
                }}>
                  {STATUS_OPTS.map((opt) => {
                    const active = proj.status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => !active && updateStatus(proj.id, opt.value)}
                        disabled={updatingStatus === proj.id}
                        style={{
                          flex: 1, padding: "7px 4px", borderRadius: 8,
                          background: active ? "rgba(255,255,255,0.1)" : "transparent",
                          border: active ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                          color: active ? "#fff" : "rgba(255,255,255,0.35)",
                          fontSize: 11, fontWeight: active ? 700 : 500,
                          cursor: active ? "default" : "pointer",
                          transition: "all 0.15s",
                        }}
                      >{opt.label}</button>
                    );
                  })}
                </div>

                {/* Actions */}
                {isDeleting ? (
                  <div style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10, padding: "12px 14px",
                  }}>
                    <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                      Projekt wirklich löschen? Das kann nicht rückgängig gemacht werden.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        style={{
                          flex: 1, padding: "9px 0", borderRadius: 10,
                          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                          color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        }}
                      >Ja, löschen</button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{
                          flex: 1, padding: "9px 0", borderRadius: 10,
                          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                      >Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => router.push(`/profil/projekte/${proj.id}/bearbeiten`)}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 10,
                        background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                        color: "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}
                    >Bearbeiten</button>
                    <button
                      onClick={() => setConfirmDelete(proj.id)}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 10,
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}
                    >Löschen</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
