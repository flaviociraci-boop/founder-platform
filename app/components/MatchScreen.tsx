"use client";

import { useState, useEffect, useMemo } from "react";
import { seekingColors, User } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";

type OutgoingStatus = "pending_sent" | "accepted";
type IncomingReq = { senderId: number; user: User | null };

type Props = {
  users: User[];
  currentUserId: number | null;
  onOpenChat: (user: User) => void;
};

export default function MatchScreen({ users, currentUserId, onOpenChat }: Props) {
  const [connStates, setConnStates] = useState<Record<number, OutgoingStatus>>({});
  const [incoming, setIncoming] = useState<IncomingReq[]>([]);
  const [showMatchPopup, setShowMatchPopup] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!currentUserId) return;
    const load = async () => {
      // Outgoing connections I sent
      const { data: out } = await supabase
        .from("connections")
        .select("target_id, status")
        .eq("user_id", currentUserId);

      const states: Record<number, OutgoingStatus> = {};
      for (const row of out ?? []) {
        if (row.status === "pending") states[row.target_id] = "pending_sent";
        else if (row.status === "accepted") states[row.target_id] = "accepted";
      }

      // Incoming accepted (they sent, I accepted → show as matched in list)
      const { data: inAcc } = await supabase
        .from("connections")
        .select("user_id")
        .eq("target_id", currentUserId)
        .eq("status", "accepted");

      for (const row of inAcc ?? []) {
        states[row.user_id] = "accepted";
      }

      setConnStates(states);

      // Incoming pending requests
      const { data: inPend } = await supabase
        .from("connections")
        .select("user_id")
        .eq("target_id", currentUserId)
        .eq("status", "pending");

      setIncoming(
        (inPend ?? []).map((r) => ({
          senderId: r.user_id,
          user: users.find((u) => u.id === r.user_id) ?? null,
        }))
      );
    };
    load();
  }, [currentUserId, supabase, users]);

  // Alle vier Mutationen folgen dem gleichen Muster:
  // 1. Aktuellen State sichern, optimistic UI updaten, Error-State leeren
  // 2. DB-Call ausführen + { error } prüfen
  // 3. Bei Fehler: State zurückrollen + Inline-Message setzen + console.error
  // sendConnect nutzt upsert statt insert, damit re-pending nach einer alten
  // 'rejected'-Row (Unique-Constraint auf (user_id, target_id)) nicht still
  // an der PK-Verletzung scheitert.

  const sendConnect = async (userId: number) => {
    if (!currentUserId) return;
    const prev = connStates[userId];
    setActionError(null);
    setConnStates((p) => ({ ...p, [userId]: "pending_sent" }));

    const { error } = await supabase
      .from("connections")
      .upsert(
        { user_id: currentUserId, target_id: userId, status: "pending" },
        { onConflict: "user_id,target_id" },
      );

    if (error) {
      console.error("[connect] sendConnect failed:", error);
      setConnStates((p) => {
        const n = { ...p };
        if (prev === undefined) delete n[userId];
        else n[userId] = prev;
        return n;
      });
      setActionError(`Anfrage konnte nicht gesendet werden: ${error.message}`);
    }
  };

  const withdrawConnect = async (userId: number) => {
    if (!currentUserId) return;
    const prev = connStates[userId];
    setActionError(null);
    setConnStates((p) => { const n = { ...p }; delete n[userId]; return n; });

    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("user_id", currentUserId)
      .eq("target_id", userId);

    if (error) {
      console.error("[connect] withdrawConnect failed:", error);
      setConnStates((p) => (prev === undefined ? p : { ...p, [userId]: prev }));
      setActionError(`Zurückziehen fehlgeschlagen: ${error.message}`);
    }
  };

  const acceptRequest = async (senderId: number) => {
    if (!currentUserId) return;
    setActionError(null);
    const user = users.find((u) => u.id === senderId);

    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("user_id", senderId)
      .eq("target_id", currentUserId);

    if (error) {
      console.error("[connect] acceptRequest failed:", error);
      setActionError(`Annehmen fehlgeschlagen: ${error.message}`);
      return;
    }

    setIncoming((p) => p.filter((r) => r.senderId !== senderId));
    if (user) {
      setConnStates((p) => ({ ...p, [senderId]: "accepted" }));
      setShowMatchPopup(user);
    }
  };

  const rejectRequest = async (senderId: number) => {
    if (!currentUserId) return;
    setActionError(null);

    const { error } = await supabase
      .from("connections")
      .update({ status: "rejected" })
      .eq("user_id", senderId)
      .eq("target_id", currentUserId);

    if (error) {
      console.error("[connect] rejectRequest failed:", error);
      setActionError(`Ablehnen fehlgeschlagen: ${error.message}`);
      return;
    }

    setIncoming((p) => p.filter((r) => r.senderId !== senderId));
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
              haben sich gegenseitig angenommen — der Chat ist jetzt freigeschaltet!
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
          Sende eine Anfrage — bei Annahme öffnet sich der Chat
        </p>

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

      {actionError && (
        <div style={{ padding: "0 20px", marginBottom: 12 }}>
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
        </div>
      )}

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div style={{ padding: "0 20px", marginBottom: 8 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)",
            letterSpacing: 1.5, marginBottom: 10,
          }}>
            ANFRAGEN · {incoming.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {incoming.map((req) => req.user && (
              <div
                key={req.senderId}
                style={{
                  background: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <Avatar src={req.user.avatar} color={req.user.color} size={44} radius={13} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{req.user.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                      {req.user.role} · {req.user.location}
                    </div>
                  </div>
                </div>
                {req.user.bio && (
                  <div style={{
                    fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 10,
                  }}>
                    {req.user.bio.length > 100 ? req.user.bio.slice(0, 100) + "…" : req.user.bio}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => acceptRequest(req.senderId)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 12, border: "none",
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Annehmen
                  </button>
                  <button
                    onClick={() => rejectRequest(req.senderId)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          Drücke <strong style={{ color: "#6366f1" }}>Connect</strong> bei einem Profil. Sobald die
          andere Person deine Anfrage annimmt → Match! Erst dann wird der Chat freigeschaltet.
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
          const state = connStates[user.id];
          return (
            <div
              key={user.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: state === "accepted"
                  ? `1px solid ${user.color}44`
                  : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: 16,
                position: "relative",
                overflow: "hidden",
                transition: "border 0.3s",
              }}
            >
              {state === "accepted" && (
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
                    {state === "accepted" && (
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 20,
                        background: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        color: "#10b981", fontWeight: 700,
                      }}>
                        🤝 MATCH
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                    {user.role} · {user.location}
                  </div>
                  <div style={{
                    fontSize: 12, marginTop: 4,
                    color: seekingColors[user.seeking] ?? "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                  }}>
                    🔍 Sucht: {user.seeking}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!state) sendConnect(user.id);
                    else if (state === "pending_sent") withdrawConnect(user.id);
                  }}
                  disabled={state === "accepted"}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: state === "accepted" ? "default" : "pointer",
                    flexShrink: 0,
                    border: state === "accepted"
                      ? `1px solid ${user.color}55`
                      : state === "pending_sent"
                      ? "1px solid rgba(255,255,255,0.15)"
                      : `1px solid ${user.color}66`,
                    background: state === "accepted"
                      ? `${user.color}22`
                      : state === "pending_sent"
                      ? "rgba(255,255,255,0.05)"
                      : `${user.color}18`,
                    color: state === "accepted"
                      ? user.color
                      : state === "pending_sent"
                      ? "rgba(255,255,255,0.3)"
                      : user.color,
                    transition: "all 0.2s",
                  }}
                >
                  {state === "accepted"
                    ? "✓ Matched"
                    : state === "pending_sent"
                    ? "Anfrage gesendet"
                    : "Connect"}
                </button>
              </div>

              {state === "accepted" && (
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
