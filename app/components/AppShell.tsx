"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Project } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import DiscoverScreen from "@/app/components/DiscoverScreen";
import MatchScreen from "@/app/components/MatchScreen";
import ProjectBoard from "@/app/components/ProjectBoard";
import ProfileScreen from "@/app/components/ProfileScreen";

type Tab = "discover" | "match" | "projects" | "profile";

const navItems = [
  { icon: "◈", label: "Entdecken", id: "discover" as Tab },
  { icon: "🤝", label: "Connect", id: "match" as Tab },
  { icon: "✦", label: "Projekte", id: "projects" as Tab },
  { icon: "◉", label: "Profil", id: "profile" as Tab },
];

type Props = {
  initialUsers: User[];
  initialProjects: Project[];
  currentUserId: number | null;
  currentUserName: string | null;
  currentUserAvatar: string | null;
  currentUserColor: string | null;
};

export default function AppShell({ initialUsers, initialProjects, currentUserId, currentUserName, currentUserAvatar, currentUserColor }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("discover");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [followed, setFollowed] = useState<Record<number, boolean>>({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [loggingOut, setLoggingOut] = useState(false);

  const toggleFollow = async (id: number) => {
    if (!currentUserId) return;
    const isFollowed = !!followed[id];
    setFollowed((prev) => ({ ...prev, [id]: !isFollowed }));

    const supabase = createClient();
    if (isFollowed) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", id);
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: id });
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        background: "#0a0a0f",
        minHeight: "100vh",
        color: "#fff",
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {selectedUser ? (
          <ProfileScreen
            user={selectedUser}
            onBack={() => setSelectedUser(null)}
            followed={followed}
            toggleFollow={toggleFollow}
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
          <MatchScreen users={initialUsers} currentUserId={currentUserId} />
        ) : tab === "projects" ? (
          <ProjectBoard
            initialProjects={initialProjects}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            currentUserColor={currentUserColor}
          />
        ) : (
          <div style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: currentUserColor ? `linear-gradient(135deg, ${currentUserColor}, ${currentUserColor}88)` : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 700, boxShadow: `0 8px 32px ${currentUserColor ?? "#6366f1"}44`,
            }}>
              {currentUserAvatar ?? "◉"}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{currentUserName ?? "Dein Profil"}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Mitglied bei FounderConnect</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                padding: "13px 32px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: loggingOut ? "rgba(255,255,255,0.3)" : "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: loggingOut ? "default" : "pointer",
              }}
            >
              {loggingOut ? "Abmelden..." : "Abmelden"}
            </button>
          </div>
        )}
      </div>

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          background: "rgba(10,10,15,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "12px 0 20px",
          display: "flex",
          justifyContent: "space-around",
          zIndex: 100,
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setSelectedUser(null);
              setTab(item.id);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              color:
                tab === item.id && !selectedUser ? "#6366f1" : "rgba(255,255,255,0.3)",
              transition: "color 0.15s",
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
