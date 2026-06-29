"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, MessageCircle, Folder, User as UserIcon } from "lucide-react";
import { User, Project } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { unlockAudio } from "@/app/lib/audio";
import DiscoverScreen from "@/app/components/DiscoverScreen";
import MatchScreen from "@/app/components/MatchScreen";
import ProjectBoard from "@/app/components/ProjectBoard";
import ProfileScreen from "@/app/components/ProfileScreen";
import ChatsScreen from "@/app/components/ChatsScreen";
import ChatWindow from "@/app/components/ChatWindow";
import ProfileDashboard from "@/app/components/ProfileDashboard";

type Tab = "discover" | "match" | "chats" | "projects" | "profile";

const navItems: { icon: React.ElementType; label: string; id: Tab }[] = [
  { icon: Search, label: "Entdecken", id: "discover" },
  { icon: Users, label: "Connect", id: "match" },
  { icon: MessageCircle, label: "Chats", id: "chats" },
  { icon: Folder, label: "Projekte", id: "projects" },
  { icon: UserIcon, label: "Profil", id: "profile" },
];

type Props = {
  initialUsers: User[];
  initialProjects: Project[];
  currentUserId: number | null;
  currentUserName: string | null;
  currentUserAvatar: string | null;
  currentUserColor: string | null;
  initialTab?: string;
  // Optional deep-link aus Notification ("application_accepted") oder
  // ProjectBoard ("Chat öffnen"-Button): /?tab=chats&with=<profileId>.
  // Wird zu setChatWith(matchingUser) beim Mount.
  initialChatWithProfileId?: number | null;
  // Optional deep-link aus ApplicationsList ("Profil ansehen"-Klick auf
  // Bewerber-Karte): /?tab=discover&profile=<profileId>. Wird zu
  // setSelectedUser(matchingUser) → ProfileScreen-Overlay.
  initialSelectedProfileId?: number | null;
};

const VALID_TABS: Tab[] = ["discover", "match", "chats", "projects", "profile"];

export default function AppShell({
  initialUsers,
  initialProjects,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserColor,
  initialTab,
  initialChatWithProfileId,
  initialSelectedProfileId,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(
    VALID_TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "discover"
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(() => {
    if (!initialSelectedProfileId) return null;
    return initialUsers.find((u) => u.id === initialSelectedProfileId) ?? null;
  });
  // Initial chatWith aus Deep-Link auflösen (?with=<profileId>).
  const [chatWith, setChatWith] = useState<User | null>(() => {
    if (!initialChatWithProfileId) return null;
    return initialUsers.find((u) => u.id === initialChatWithProfileId) ?? null;
  });

  // Bei Soft-Navigate (router.push) bleibt AppShell mounted, useState-Init
  // läuft nicht erneut. Dieser Effect synced den State, wenn der Prop sich
  // ändert. Auslöser z.B. ProjectBoard "Chat öffnen" für Bewerber.
  useEffect(() => {
    if (initialChatWithProfileId) {
      const user = initialUsers.find((u) => u.id === initialChatWithProfileId);
      if (user) {
        setChatWith(user);
        setTab("chats");
      }
    }
  }, [initialChatWithProfileId, initialUsers]);

  // Analog für ?profile= — Bewerber-Karte in ApplicationsList soll Profile-
  // Overlay öffnen.
  useEffect(() => {
    if (initialSelectedProfileId) {
      const user = initialUsers.find((u) => u.id === initialSelectedProfileId);
      if (user) setSelectedUser(user);
    }
  }, [initialSelectedProfileId, initialUsers]);
  const [followed, setFollowed] = useState<Record<number, boolean>>({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // iOS Safari: AudioContext startet 'suspended' und wird nur durch ein
  // User-Gesture entsperrt. Beim ersten Touch/Click irgendwo in der App
  // ctx.resume() rufen — danach spielt auch der Receive-Sound aus dem
  // Realtime-WebSocket-Event durch.
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
    document.addEventListener("click", unlock, { once: true });
    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();

    const loadPending = async () => {
      const { count } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("target_id", currentUserId)
        .eq("status", "pending");
      setPendingCount(count ?? 0);
    };

    loadPending();

    // Filter raus — UPDATE-Events liefern bei Postgres-Realtime mit
    // REPLICA IDENTITY DEFAULT nur die PK-Spalte zurück, sodass der
    // recipient_id-Filter UPDATEs verschluckt. Stattdessen reagieren wir
    // auf jede Connections-Änderung und refetchen den Counter (loadPending
    // filtert selbst auf currentUserId). Bei kleinen User-Zahlen kein
    // Performance-Problem.
    const pendingChannel = supabase
      .channel("pending-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections" },
        () => loadPending()
      )
      .subscribe();

    return () => { supabase.removeChannel(pendingChannel); };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();

    const loadUnread = async () => {
      // Counter aus Liste abgeleitet (statt head:true count) — robuster
      // gegen Replica-Identity-Defaults beim Mark-as-Read-UPDATE.
      const { data } = await supabase
        .from("notifications")
        .select("id")
        .eq("recipient_id", currentUserId)
        .eq("is_read", false);
      setUnreadCount(data?.length ?? 0);
    };

    loadUnread();

    // Filter raus (siehe Pending-Channel-Kommentar oben) — wir refetchen
    // bei jeder Notifications-Änderung und filtern serverseitig per
    // recipient_id im loadUnread-Call.
    // Diagnose-Log lässt sich im Browser-DevTools beobachten — wenn der
    // Log bei einem INSERT nie feuert, hat der Realtime-Channel das
    // Event nicht bekommen (Sub-Status / Publication / RLS-SELECT auf
    // notifications für authenticated prüfen).
    const notifChannel = supabase
      .channel("notif-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          console.log("[notif-badge] realtime event", {
            event: payload.eventType, table: payload.table,
          });
          loadUnread();
        },
      )
      .subscribe((status) => {
        console.log("[notif-badge] subscribe status:", status);
      });

    return () => { supabase.removeChannel(notifChannel); };
  }, [currentUserId]);
  const openChat = (user: User) => {
    setChatWith(user);
    setTab("chats");
  };

  // Beim Mount/currentUserId-change die eigenen Follows aus der DB ziehen
  // und in den followed-Record schreiben. Vorher blieb der State leer →
  // jeder Klick auf "Folgen" landete als rohes INSERT auf einer schon
  // existierenden (follower_id, following_id)-Zeile → 409 Duplicate-Key,
  // Button sprang zurück. follower_id und following_id sind beide
  // integer profiles.id (NICHT auth.uid).
  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId);
      if (error) {
        console.error("[follow] initial load failed:", error);
        return;
      }
      const map: Record<number, boolean> = {};
      for (const row of data ?? []) {
        map[row.following_id as number] = true;
      }
      setFollowed(map);
    })();
  }, [currentUserId]);

  const toggleFollow = async (id: number) => {
    if (!currentUserId) return;
    // Self-Follow defensiv blockieren — UI rendert den Button bei
    // Self eh nicht mehr, das hier ist die zweite Verteidigungslinie
    // (und der CHECK-Constraint in der DB die dritte).
    if (id === currentUserId) return;

    const wasFollowed = !!followed[id];
    // Optimistic update
    setFollowed((prev) => ({ ...prev, [id]: !wasFollowed }));

    const supabase = createClient();
    if (wasFollowed) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .match({ follower_id: currentUserId, following_id: id });
      if (error) {
        console.error("[follow] unfollow failed:", error);
        setFollowed((prev) => ({ ...prev, [id]: wasFollowed }));
      }
    } else {
      // upsert + ignoreDuplicates: falls eine race-condition oder
      // Stale-State-Annahme dazu führt dass die Zeile schon existiert,
      // wird kein 409 mehr geworfen — kein revert nötig.
      const { error } = await supabase
        .from("follows")
        .upsert(
          { follower_id: currentUserId, following_id: id },
          { onConflict: "follower_id,following_id", ignoreDuplicates: true },
        );
      if (error) {
        console.error("[follow] follow failed:", error);
        setFollowed((prev) => ({ ...prev, [id]: wasFollowed }));
      }
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

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
      {/* Main content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {selectedUser ? (
          <ProfileScreen
            user={selectedUser}
            onBack={() => setSelectedUser(null)}
            followed={followed}
            toggleFollow={toggleFollow}
            currentUserId={currentUserId}
            onOpenChat={openChat}
          />
        ) : tab === "discover" ? (
          <DiscoverScreen
            users={initialUsers}
            onSelectUser={setSelectedUser}
            followed={followed}
            toggleFollow={toggleFollow}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            unreadCount={unreadCount}
            onOpenNotifications={() => router.push("/mitteilungen")}
            currentUserId={currentUserId}
          />
        ) : tab === "match" ? (
          <MatchScreen
            users={initialUsers}
            currentUserId={currentUserId}
            onOpenChat={openChat}
          />
        ) : tab === "chats" ? (
          <ChatsScreen
            currentUserId={currentUserId}
            onOpenChat={openChat}
          />
        ) : tab === "projects" ? (
          <ProjectBoard
            initialProjects={initialProjects}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            currentUserColor={currentUserColor}
          />
        ) : (
          <ProfileDashboard
            currentUserId={currentUserId}
            onLogout={handleLogout}
            onOpenChat={openChat}
          />
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "10px 0 20px",
        display: "flex", justifyContent: "space-around",
        zIndex: 100,
      }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setSelectedUser(null);
              setChatWith(null);
              setTab(item.id);
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: tab === item.id && !selectedUser && !chatWith
                ? "#6366f1"
                : "rgba(255,255,255,0.3)",
              transition: "color 0.15s",
              padding: "4px 8px",
            }}
          >
            <div style={{ position: "relative", display: "inline-flex" }}>
              <item.icon size={18} />
              {item.id === "match" && pendingCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -6,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: "#ef4444",
                  fontSize: 9, fontWeight: 700, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 3px", boxSizing: "border-box",
                }}>
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.3 }}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Chat window — full-screen overlay */}
      {chatWith && currentUserId && (
        <div style={{
          position: "fixed", top: 0,
          height: "100dvh",          /* shrinks with keyboard on iOS 16+ */
          left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430,
          zIndex: 500, background: "#0a0a0f",
          overflow: "hidden",
        }}>
          <ChatWindow
            partner={chatWith}
            currentUserId={currentUserId}
            onBack={() => setChatWith(null)}
          />
        </div>
      )}
    </div>
  );
}
