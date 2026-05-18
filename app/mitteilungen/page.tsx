"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";

type NotifType =
  | "connection_request"
  | "connection_accepted"
  | "new_message"
  | "new_project"
  | "application_received"
  | "application_accepted"
  | "application_rejected";

type Notification = {
  id: number;
  type: NotifType;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
  sender: {
    id: number;
    name: string;
    avatar: string | null;
    color: string;
  } | null;
  // Nur befüllt für application_received — wird im init-Effect nachgeladen,
  // weil related_id keinen FK-Constraint auf projects hat (kein Auto-Join).
  projectTitle?: string;
};

function notifText(notif: Notification): string {
  switch (notif.type) {
    case "connection_request": return `möchte sich mit dir connecten`;
    case "connection_accepted": return `hat deine Anfrage angenommen`;
    case "new_message": return `hat dir eine Nachricht gesendet`;
    case "new_project": return `hat ein neues Projekt veröffentlicht`;
    case "application_received":
      return `hat sich auf dein Projekt "${notif.projectTitle ?? "…"}" beworben`;
    case "application_accepted":
      return `hat deine Bewerbung auf "${notif.projectTitle ?? "…"}" angenommen`;
    case "application_rejected":
      return `hat deine Bewerbung auf "${notif.projectTitle ?? "…"}" abgelehnt`;
  }
}

// Deep-Link je Notification-Typ. application_received geht direkt zur
// Bewerbungs-Liste des Projekts; alles andere zur passenden Tab im AppShell.
function notifHref(notif: Notification): string {
  switch (notif.type) {
    case "application_received":
      return notif.related_id ? `/projekte/${notif.related_id}/bewerbungen` : "/?tab=projects";
    case "application_accepted":
      // Owner ist sender_id — Chat mit ihm öffnen via ?with=
      return notif.sender?.id ? `/?tab=chats&with=${notif.sender.id}` : "/?tab=projects";
    case "application_rejected":
      return notif.related_id ? `/projekte` : "/?tab=projects";
    case "connection_request":
    case "connection_accepted":
      return "/?tab=match";
    case "new_message":
      return "/?tab=chats";
    case "new_project":
      return "/?tab=projects";
  }
}

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

export default function MitteilungenPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!profile) { setLoading(false); return; }
      setCurrentUserId(profile.id);

      const { data } = await supabase
        .from("notifications")
        .select(`
          id, type, related_id, is_read, created_at,
          sender:profiles!sender_id(id, name, avatar, color)
        `)
        .eq("recipient_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const baseList: Notification[] = (data ?? []).map((n: any) => ({
        id: n.id,
        type: n.type,
        related_id: n.related_id,
        is_read: n.is_read,
        created_at: n.created_at,
        sender: Array.isArray(n.sender) ? n.sender[0] ?? null : n.sender ?? null,
      }));

      // Project-Titles für application_*-Notifications nachladen (alle drei
      // Types haben related_id = project_id, kein FK auf projects).
      const APPLICATION_TYPES: NotifType[] = [
        "application_received", "application_accepted", "application_rejected",
      ];
      const projectIds = Array.from(
        new Set(
          baseList
            .filter((n) => APPLICATION_TYPES.includes(n.type) && n.related_id != null)
            .map((n) => n.related_id as number),
        ),
      );
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from("projects")
          .select("id, title")
          .in("id", projectIds);
        const titleById = new Map<number, string>(
          (projects ?? []).map((p) => [p.id as number, (p.title as string) ?? ""]),
        );
        for (const n of baseList) {
          if (APPLICATION_TYPES.includes(n.type) && n.related_id != null) {
            n.projectTitle = titleById.get(n.related_id);
          }
        }
      }

      setNotifications(baseList);
      setLoading(false);
    };
    init();
  }, [supabase, router]);

  const markRead = async (notif: Notification) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n)
      );
    }
    router.push(notifHref(notif));
  };

  const markAllRead = async () => {
    if (!currentUserId) return;
    await supabase.from("notifications").update({ is_read: true })
      .eq("recipient_id", currentUserId).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: -100, left: -100, width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(20px)",
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
          >
            ← Zurück
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            Mitteilungen
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 20,
                background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)",
                color: "#6366f1", fontWeight: 700, verticalAlign: "middle",
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: "none", border: "none", color: "#6366f1",
              fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0",
            }}
          >
            Alle gelesen
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, paddingBottom: 40 }}>
        {loading && (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
            Lade…
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{ padding: "80px 32px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <Bell size={52} color="#694CBB" strokeWidth={1.5} />
            </div>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 16 }}>Keine Mitteilungen</p>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              Hier erscheinen Benachrichtigungen über Anfragen, Matches und Nachrichten.
            </p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div style={{ padding: "8px 0" }}>
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => markRead(notif)}
                style={{
                  width: "100%", display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "14px 20px",
                  background: notif.is_read ? "none" : "rgba(99,102,241,0.05)",
                  border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.15s",
                  position: "relative",
                }}
              >
                {/* Unread indicator */}
                {!notif.is_read && (
                  <div style={{
                    position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
                    width: 6, height: 6, borderRadius: 3, background: "#6366f1",
                    flexShrink: 0,
                  }} />
                )}

                {/* Avatar */}
                <div style={{ flexShrink: 0, marginLeft: notif.is_read ? 0 : 4 }}>
                  {notif.sender ? (
                    <Avatar
                      src={notif.sender.avatar ?? notif.sender.name.charAt(0)}
                      color={notif.sender.color}
                      size={44}
                      radius={13}
                    />
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                      background: "rgba(99,102,241,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Bell size={20} color="#a78bfa" strokeWidth={2} />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 14, lineHeight: 1.45, color: "#fff" }}>
                    {notif.sender && (
                      <strong style={{ color: "#fff" }}>{notif.sender.name} </strong>
                    )}
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>
                      {notifText(notif)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                    {relativeTime(notif.created_at)}
                  </div>
                </div>

                {/* Arrow */}
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.15)", flexShrink: 0, marginTop: 2 }}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
