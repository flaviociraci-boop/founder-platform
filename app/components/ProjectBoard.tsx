"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories, modelColors, Project } from "@/app/lib/data";
import { timeAgo } from "@/app/lib/data";
import ApplicationModal from "@/app/components/ApplicationModal";

type Props = {
  initialProjects: Project[];
  currentUserId: number | null;
  currentUserName: string | null;
  currentUserAvatar: string | null;
  currentUserColor: string | null;
};

export default function ProjectBoard({ initialProjects, currentUserId, currentUserName, currentUserAvatar, currentUserColor }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [applied, setApplied] = useState<Record<number, boolean>>({});
  const [filterCat, setFilterCat] = useState("all");
  const [query, setQuery] = useState("");
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = projects
    .filter((p) => filterCat === "all" || p.category === filterCat)
    .filter((p) =>
      !q ||
      (p.title ?? "").toLowerCase().includes(q) ||
      (p.desc ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q) ||
      (p.tags ?? []).some((t) => (t ?? "").toLowerCase().includes(q))
    );

  const handleApplicationSuccess = (projectId: number) => {
    setApplied((prev) => ({ ...prev, [projectId]: true }));
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, applicants: p.applicants + 1 } : p)),
    );
    setModalProject(null);
    setSuccessMessage("Bewerbung gesendet — der Projekt-Ersteller bekommt eine Benachrichtigung.");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div style={{ paddingBottom: 100 }}>

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
            onClick={() => router.push("/projekte/neu")}
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

        {/* Search bar */}
        <div style={{ position: "relative", marginTop: 16 }}>
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            fontSize: 16, pointerEvents: "none", opacity: 0.4,
          }}>🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Projekte suchen…"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${query ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 14, padding: "12px 14px 12px 40px",
              color: "#fff", fontSize: 15, outline: "none",
              fontFamily: "'DM Sans', sans-serif",
              transition: "border-color 0.15s",
            }}
          />
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
            {cat.label}
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
                onClick={() => { if (!applied[project.id]) setModalProject(project); }}
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

      {successMessage && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            maxWidth: 400,
            width: "calc(100% - 32px)",
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.4)",
            borderRadius: 14,
            padding: "12px 16px",
            color: "#10b981",
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {successMessage}
        </div>
      )}

      {modalProject && currentUserId && (
        <ApplicationModal
          project={modalProject}
          applicantUserId={currentUserId}
          onClose={() => setModalProject(null)}
          onSuccess={() => handleApplicationSuccess(modalProject.id)}
        />
      )}
    </div>
  );
}
