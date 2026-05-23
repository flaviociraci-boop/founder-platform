"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { categories, modelColors, Project } from "@/app/lib/data";
import { timeAgo } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import ApplicationModal from "@/app/components/ApplicationModal";
import InfoBox from "@/app/components/InfoBox";

type Props = {
  initialProjects: Project[];
  currentUserId: number | null;
  currentUserName: string | null;
  currentUserAvatar: string | null;
  currentUserColor: string | null;
};

type AppliedStatus = "pending" | "accepted" | "rejected";

export default function ProjectBoard({ initialProjects, currentUserId, currentUserName, currentUserAvatar, currentUserColor }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  // Map project_id → status der eigenen Bewerbung. Steuert den Button-State:
  // undefined → "Bewerben", pending/rejected → disabled mit Label,
  // accepted → "Chat öffnen".
  const [appliedStatus, setAppliedStatus] = useState<Record<number, AppliedStatus>>({});
  const [filterCat, setFilterCat] = useState("all");
  const [query, setQuery] = useState("");
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Eigene Bewerbungs-Status pro Projekt vorab laden + Realtime mitziehen.
  useEffect(() => {
    if (!currentUserId) return;
    const load = async () => {
      const { data } = await supabase
        .from("applications")
        .select("project_id, status")
        .eq("user_id", currentUserId);
      const m: Record<number, AppliedStatus> = {};
      for (const row of data ?? []) {
        m[row.project_id as number] = row.status as AppliedStatus;
      }
      setAppliedStatus(m);
    };
    load();

    // Realtime: Wenn der Owner accepted/rejected klickt, ändert sich
    // unsere status-Row → Button updatet ohne Reload.
    const channel = supabase
      .channel("applications-mine")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, supabase]);

  // Realtime: neue Projekte live in die Liste appenden (kein Reload nötig).
  // Payload-Spalten sind snake_case — wir mappen auf den Project-Type wie
  // page.tsx beim Initial-Load.
  useEffect(() => {
    const channel = supabase
      .channel("projects-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "projects" },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = payload.new as any;
          const mapped: Project = {
            id: p.id,
            userId: p.user_id,
            title: p.title,
            desc: p.description,
            category: p.category,
            location: p.location,
            model: p.model,
            tags: p.tags ?? [],
            applicants: p.applicants ?? 0,
            color: p.color,
            avatar: p.avatar,
            userName: p.user_name,
            timeAgo: timeAgo(p.created_at),
          };
          setProjects((prev) => {
            if (prev.some((existing) => existing.id === mapped.id)) return prev;
            return [mapped, ...prev];
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

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
    setAppliedStatus((prev) => ({ ...prev, [projectId]: "pending" }));
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
        {/* Desktop: [Titel + Neu-Button] links, Suchleiste rechts (max-w-md).
            Mobile: Titel + Neu in einer Row oben, Suchleiste darunter. */}
        <div className="lg:flex lg:items-end lg:gap-12">
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
              Neu
            </button>
          </div>

          {/* Search bar */}
          <div className="mt-4 lg:mt-0 lg:max-w-md lg:w-full lg:flex-shrink-0" style={{ position: "relative" }}>
            <Search
              size={16}
              strokeWidth={2}
              style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "#fff", opacity: 0.5, pointerEvents: "none",
              }}
            />
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

      <InfoBox>
        Pitche dein eigenes Projekt oder bewirb dich auf Projekte anderer Gründer. Bei Interesse
        meldet sich die jeweils andere Seite direkt bei dir, und ihr findet als Partner zusammen.
      </InfoBox>

      <div className="px-5 flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5">
        {filtered.map((project) => {
          // Owner-Check identisch zur "Dein Projekt"-Kennzeichnung unten
          // und zum Server-Guard in /projekte/[id]/bewerbungen/page.tsx.
          // Nur own-Projects öffnen die Bewerbungsübersicht beim Card-Klick;
          // fremde Cards bleiben click-passiv (User nutzt den Button rechts).
          const isOwn = project.userId === currentUserId;
          return (
          <div
            key={project.id}
            onClick={isOwn ? () => router.push(`/projekte/${project.id}/bewerbungen`) : undefined}
            role={isOwn ? "button" : undefined}
            tabIndex={isOwn ? 0 : undefined}
            onKeyDown={isOwn ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/projekte/${project.id}/bewerbungen`);
              }
            } : undefined}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: 18,
              position: "relative",
              overflow: "hidden",
              cursor: isOwn ? "pointer" : "default",
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
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  <MapPin size={12} color="#694CBB" strokeWidth={2} />
                  {project.location}
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
              {(() => {
                const status = appliedStatus[project.id];
                // Eigene Projekte: kein Bewerben-Button.
                if (isOwn) {
                  return <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Dein Projekt</span>;
                }
                let label: string;
                let disabled = false;
                let onClick: (() => void) | undefined;
                let muted = false;
                if (status === "pending") {
                  label = "Bewerbung läuft"; disabled = true; muted = true;
                } else if (status === "accepted") {
                  label = "Chat öffnen"; onClick = () => router.push(`/?tab=chats&with=${project.userId}`);
                } else if (status === "rejected") {
                  label = "Abgelehnt"; disabled = true; muted = true;
                } else {
                  label = "Bewerben"; onClick = () => setModalProject(project);
                }
                return (
                  <button
                    onClick={onClick}
                    disabled={disabled}
                    style={{
                      padding: "9px 20px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: disabled ? "default" : "pointer",
                      border: muted
                        ? "1px solid rgba(255,255,255,0.1)"
                        : `1px solid ${project.color}55`,
                      background: muted
                        ? "rgba(255,255,255,0.04)"
                        : `linear-gradient(135deg, ${project.color}33, ${project.color}11)`,
                      color: muted ? "rgba(255,255,255,0.3)" : project.color,
                      transition: "all 0.2s",
                    }}
                  >
                    {label}
                  </button>
                );
              })()}
            </div>
          </div>
          );
        })}
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
