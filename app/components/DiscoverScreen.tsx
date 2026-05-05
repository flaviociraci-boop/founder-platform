"use client";

import { categories, seekingColors, User } from "@/app/lib/data";

type Props = {
  users: User[];
  onSelectUser: (user: User) => void;
  followed: Record<number, boolean>;
  toggleFollow: (id: number) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
};

export default function DiscoverScreen({
  users,
  onSelectUser,
  followed,
  toggleFollow,
  activeCategory,
  setActiveCategory,
}: Props) {
  const filtered = activeCategory === "all" ? users : users.filter((u) => u.category === activeCategory);

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "28px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
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
              Entdecken
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
              {filtered.length} Unternehmer gefunden
            </p>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔔
          </div>
        </div>
      </div>

      <div
        className="hide-scrollbar"
        style={{ display: "flex", gap: 8, padding: "0 20px 16px", overflowX: "auto" }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              borderRadius: 20,
              whiteSpace: "nowrap",
              border:
                activeCategory === cat.id
                  ? `1px solid ${cat.color}66`
                  : "1px solid rgba(255,255,255,0.08)",
              background: activeCategory === cat.id ? `${cat.color}18` : "rgba(255,255,255,0.04)",
              color: activeCategory === cat.id ? cat.color : "rgba(255,255,255,0.5)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((user) => {
          const catColor = categories.find((c) => c.id === user.category)?.color ?? "#fff";
          return (
            <div
              key={user.id}
              onClick={() => onSelectUser(user)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: 16,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 120,
                  height: 120,
                  background: `radial-gradient(circle at top right, ${catColor}12 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${user.color}, ${user.color}88)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: `0 4px 16px ${user.color}33`,
                  }}
                >
                  {user.avatar}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                        {user.role} · {user.location}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollow(user.id);
                      }}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0,
                        border: followed[user.id]
                          ? "1px solid rgba(255,255,255,0.15)"
                          : `1px solid ${user.color}66`,
                        background: followed[user.id] ? "rgba(255,255,255,0.05)" : `${user.color}18`,
                        color: followed[user.id] ? "rgba(255,255,255,0.4)" : user.color,
                      }}
                    >
                      {followed[user.id] ? "✓" : "+ Folgen"}
                    </button>
                  </div>

                  <p
                    style={{
                      margin: "8px 0 8px",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.55)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {user.bio}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {user.companies
                      .filter((c) => c.active)
                      .slice(0, 2)
                      .map((company, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: `${user.color}12`,
                            border: `1px solid ${user.color}25`,
                          }}
                        >
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 5,
                              background: `${user.color}44`,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 800,
                              color: user.color,
                            }}
                          >
                            {company.name.charAt(0)}
                          </span>
                          <span style={{ fontSize: 11, color: user.color, fontWeight: 600 }}>
                            {company.name}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {user.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 11,
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.45)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: `${seekingColors[user.seeking]}15`,
                        color: seekingColors[user.seeking],
                        fontWeight: 600,
                      }}
                    >
                      🔍 {user.seeking}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                    {user.followers.toLocaleString("de")}
                  </span>{" "}
                  Follower
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                    {user.companies.length}
                  </span>{" "}
                  {user.companies.length === 1 ? "Venture" : "Ventures"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
