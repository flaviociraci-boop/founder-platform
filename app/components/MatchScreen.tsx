"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { User } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";
import { Tag } from "@/app/components/Tag";
import InfoBox from "@/app/components/InfoBox";

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

    // Realtime: bei jeder Connections-Änderung Status frisch ziehen.
    // Brauchen wir damit der Sender live sieht, wenn der Empfänger
    // accepted/rejected drückt (sonst zeigt "Anfrage gesendet" bis
    // Tab-Wechsel). Filter weg — UPDATE-Events mit DEFAULT-Replica-
    // Identity liefern sonst keine non-PK-Spalten zurück.
    const channel = supabase
      .channel("match-connections")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections" },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 28,
              textAlign: "center",
              maxWidth: 340,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <Users size={40} color="var(--brand)" strokeWidth={1.5} />
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600 }}>It&#39;s a Match!</h2>
            <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: 14 }}>
              Du und{" "}
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
                {showMatchPopup.name}
              </span>{" "}
              haben sich gegenseitig angenommen — der Chat ist jetzt freigeschaltet!
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowMatchPopup(null)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 10,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontWeight: 500,
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
                  padding: "11px 0",
                  borderRadius: 10,
                  background: "var(--brand)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Nachricht senden
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "28px 20px 16px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: -0.4,
            color: "var(--foreground)",
          }}
        >
          Connect
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
          Sende eine Anfrage — bei Annahme öffnet sich der Chat
        </p>

        <div style={{ position: "relative", marginTop: 16 }}>
          <Search
            size={16}
            strokeWidth={2}
            style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-dim)", pointerEvents: "none",
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
            fontSize: 11, fontWeight: 600, color: "var(--text-dim)",
            letterSpacing: 1.4, marginBottom: 10,
          }}>
            ANFRAGEN · {incoming.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {incoming.map((req) => req.user && (
              <div
                key={req.senderId}
                style={{
                  background: "var(--brand-soft)",
                  border: "1px solid var(--brand)",
                  borderRadius: "var(--radius-card)",
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <Avatar src={req.user.avatar} color={req.user.color} size={40} radius={10} shadow={false} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{req.user.name}</div>
                    {(() => {
                      const sub = [req.user.role, req.user.location].filter(Boolean).join(" · ");
                      return sub ? (
                        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 1 }}>{sub}</div>
                      ) : null;
                    })()}
                  </div>
                </div>
                {req.user.bio && (
                  <div style={{
                    fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10,
                  }}>
                    {req.user.bio.length > 100 ? req.user.bio.slice(0, 100) + "…" : req.user.bio}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => acceptRequest(req.senderId)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: "var(--radius-button)", border: "none",
                      background: "var(--brand)",
                      color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Annehmen
                  </button>
                  <button
                    onClick={() => rejectRequest(req.senderId)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: "var(--radius-button)",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)", fontWeight: 500, fontSize: 13, cursor: "pointer",
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

      <InfoBox>
        Drücke <strong style={{ color: "var(--brand)" }}>Connect</strong> bei einem Profil. Sobald die
        andere Person deine Anfrage annimmt → Match! Erst dann wird der Chat freigeschaltet.
      </InfoBox>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {users.filter((u) => {
          const q = query.trim().toLowerCase();
          return !q ||
            (u.name ?? "").toLowerCase().includes(q) ||
            (u.role ?? "").toLowerCase().includes(q) ||
            (u.location ?? "").toLowerCase().includes(q) ||
            (u.tags ?? []).some((t) => (t ?? "").toLowerCase().includes(q));
        }).map((user) => {
          const state = connStates[user.id];
          const subtitle = [user.role, user.location].filter(Boolean).join(" · ");
          return (
            <div
              key={user.id}
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
                padding: 14,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar src={user.avatar} color={user.color} size={44} radius={10} shadow={false} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--foreground)" }}>{user.name}</div>
                  {subtitle && (
                    <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>
                      {subtitle}
                    </div>
                  )}
                  {user.seeking && (
                    <div style={{ marginTop: 6 }}>
                      <Tag>Sucht: {user.seeking}</Tag>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (!state) sendConnect(user.id);
                    else if (state === "pending_sent") withdrawConnect(user.id);
                  }}
                  disabled={state === "accepted"}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-button)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: state === "accepted" ? "default" : "pointer",
                    flexShrink: 0,
                    border: state === "accepted"
                      ? "1px solid var(--border-strong)"
                      : state === "pending_sent"
                      ? "1px solid var(--border)"
                      : "1px solid var(--brand)",
                    background: state === "accepted"
                      ? "var(--surface-3)"
                      : state === "pending_sent"
                      ? "transparent"
                      : "var(--brand-soft)",
                    color: state === "accepted"
                      ? "var(--text-muted)"
                      : state === "pending_sent"
                      ? "var(--text-dim)"
                      : "var(--foreground)",
                    transition: "all 0.15s",
                  }}
                >
                  {state === "accepted"
                    ? "Matched"
                    : state === "pending_sent"
                    ? "Anfrage gesendet"
                    : "Connect"}
                </button>
              </div>

              {state === "accepted" && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => onOpenChat(user)}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: "var(--radius-button)",
                      background: "var(--brand)",
                      border: "none",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Chat öffnen
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: "var(--radius-button)",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      fontWeight: 500,
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
