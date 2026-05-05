"use client";

import { useState } from "react";
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

// Demo: use profile 1 as the logged-in user until auth is added.
const DEMO_USER_ID = 1;

type Props = {
  initialUsers: User[];
  initialProjects: Project[];
};

export default function AppShell({ initialUsers, initialProjects }: Props) {
  const [tab, setTab] = useState<Tab>("discover");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [followed, setFollowed] = useState<Record<number, boolean>>({});
  const [activeCategory, setActiveCategory] = useState("all");

  const toggleFollow = async (id: number) => {
    const isFollowed = !!followed[id];
    setFollowed((prev) => ({ ...prev, [id]: !isFollowed }));

    const supabase = createClient();
    if (isFollowed) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", DEMO_USER_ID)
        .eq("following_id", id);
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: DEMO_USER_ID, following_id: id });
    }
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
          <MatchScreen users={initialUsers} />
        ) : tab === "projects" ? (
          <ProjectBoard initialProjects={initialProjects} />
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>◉</div>
            <div>Eigenes Profil — kommt bald</div>
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
