"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Project } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import DiscoverScreen from "@/app/components/DiscoverScreen";
import MatchScreen from "@/app/components/MatchScreen";
import ProjectBoard from "@/app/components/ProjectBoard";
import ProfileScreen from "@/app/components/ProfileScreen";
import ChatsScreen from "@/app/components/ChatsScreen";
import ChatWindow from "@/app/components/ChatWindow";
import ProfileDashboard from "@/app/components/ProfileDashboard";

type Tab = "discover" | "match" | "chats" | "projects" | "profile";

const navItems: { icon: string; label: string; id: Tab }[] = [
  { icon: "◈", label: "Entdecken", id: "discover" },
  { icon: "🤝", label: "Connect", id: "match" },
  { icon: "💬", label: "Chats", id: "chats" },
  { icon: "✦", label: "Projekte", id: "projects" },
  { icon: "◉", label: "Profil", id: "profile" },
];

type Props = {
  initialUsers: User[];
  initialProjects: Project[];
  currentUserId: number | null;
  currentUserName: string | null;
  currentUserAvatar: string | null;
  currentUserColor: string | null;
};

export default function AppShell({
  initialUsers,
  initialProjects,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserColor,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("discover");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatWith, setChatWith] = useState<User | null>(null);
  const [followed, setFollowed] = useState<Record<number, boolean>>({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();

    const loadCount = async () => {
      const { count } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("target_id", currentUserId)
        .eq("status", "pending");
      setPendingCount(count ?? 0);
    };

    loadCount();

    const channel = supabase
      .channel("pending-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections", filter: `target_id=eq.${currentUserId}` },
        () => loadCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
      {/* Background glows */}
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
              <span style={{ fontSize: 18 }}>{item.icon}</span>
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
