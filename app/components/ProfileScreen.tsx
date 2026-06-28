"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { User } from "@/app/lib/data";
import { Avatar } from "@/app/components/Avatar";
import { Tag } from "@/app/components/Tag";
import { FollowButton } from "@/app/components/FollowButton";
import { createClient } from "@/utils/supabase/client";

type ConnStatus = "none" | "pending_sent" | "pending_received" | "accepted";

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
  const [connStatus, setConnStatus] = useState<ConnStatus>("none");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) { setConnStatus("none"); return; }
    const check = async () => {
      // Check outgoing (I sent to them)
      const { data: out } = await supabase
        .from("connections")
        .select("status")
        .eq("user_id", currentUserId)
        .eq("target_id", user.id)
        .maybeSingle();

      if (out) {
        if (out.status === "accepted") { setConnStatus("accepted"); return; }
        if (out.status === "pending") { setConnStatus("pending_sent"); return; }
        // rejected by them → fall through to check incoming
      }

      // Check incoming (they sent to me)
      const { data: inc } = await supabase
        .from("connections")
        .select("status")
        .eq("user_id", user.id)
        .eq("target_id", currentUserId)
        .maybeSingle();

      if (inc) {
        if (inc.status === "accepted") { setConnStatus("accepted"); return; }
        if (inc.status === "pending") { setConnStatus("pending_received"); return; }
      }

      setConnStatus("none");
    };
    check();
  }, [currentUserId, user.id, supabase]);

  // Vier Mutationen, gleiches Muster wie MatchScreen: optimistic UI,
  // bei DB-Fehler State zurückrollen + Inline-Message. sendConnect nutzt
  // upsert statt delete-then-insert — atomisch, kein Race.

  const sendConnect = async () => {
    if (!currentUserId) return;
    const prev = connStatus;
    setActionError(null);
    setConnStatus("pending_sent");

    const { error } = await supabase
      .from("connections")
      .upsert(
        { user_id: currentUserId, target_id: user.id, status: "pending" },
        { onConflict: "user_id,target_id" },
      );

    if (error) {
      console.error("[connect] sendConnect failed:", error);
      setConnStatus(prev);
      setActionError(`Anfrage konnte nicht gesendet werden: ${error.message}`);
    }
  };

  const withdrawConnect = async () => {
    if (!currentUserId) return;
    const prev = connStatus;
    setActionError(null);
    setConnStatus("none");

    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("user_id", currentUserId)
      .eq("target_id", user.id);

    if (error) {
      console.error("[connect] withdrawConnect failed:", error);
      setConnStatus(prev);
      setActionError(`Zurückziehen fehlgeschlagen: ${error.message}`);
    }
  };

  const acceptRequest = async () => {
    if (!currentUserId) return;
    const prev = connStatus;
    setActionError(null);
    setConnStatus("accepted");

    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("user_id", user.id)
      .eq("target_id", currentUserId);

    if (error) {
      console.error("[connect] acceptRequest failed:", error);
      setConnStatus(prev);
      setActionError(`Annehmen fehlgeschlagen: ${error.message}`);
    }
  };

  const rejectRequest = async () => {
    if (!currentUserId) return;
    const prev = connStatus;
    setActionError(null);
    setConnStatus("none");

    const { error } = await supabase
      .from("connections")
      .update({ status: "rejected" })
      .eq("user_id", user.id)
      .eq("target_id", currentUserId);

    if (error) {
      console.error("[connect] rejectRequest failed:", error);
      setConnStatus(prev);
      setActionError(`Ablehnen fehlgeschlagen: ${error.message}`);
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            padding: "7px 14px",
            borderRadius: "var(--radius-button)",
            cursor: "pointer",
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          ← Zurück
        </button>

        {actionError && (
          <div
            role="alert"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12,
              padding: "10px 14px",
              color: "#fca5a5",
              fontSize: 13,
              lineHeight: 1.4,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <span style={{ flex: 1 }}>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              aria-label="Fehler schließen"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(252,165,165,0.6)",
                cursor: "pointer",
                fontSize: 16,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <Avatar src={user.avatar} color={user.color} size={64} radius={14} shadow={false} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{user.name}</h2>
              {user.age ? (
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{user.age} J.</span>
              ) : null}
            </div>
            {user.role && (
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" }}>{user.role}</p>
            )}
            {user.location && (
              <p style={{
                margin: "2px 0 0", fontSize: 13, color: "var(--text-dim)",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <MapPin size={13} color="var(--text-dim)" strokeWidth={2} />
                {user.location}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 20,
            padding: "14px 0",
            borderTop: "1px solid var(--border)",
          }}
        >
          {[
            { label: "Follower", value: user.followers.toLocaleString("de") },
            { label: "Following", value: user.following.toLocaleString("de") },
            { label: "Firmen", value: user.companies.length },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {user.id !== currentUserId && (
            <div style={{ flex: 1, display: "flex" }}>
              <FollowButton
                followed={!!followed[user.id]}
                onClick={() => toggleFollow(user.id)}
                size="lg"
                block
              />
            </div>
          )}

          {connStatus === "pending_received" ? (
            <div style={{ flex: 1, display: "flex", gap: 8 }}>
              <button
                onClick={acceptRequest}
                style={{
                  flex: 1, padding: "11px 0",
                  background: "var(--brand)",
                  border: "none", color: "#fff", borderRadius: "var(--radius-button)",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                Annehmen
              </button>
              <button
                onClick={rejectRequest}
                style={{
                  flex: 1, padding: "11px 0",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)", borderRadius: "var(--radius-button)",
                  fontWeight: 500, fontSize: 13, cursor: "pointer",
                }}
              >
                Ablehnen
              </button>
            </div>
          ) : connStatus === "accepted" ? (
            <button
              onClick={() => onOpenChat(user)}
              style={{
                flex: 1, padding: "11px 0",
                background: "var(--brand)",
                border: "none", color: "#fff", borderRadius: "var(--radius-button)",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              Chat öffnen
            </button>
          ) : connStatus === "pending_sent" ? (
            <button
              onClick={withdrawConnect}
              style={{
                flex: 1, padding: "11px 0",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-dim)", borderRadius: "var(--radius-button)",
                fontWeight: 500, fontSize: 13, cursor: "pointer",
              }}
            >
              Anfrage gesendet
            </button>
          ) : (
            <button
              onClick={sendConnect}
              style={{
                flex: 1, padding: "11px 0",
                background: "var(--brand-soft)",
                border: "1px solid var(--brand)",
                color: "var(--foreground)", borderRadius: "var(--radius-button)",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              Connecten
            </button>
          )}
        </div>
      </div>

      {user.bio && (
        <div style={{ padding: "20px 20px 0" }}>
          <h3
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontWeight: 600,
            }}
          >
            Über mich
          </h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>{user.bio}</p>
        </div>
      )}

      {user.companies.length > 0 && (
        <div style={{ padding: "20px 20px 0" }}>
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: 11,
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontWeight: 600,
            }}
          >
            Firmen & Brands
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {user.companies.map((company, i) => {
              const sub = [company.role, company.type].filter(Boolean).join(" · ");
              return (
                <div
                  key={i}
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-card)",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: "var(--avatar-placeholder)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--avatar-placeholder-text)",
                    }}
                  >
                    {company.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{company.name}</span>
                      {company.active && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: "var(--radius-tag)",
                            background: "var(--brand-soft)",
                            color: "var(--foreground)",
                            fontWeight: 600,
                            letterSpacing: 0.4,
                          }}
                        >
                          AKTIV
                        </span>
                      )}
                    </div>
                    {sub && (
                      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>
                        {sub}
                      </div>
                    )}
                  </div>
                  {company.year && (
                    <div style={{ fontSize: 12, color: "var(--text-faint)", flexShrink: 0 }}>
                      seit {company.year}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {user.seeking && (
        <div style={{ padding: "20px 20px 0" }}>
          <h3
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontWeight: 600,
            }}
          >
            Sucht gerade
          </h3>
          <Tag size="md">{user.seeking}</Tag>
        </div>
      )}

      {user.tags.length > 0 && (
        <div style={{ padding: "20px" }}>
          <h3
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontWeight: 600,
            }}
          >
            Skills & Themen
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {user.tags.map((tag) => (
              <Tag key={tag} size="md">{tag}</Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
