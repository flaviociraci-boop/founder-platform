"use client";

import { useEffect, useMemo, useState } from "react";
import { User, seekingColors } from "@/app/lib/data";
import { Avatar } from "@/app/components/Avatar";
import { createClient } from "@/utils/supabase/client";

type Props = {
  user: User;
  onBack: () => void;
  followed: Record<number, boolean>;
  toggleFollow: (id: number) => void;
  currentUserId: number | null;
  onOpenChat: (user: User) => void;
};

export default function ProfileScreen({ user, onBack, followed, toggleFollow, currentUserId, onOpenChat }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [isMatched, setIsMatched] = useState<boolean | null>(null); // null = loading
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!currentUserId) { setIsMatched(false); return; }
    const check = async () => {
      const { data: sent } = await supabase
        .from("connections").select("id")
        .eq("user_id", currentUserId).eq("target_id", user.id)
        .maybeSingle();
      if (!sent) { setIsMatched(false); return; }
      const { data: back } = await supabase
        .from("connections").select("id")
        .eq("user_id", user.id).eq("target_id", currentUserId)
        .maybeSingle();
      setIsMatched(!!back);
    };
    check();
  }, [currentUserId, user.id, supabase]);

  const handleNachricht = () => {
    if (isMatched) {
      onOpenChat(user);
    } else {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 4000);
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div
        style={{
          background: `linear-gradient(160deg, ${user.color}22 0%, transparent 60%)`,
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 20,
            cursor: "pointer",
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          ← Zurück
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <Avatar src={user.avatar} color={user.color} size={72} radius={20}
            style={{ boxShadow: `0 8px 24px ${user.color}44` }} />

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{user.name}</h2>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{user.age} J.</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{user.role}</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              📍 {user.location}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 20,
            padding: "16px 0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {[
            { label: "Follower", value: user.followers.toLocaleString("de") },
            { label: "Following", value: user.following.toLocaleString("de") },
            { label: "Ventures", value: user.companies.length },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            onClick={() => toggleFollow(user.id)}
            style={{
              flex: 1,
              padding: "12px 0",
              background: followed[user.id]
                ? "rgba(255,255,255,0.08)"
                : `linear-gradient(135deg, ${user.color}, ${user.color}cc)`,
              border: followed[user.id] ? "1px solid rgba(255,255,255,0.12)" : "none",
              color: "#fff",
              borderRadius: 14,
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {followed[user.id] ? "✓ Gefolgt" : "Folgen"}
          </button>
          <button
            onClick={handleNachricht}
            style={{
              flex: 1,
              padding: "12px 0",
              background: isMatched
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "rgba(255,255,255,0.06)",
              border: isMatched ? "none" : "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              borderRadius: 14,
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: isMatched ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            {isMatched ? "💬 Nachricht" : "Nachricht"}
          </button>
        </div>

        {showHint && (
          <div style={{
            marginTop: 12,
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.25)",
            fontSize: 13,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.5,
          }}>
            Um mit <strong style={{ color: "#fff" }}>{user.name}</strong> zu chatten müsst ihr erst connected sein. Geh zu <strong style={{ color: "#6366f1" }}>Connect</strong> und schicke eine Anfrage.
          </div>
        )}
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <h3
          style={{
            margin: "0 0 10px",
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Über mich
        </h3>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>{user.bio}</p>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Ventures & Brands
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {user.companies.map((company, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${user.color}33, ${user.color}11)`,
                  border: `1px solid ${user.color}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: user.color,
                }}
              >
                {company.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{company.name}</span>
                  {company.active ? (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        color: "#10b981",
                        fontWeight: 600,
                      }}
                    >
                      ● AKTIV
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.3)",
                        fontWeight: 600,
                      }}
                    >
                      INAKTIV
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
                  {company.role} · {company.type}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>
                seit {company.year}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <h3
          style={{
            margin: "0 0 10px",
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Sucht gerade
        </h3>
        <span
          style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: 20,
            background: `${seekingColors[user.seeking]}22`,
            border: `1px solid ${seekingColors[user.seeking]}44`,
            color: seekingColors[user.seeking],
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          🔍 {user.seeking}
        </span>
      </div>

      <div style={{ padding: "20px" }}>
        <h3
          style={{
            margin: "0 0 10px",
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Skills & Themen
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {user.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
