"use client";

import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { categories, User } from "@/app/lib/data";
import { Avatar } from "@/app/components/Avatar";
import { Tag } from "@/app/components/Tag";
import { FollowButton } from "@/app/components/FollowButton";

type Props = {
  users: User[];
  onSelectUser: (user: User) => void;
  followed: Record<number, boolean>;
  toggleFollow: (id: number) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  // currentUserId = eigene profiles.id (number) bzw. null wenn nicht
  // geladen. Wird benötigt um den Folgen-Button auf der eigenen Karte
  // gar nicht erst zu rendern (Self-Follow-Block).
  currentUserId: number | null;
};

export default function DiscoverScreen({
  users,
  onSelectUser,
  followed,
  toggleFollow,
  activeCategory,
  setActiveCategory,
  unreadCount,
  onOpenNotifications,
  currentUserId,
}: Props) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = users
    .filter((u) => activeCategory === "all" || u.category === activeCategory)
    .filter((u) =>
      !q ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.role ?? "").toLowerCase().includes(q) ||
      (u.location ?? "").toLowerCase().includes(q) ||
      (u.tags ?? []).some((t) => (t ?? "").toLowerCase().includes(q))
    );

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
              Entdecken
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
              {filtered.length} Unternehmer gefunden
            </p>
          </div>
          <button
            onClick={onOpenNotifications}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              flexShrink: 0,
              color: "var(--text-muted)",
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                minWidth: 16, height: 16, borderRadius: 8,
                background: "var(--brand)",
                fontSize: 9, fontWeight: 700, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px", boxSizing: "border-box",
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div style={{ position: "relative", marginTop: 16 }}>
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
            placeholder="Name, Skills oder Kategorie…"
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
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
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

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((user) => {
          const subtitle = [user.role, user.location].filter(Boolean).join(" · ");
          const activeCompanies = user.companies.filter((c) => c.active).slice(0, 2);
          const hasStats = user.followers > 0 || user.companies.length > 0;
          return (
            <div
              key={user.id}
              onClick={() => onSelectUser(user)}
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
                padding: 14,
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Avatar src={user.avatar} color={user.color} size={44} radius={10} shadow={false} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--foreground)" }}>{user.name}</div>
                      {subtitle && (
                        <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>
                          {subtitle}
                        </div>
                      )}
                    </div>
                    {user.id !== currentUserId && (
                      <FollowButton
                        followed={!!followed[user.id]}
                        onClick={() => toggleFollow(user.id)}
                        size="sm"
                      />
                    )}
                  </div>

                  {user.bio && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 13,
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {user.bio}
                    </p>
                  )}

                  {(activeCompanies.length > 0 || user.tags.length > 0 || user.seeking) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {activeCompanies.map((company, i) => (
                        <Tag key={`c-${i}`}>{company.name}</Tag>
                      ))}
                      {user.tags.slice(0, 2).map((tag) => (
                        <Tag key={`t-${tag}`}>{tag}</Tag>
                      ))}
                      {user.seeking && <Tag>{user.seeking}</Tag>}
                    </div>
                  )}
                </div>
              </div>

              {hasStats && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    gap: 16,
                  }}
                >
                  {user.followers > 0 && (
                    <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                        {user.followers.toLocaleString("de")}
                      </span>{" "}
                      Follower
                    </span>
                  )}
                  {user.companies.length > 0 && (
                    <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                        {user.companies.length}
                      </span>{" "}
                      {user.companies.length === 1 ? "Firma" : "Firmen"}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
