"use client";

import { useState } from "react";
import { seekingColors, User } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";

type MatchState = "sent" | "matched";

type Props = {
  users: User[];
  currentUserId: number | null;
  onOpenChat: (user: User) => void;
};

export default function MatchScreen({ users, currentUserId, onOpenChat }: Props) {
  const [matchStates, setMatchStates] = useState<Record<number, MatchState>>({});
  const [showMatchPopup, setShowMatchPopup] = useState<User | null>(null);
  const [query, setQuery] = useState("");

  const sendConnect = async (userId: number) => {
    if (!currentUserId) return;
    setMatchStates((prev) => ({ ...prev, [userId]: "sent" }));

    const supabase = createClient();
    await supabase
      .from("connections")
      .insert({ user_id: currentUserId, target_id: userId })
      .select();

    // Check for a mutual connection (the other side already sent one)
    const { data: mutual } = await supabase
      .from("connections")
      .select("*")
      .eq("user_id", userId)
      .eq("target_id", currentUserId)
      .maybeSingle();

    const isMatch = !!mutual;

    // Always show the match popup for the demo (simulates mutual interest)
    setTimeout(() => {
      setMatchStates((prev) => ({ ...prev, [userId]: "matched" }));
      setShowMatchPopup(users.find((u) => u.id === userId) ?? null);

      if (!isMatch && currentUserId) {
        supabase
          .from("connections")
          .insert({ user_id: userId, target_id: currentUserId })
          .then(() => {});
      }
    }, 900);
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      {showMatchPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#13131a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 28,
              padding: 32,
              textAlign: "center",
              maxWidth: 340,
              width: "100%",
              boxShadow: `0 0 60px ${showMatchPopup.color}33`,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>It&#39;s a Match!</h2>
            <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.5)", fontSize: 15 }}>
              Du und{" "}
              <span style={{ color: showMatchPopup.color, fontWeight: 700 }}>
                {showMatchPopup.name}
              </span>{" "}
              haben beide Interesse — der Chat ist jetzt freigeschaltet!
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowMatchPopup(null)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Später
              </button>
              <button
                onClick={() => {
                  const user = showMatchPopup;
                  setShowMatchPopup(null);
                  onOpenChat(user);
                }}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${showMatchPopup.color}, ${showMatchPopup.color}bb)`,
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                💬 Nachricht senden
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "28px 20px 16px" }}>
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
          Connect
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
          Zeige Interesse — bei Gegenseitigkeit öffnet sich der Chat
        </p>

        {/* Search bar */}
        <div style={{ position: "relative", marginTop: 16 }}>
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            fontSize: 16, pointerEvents: "none", opacity: 0.4,
          }}>🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, Skills oder Kategorie…"
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
        style={{
          margin: "0 20px 20px",
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 20 }}>💡</span>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
          Drücke <strong style={{ color: "#6366f1" }}>Connect</strong> bei einem Profil. Sobald die andere
          Person ebenfalls Connect drückt → Match! Erst dann wird der Chat freigeschaltet.
        </div>
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {users.filter((u) => {
          const q = query.trim().toLowerCase();
          return !q ||
            (u.name ?? "").toLowerCase().includes(q) ||
            (u.role ?? "").toLowerCase().includes(q) ||
            (u.location ?? "").toLowerCase().includes(q) ||
            (u.tags ?? []).some((t) => (t ?? "").toLowerCase().includes(q));
        }).map((user) => {
          const state = matchStates[user.id];
          return (
            <div
              key={user.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                border:
                  state === "matched"
                    ? `1px solid ${user.color}44`
                    : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: 16,
                position: "relative",
                overflow: "hidden",
                transition: "border 0.3s",
              }}
            >
              {state === "matched" && (
                <div
                  style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: `radial-gradient(circle at center, ${user.color}08 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }}
                />
              )}

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar src={user.avatar} color={user.color} size={52} radius={15} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</span>
                    {state === "matched" && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: "rgba(16,185,129,0.15)",
                          border: "1px solid rgba(16,185,129,0.3)",
                          color: "#10b981",
                          fontWeight: 700,
                        }}
                      >
                        🤝 MATCH
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                    {user.role} · {user.location}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 4,
                      color: seekingColors[user.seeking] ?? "rgba(255,255,255,0.4)",
                      fontWeight: 600,
                    }}
                  >
                    🔍 Sucht: {user.seeking}
                  </div>
                </div>

                <button
                  onClick={() => !state && sendConnect(user.id)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: state ? "default" : "pointer",
                    flexShrink: 0,
                    border:
                      state === "matched"
                        ? `1px solid ${user.color}55`
                        : state === "sent"
                        ? "1px solid rgba(255,255,255,0.15)"
                        : `1px solid ${user.color}66`,
                    background:
                      state === "matched"
                        ? `${user.color}22`
                        : state === "sent"
                        ? "rgba(255,255,255,0.05)"
                        : `${user.color}18`,
                    color:
                      state === "matched"
                        ? user.color
                        : state === "sent"
                        ? "rgba(255,255,255,0.3)"
                        : user.color,
                    transition: "all 0.2s",
                  }}
                >
                  {state === "matched" ? "✓ Matched" : state === "sent" ? "Gesendet..." : "Connect"}
                </button>
              </div>

              {state === "matched" && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => onOpenChat(user)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${user.color}, ${user.color}bb)`,
                      border: "none",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    💬 Chat öffnen
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Profil ansehen
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
