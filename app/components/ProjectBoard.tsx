"use client";

import { useState } from "react";
import { categories, modelColors, Project } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { timeAgo } from "@/app/lib/data";

// Demo: use profile 1 as the logged-in user until auth is added.
const DEMO_USER_ID = 1;

type Props = {
  initialProjects: Project[];
};

export default function ProjectBoard({ initialProjects }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [applied, setApplied] = useState<Record<number, boolean>>({});
  const [filterCat, setFilterCat] = useState("all");
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    desc: "",
    model: "Equity",
    category: "ecommerce",
  });

  const filtered = filterCat === "all" ? projects : projects.filter((p) => p.category === filterCat);

  const applyToProject = async (id: number) => {
    setApplied((prev) => ({ ...prev, [id]: true }));
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, applicants: p.applicants + 1 } : p))
    );

    const supabase = createClient();
    await Promise.all([
      supabase.from("applications").insert({ project_id: id, user_id: DEMO_USER_ID }),
      supabase.rpc("increment_applicants", { project_id: id }),
    ]);
  };

  const postProject = async () => {
    if (!newProject.title.trim()) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: DEMO_USER_ID,
        title: newProject.title,
        description: newProject.desc,
        category: newProject.category,
        location: "Remote",
        model: newProject.model,
        tags: [],
        applicants: 0,
        color: "#6366f1",
        avatar: "DU",
        user_name: "Du",
      })
      .select()
      .single();

    if (!error && data) {
      const newP: Project = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        desc: data.description,
        category: data.category,
        location: data.location,
        model: data.model,
        tags: data.tags ?? [],
        applicants: 0,
        color: data.color,
        avatar: data.avatar,
        userName: data.user_name,
        timeAgo: timeAgo(data.created_at),
      };
      setProjects((prev) => [newP, ...prev]);
    }

    setNewProject({ title: "", desc: "", model: "Equity", category: "ecommerce" });
    setShowNewProject(false);
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      {showNewProject && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#13131a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "24px 24px 0 0",
              padding: 24,
              width: "100%",
              maxWidth: 430,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Projekt ausschreiben</h3>
              <button
                onClick={() => setShowNewProject(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  color: "#fff",
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            {(
              [
                { label: "Titel", key: "title" as const, placeholder: "z.B. Marketing-Partner gesucht", type: "input" },
                { label: "Beschreibung", key: "desc" as const, placeholder: "Was suchst du genau?", type: "textarea" },
              ] as const
            ).map((field) => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {field.label}
                </label>
                {field.type === "input" ? (
                  <input
                    value={newProject[field.key]}
                    onChange={(e) => setNewProject((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <textarea
                    value={newProject[field.key]}
                    onChange={(e) => setNewProject((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: 14,
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Kooperationsmodell
                </label>
                <select
                  value={newProject.model}
                  onChange={(e) => setNewProject((p) => ({ ...p, model: e.target.value }))}
                  style={{
                    width: "100%",
                    background: "#1a1a24",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    color: "#fff",
                    fontSize: 14,
                    outline: "none",
                  }}
                >
                  {Object.keys(modelColors).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Kategorie
                </label>
                <select
                  value={newProject.category}
                  onChange={(e) => setNewProject((p) => ({ ...p, category: e.target.value }))}
                  style={{
                    width: "100%",
                    background: "#1a1a24",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    color: "#fff",
                    fontSize: 14,
                    outline: "none",
                  }}
                >
                  {categories
                    .filter((c) => c.id !== "all")
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                </select>
              </div>
            </div>

            <button
              onClick={postProject}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Projekt posten ✦
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: "28px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: -0.5,
                background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Projekte
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
              {filtered.length} offene Ausschreibungen
            </p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            style={{
              padding: "10px 16px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ✦ Neu
          </button>
        </div>
      </div>

      <div
        className="hide-scrollbar"
        style={{ display: "flex", gap: 8, padding: "0 20px 16px", overflowX: "auto" }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              borderRadius: 20,
              whiteSpace: "nowrap",
              border:
                filterCat === cat.id
                  ? `1px solid ${cat.color}66`
                  : "1px solid rgba(255,255,255,0.08)",
              background: filterCat === cat.id ? `${cat.color}18` : "rgba(255,255,255,0.04)",
              color: filterCat === cat.id ? cat.color : "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((project) => (
          <div
            key={project.id}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: 18,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: `radial-gradient(circle at top right, ${project.color}12 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${project.color}, ${project.color}88)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {project.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{project.userName}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{project.timeAgo}</div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontWeight: 700,
                  background: `${modelColors[project.model] ?? "#6366f1"}18`,
                  border: `1px solid ${modelColors[project.model] ?? "#6366f1"}33`,
                  color: modelColors[project.model] ?? "#6366f1",
                }}
              >
                {project.model}
              </div>
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
              {project.title}
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
              {project.desc}
            </p>

            {project.tags.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 20,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 9px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  📍 {project.location}
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  {project.applicants}
                </span>{" "}
                Bewerber
              </span>
              <button
                onClick={() => applyToProject(project.id)}
                disabled={applied[project.id]}
                style={{
                  padding: "9px 20px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: applied[project.id] ? "default" : "pointer",
                  border: applied[project.id]
                    ? "1px solid rgba(255,255,255,0.1)"
                    : `1px solid ${project.color}55`,
                  background: applied[project.id]
                    ? "rgba(255,255,255,0.04)"
                    : `linear-gradient(135deg, ${project.color}33, ${project.color}11)`,
                  color: applied[project.id] ? "rgba(255,255,255,0.3)" : project.color,
                  transition: "all 0.2s",
                }}
              >
                {applied[project.id] ? "✓ Beworben" : "Bewerben"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
