"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { categories, Project } from "@/app/lib/data";
import { timeAgo } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import ApplicationModal from "@/app/components/ApplicationModal";
import InfoBox from "@/app/components/InfoBox";
import { Avatar } from "@/app/components/Avatar";
import { Tag } from "@/app/components/Tag";

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: -0.4,
                color: "var(--foreground)",
              }}
            >
              Projekte
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
              {filtered.length} offene Ausschreibungen
            </p>
          </div>
          <button
            onClick={() => router.push("/projekte/neu")}
            style={{
              padding: "9px 16px",
              borderRadius: "var(--radius-button)",
              background: "var(--brand)",
              border: "none",
              color: "#fff",
              fontWeight: 600,
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
        <div style={{ position: "relative", marginTop: 16 }}>
          <Search
            size={16}
            strokeWidth={2}
            style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-dim)", pointerEvents: "none",
            }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Projekte suchen…"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "var(--surface-2)",
              border: `1px solid ${query ? "var(--brand-soft)" : "var(--border)"}`,
              borderRadius: 10, padding: "11px 14px 11px 40px",
              color: "var(--foreground)", fontSize: 14, outline: "none",
              fontFamily: "var(--font-sans)",
              transition: "border-color 0.15s",
            }}
          />
        </div>
      </div>

      <div
        className="hide-scrollbar"
        style={{ display: "flex", gap: 8, padding: "0 20px 16px", overflowX: "auto" }}
      >
        {categories.map((cat) => {
          const active = filterCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCat(cat.id)}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: "var(--radius-tag)",
                whiteSpace: "nowrap",
                border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
                background: active ? "var(--brand-soft)" : "var(--surface-2)",
                color: active ? "var(--foreground)" : "var(--text-dim)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <InfoBox>
        Pitche dein eigenes Projekt oder bewirb dich auf Projekte anderer Gründer. Bei Interesse
        meldet sich die jeweils andere Seite direkt bei dir, und ihr findet als Partner zusammen.
      </InfoBox>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
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
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-card)",
              padding: 16,
              cursor: isOwn ? "pointer" : "default",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Avatar
                src={project.avatar}
                color={project.color}
                size={32}
                radius={8}
                shadow={false}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{project.userName}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{project.timeAgo}</div>
              </div>
              <Tag>{project.model}</Tag>
            </div>

            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
              {project.title}
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {project.desc}
            </p>

            {(project.tags.length > 0 || project.location) && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {project.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
                {project.location && (
                  <Tag>
                    <MapPin size={11} color="var(--text-dim)" strokeWidth={2} style={{ marginRight: 4 }} />
                    {project.location}
                  </Tag>
                )}
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
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                  {project.applicants}
                </span>{" "}
                Bewerber
              </span>
              {(() => {
                const status = appliedStatus[project.id];
                if (isOwn) {
                  return <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Dein Projekt</span>;
                }
                let label: string;
                let disabled = false;
                let onClick: (() => void) | undefined;
                let primary = false;
                if (status === "pending") {
                  label = "Bewerbung läuft"; disabled = true;
                } else if (status === "accepted") {
                  label = "Chat öffnen"; onClick = () => router.push(`/?tab=chats&with=${project.userId}`); primary = true;
                } else if (status === "rejected") {
                  label = "Abgelehnt"; disabled = true;
                } else {
                  label = "Bewerben"; onClick = () => setModalProject(project); primary = true;
                }
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick?.();
                    }}
                    disabled={disabled}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-button)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: disabled ? "default" : "pointer",
                      border: primary ? "1px solid var(--brand)" : "1px solid var(--border)",
                      background: primary ? "var(--brand-soft)" : "var(--surface-2)",
                      color: disabled ? "var(--text-dim)" : "var(--foreground)",
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
            background: "var(--brand-soft)",
            border: "1px solid var(--brand)",
            borderRadius: "var(--radius-card)",
            padding: "12px 14px",
            color: "var(--foreground)",
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.4,
            backdropFilter: "blur(12px)",
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
