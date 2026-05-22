"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Folder, MessageCircle, Search, Users, User as UserIcon } from "lucide-react";
import { User, Project } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { unlockAudio } from "@/app/lib/audio";
import NotificationBell from "@/app/components/NotificationBell";
import DiscoverScreen from "@/app/components/DiscoverScreen";
import MatchScreen from "@/app/components/MatchScreen";
import ProjectBoard from "@/app/components/ProjectBoard";
import ProfileScreen from "@/app/components/ProfileScreen";
import ChatsScreen from "@/app/components/ChatsScreen";
import ChatWindow from "@/app/components/ChatWindow";
import ProfileDashboard from "@/app/components/ProfileDashboard";

type Tab = "discover" | "match" | "chats" | "projects" | "profile";

// Mobile Bottom-Tab — 5 Items inkl. Entdecken, unverändert.
const navItems: { icon: React.ElementType; label: string; id: Tab }[] = [
  { icon: Search, label: "Entdecken", id: "discover" },
  { icon: Users, label: "Connect", id: "match" },
  { icon: MessageCircle, label: "Chats", id: "chats" },
  { icon: Folder, label: "Projekte", id: "projects" },
  { icon: UserIcon, label: "Profil", id: "profile" },
];

// Desktop-Sidebar — paritätisch zur Mobile-Bottom-Nav (5 Items, identische
// Glyphen). Reihenfolge per Nachtrag-Spec: Entdecken, Profil, Connect,
// Chats, Projekte.
const sidebarNavItems: { icon: React.ElementType; label: string; id: Tab }[] = [
  { icon: Search, label: "Entdecken", id: "discover" },
  { icon: UserIcon, label: "Profil", id: "profile" },
  { icon: Users, label: "Connect", id: "match" },
  { icon: MessageCircle, label: "Chats", id: "chats" },
  { icon: Folder, label: "Projekte", id: "projects" },
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
  // Subset von unreadCount — nur new_message-Notifications, für das
  // Chats-Badge in der Desktop-Sidebar.
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

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
      // Plus: type mit selecten, damit wir den Chats-Subset (new_message)
      // im gleichen Roundtrip ableiten können statt zweiten Query.
      const { data } = await supabase
        .from("notifications")
        .select("id, type")
        .eq("recipient_id", currentUserId)
        .eq("is_read", false);
      const list = data ?? [];
      setUnreadCount(list.length);
      setUnreadChatsCount(list.filter((n) => n.type === "new_message").length);
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

  const toggleFollow = async (id: number) => {
    if (!currentUserId) return;
    const isFollowed = !!followed[id];
    setFollowed((prev) => ({ ...prev, [id]: !isFollowed }));
    const supabase = createClient();
    if (isFollowed) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", id);
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: id });
    }
  };

  // Tab-Wechsel mit Reset von Overlays — wiederverwendet für Mobile-Bottom-
  // Nav und Desktop-Sidebar.
  const goToTab = (id: Tab) => {
    setSelectedUser(null);
    setChatWith(null);
    setTab(id);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div
      className="lg:flex"
      style={{
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        background: "#0a0a0f",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      {/* Background glows — position:fixed, gelten egal ob mobile oder desktop layout */}
      <div style={{
        position: "fixed", top: -100, left: -100, width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -100, right: -100, width: 400, height: 400,
        background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR (lg+ only)
          ──────────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-80 h-screen sticky top-0 bg-[#0a0a0f] border-r border-white/10 z-30">
        {/* Logo */}
        <div className="px-12 py-8">
          <Image
            src="/connectyfind-logo-light.svg"
            alt="Connectyfind"
            width={160}
            height={44}
            priority
            style={{ height: 44, width: "auto" }}
          />
        </div>

        {/* Nav-Items — Brevo-Style Pillen (rounded-full, kein Akzent-Balken).
            Einstellungen/Abmelden sind im Profil-Tab erreichbar — kein
            Avatar-Block unten. */}
        <nav className="flex flex-col gap-3 px-8 py-2">
          {sidebarNavItems.map((item) => {
            const active = tab === item.id && !selectedUser && !chatWith;
            const Icon = item.icon;
            const badge =
              item.id === "match" ? pendingCount :
              item.id === "chats" ? unreadChatsCount :
              0;
            return (
              <button
                key={item.id}
                onClick={() => goToTab(item.id)}
                className={
                  active
                    ? "rounded-full px-4 py-3.5 flex items-center gap-4 transition-colors text-white bg-[#401586]/20 font-semibold"
                    : "rounded-full px-4 py-3.5 flex items-center gap-4 transition-colors text-white/70 hover:text-white hover:bg-white/5 font-medium"
                }
              >
                <Icon size={22} />
                <span className="text-[15px] flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span style={{
                    minWidth: 20, height: 20, borderRadius: 10,
                    background: "#ef4444",
                    fontSize: 11, fontWeight: 700, color: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "0 6px",
                  }}>
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          MAIN COLUMN (auf Desktop rechts neben Sidebar, auf Mobile alles)
          ──────────────────────────────────────────────────────────────── */}
      <div className="relative mx-auto w-full max-w-[430px] lg:max-w-none lg:flex-1 lg:flex lg:flex-col lg:min-w-0">
        {/* Desktop Top-Bar */}
        <header className="hidden lg:flex h-16 sticky top-0 border-b border-white/10 items-center justify-end px-8 z-20" style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)" }}>
          <NotificationBell unreadCount={unreadCount} onClick={() => router.push("/mitteilungen")} />
        </header>

        {/* Main content — Mobile full-width im 430-Wrapper, Desktop max-w-1280 zentriert */}
        <div className="relative z-[1] lg:max-w-[1280px] lg:mx-auto lg:px-8 lg:py-6 lg:w-full">
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
      </div>

      {/* Mobile Bottom-Nav — lg:hidden, sonst exakt wie vorher.
          display via Tailwind-Klassen (flex lg:hidden), nicht inline,
          sonst überschreibt das inline-display:flex die lg:hidden-Klasse
          und die Bar bleibt auf Desktop sichtbar. */}
      <nav
        className="flex lg:hidden"
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430,
          background: "rgba(10,10,15,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 0 20px",
          justifyContent: "space-around",
          zIndex: 100,
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => goToTab(item.id)}
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
