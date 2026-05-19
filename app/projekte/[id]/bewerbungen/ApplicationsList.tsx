"use client";

// Client-Component für die Bewerbungs-Liste. Server-Component (page.tsx)
// macht Auth + Owner-Check + initialer Fetch; hier passiert die ganze
// Interaktivität: Accept/Reject-Buttons, Realtime-Updates, Connection
// auto-anlegen damit Chat nach Accept funktioniert.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";

type ApplicantProfile = {
  id: number;
  name: string;
  avatar: string | null;
  color: string;
  role: string | null;
};

export type Application = {
  id: number;
  user_id: number;
  project_id: number;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.floor(h / 24);
  if (d === 1) return "gestern";
  return `vor ${d} Tagen`;
}

type StatusStyle = { label: string; color: string; bg: string; border: string };
const STATUS_STYLES: Record<Application["status"], StatusStyle> = {
  pending:  { label: "Offen",      color: "rgba(255,255,255,0.55)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)" },
  accepted: { label: "Akzeptiert", color: "#10b981",                bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.32)" },
  rejected: { label: "Abgelehnt",  color: "#f87171",                bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.28)" },
};

type Props = {
  projectId: number;
  ownerProfileId: number;
  applicants: Record<number, ApplicantProfile>;
  initialApplications: Application[];
};

export default function ApplicationsList({
  projectId, ownerProfileId, applicants: applicantsInitial, initialApplications,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [applicants, setApplicants] = useState<Record<number, ApplicantProfile>>(applicantsInitial);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  // Realtime: Status-Updates live reflektieren (z.B. wenn Owner von zwei
  // Geräten gleichzeitig accepted). Filter weggelassen — REPLICA IDENTITY
  // DEFAULT liefert sonst keine non-PK-Spalten bei UPDATE-Events.
  useEffect(() => {
    const channel = supabase
      .channel(`applications-project-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newRow = payload.new as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const oldRow = payload.old as any;
          const rowProjectId = newRow?.project_id ?? oldRow?.project_id;
          if (rowProjectId !== projectId) return;
          // Refetch — einfacher als delta-mergen, niedrige Frequenz.
          void reloadApplications();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, supabase]);

  const reloadApplications = async () => {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, user_id, project_id, message, status, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    const list = (apps ?? []) as Application[];
    setApplications(list);

    // Neue Applicant-Profile nachladen, falls jemand bewirbt während wir
    // schauen.
    const knownIds = new Set(Object.keys(applicants).map(Number));
    const missingIds = list.map((a) => a.user_id).filter((id) => !knownIds.has(id));
    if (missingIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar, color, role")
        .in("id", Array.from(new Set(missingIds)));
      setApplicants((prev) => {
        const next = { ...prev };
        for (const p of profiles ?? []) {
          next[p.id as number] = {
            id: p.id as number,
            name: (p.name as string) ?? "Nutzer",
            avatar: (p.avatar as string | null) ?? null,
            color: (p.color as string) ?? "#6366f1",
            role: (p.role as string | null) ?? null,
          };
        }
        return next;
      });
    }
  };

  // Pattern wie Connect-Bug (f1fb580): optimistic State, prev-Wert
  // sichern, bei DB-Error → State zurückrollen + Inline-Banner.

  const handleAccept = async (app: Application) => {
    const prevStatus = app.status;
    setPendingActionId(app.id);
    setActionError(null);
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: "accepted" } : a)),
    );

    // 1) Application auf 'accepted' setzen (Trigger feuert die
    //    application_accepted-Notification automatisch).
    const { error: updErr } = await supabase
      .from("applications")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", app.id);
    if (updErr) {
      console.error("[applications] accept update failed:", updErr);
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: prevStatus } : a)),
      );
      setActionError(`Annehmen fehlgeschlagen: ${updErr.message}`);
      setPendingActionId(null);
      return;
    }

    // 2) Connection (Owner ↔ Applicant) als accepted aufrufen — der
    //    messages-RLS-Check verlangt eine accepted-Connection in
    //    irgendeiner Richtung. upsert ist atomisch. Connection-Fehler
    //    rollt die Bewerbung NICHT zurück — Status ist gesetzt,
    //    Notification ging raus, fehlende Connection ist Folge-Bug.
    const { error: conErr } = await supabase
      .from("connections")
      .upsert(
        { user_id: ownerProfileId, target_id: app.user_id, status: "accepted" },
        { onConflict: "user_id,target_id" },
      );
    if (conErr) {
      console.error("[applications] connection upsert failed:", conErr);
      setActionError(
        `Bewerbung angenommen, aber Chat-Verbindung konnte nicht angelegt werden: ${conErr.message}`,
      );
    }

    setPendingActionId(null);
  };

  const handleReject = async (app: Application) => {
    const prevStatus = app.status;
    setPendingActionId(app.id);
    setActionError(null);
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: "rejected" } : a)),
    );

    const { error } = await supabase
      .from("applications")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", app.id);
    if (error) {
      console.error("[applications] reject update failed:", error);
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: prevStatus } : a)),
      );
      setActionError(`Ablehnen fehlgeschlagen: ${error.message}`);
      setPendingActionId(null);
      return;
    }

    setPendingActionId(null);
  };

  const openChat = (applicantId: number) => {
    router.push(`/?tab=chats&with=${applicantId}`);
  };

  if (applications.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.4)" }}>
        <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          Noch keine Bewerbungen
        </p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
          Sobald sich jemand auf dein Projekt bewirbt, erscheint die Nachricht hier.
        </p>
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div
          role="alert"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12,
            padding: "10px 14px",
            color: "#fca5a5",
            fontSize: 13,
            lineHeight: 1.4,
            marginBottom: 14,
          }}
        >
          {actionError}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {applications.map((app) => {
          const applicant = applicants[app.user_id];
          if (!applicant) return null;
          const ss = STATUS_STYLES[app.status];
          const dim = app.status === "rejected";
          const busy = pendingActionId === app.id;

          return (
            <div key={app.id} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: 16,
              opacity: dim ? 0.55 : 1,
              transition: "opacity 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: app.message ? 12 : 0 }}>
                {/* Avatar + Name → ProfileScreen-Overlay via AppShell-?profile=. */}
                <Link
                  href={`/?tab=discover&profile=${applicant.id}`}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, textDecoration: "none", color: "inherit", overflow: "hidden" }}
                >
                  <Avatar
                    src={applicant.avatar ?? applicant.name.charAt(0)}
                    color={applicant.color}
                    size={44}
                    radius={13}
                  />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{applicant.name}</span>
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                        background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color,
                      }}>
                        {ss.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      {applicant.role ?? "Founder"} · {relativeTime(app.created_at)}
                    </div>
                  </div>
                </Link>
              </div>

              {app.message && (
                <p style={{
                  margin: 0, fontSize: 14, lineHeight: 1.55,
                  color: "rgba(255,255,255,0.75)",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12, padding: "12px 14px",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {app.message}
                </p>
              )}

              {/* Action-Buttons */}
              {app.status === "pending" && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => handleAccept(app)}
                    disabled={busy}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#fff", fontWeight: 700, fontSize: 13,
                      cursor: busy ? "default" : "pointer",
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    {busy ? "…" : "Akzeptieren"}
                  </button>
                  <button
                    onClick={() => handleReject(app)}
                    disabled={busy}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: 13,
                      cursor: busy ? "default" : "pointer",
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    Ablehnen
                  </button>
                </div>
              )}

              {app.status === "accepted" && (
                <button
                  onClick={() => openChat(app.user_id)}
                  style={{
                    width: "100%", marginTop: 12, padding: "10px 0",
                    borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                  }}
                >
                  Chat öffnen
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
