"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { User } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";

type ChatPreview = User & {
  lastMessage: string | null;
  lastMessageAt: string | null;
};

type Props = {
  currentUserId: number | null;
  onOpenChat: (user: User) => void;
};

export default function ChatsScreen({ currentUserId, onOpenChat }: Props) {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }

    const load = async () => {
      // All accepted connections in either direction
      const { data: accepted } = await supabase
        .from("connections")
        .select("user_id, target_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${currentUserId},target_id.eq.${currentUserId}`);

      const matchIds = (accepted ?? []).map((c) =>
        c.user_id === currentUserId ? c.target_id : c.user_id
      );
      if (matchIds.length === 0) { setLoading(false); return; }

      // Step 3: Profiles of matched users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, role, location, avatar, color, age, category, followers, following, tags, bio, seeking")
        .in("id", matchIds);

      // Step 4: Last message per conversation
      const { data: msgs } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(200);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: ChatPreview[] = (profiles ?? []).map((p: any) => {
        const lastMsg = (msgs ?? []).find(
          (m) =>
            (m.sender_id === currentUserId && m.receiver_id === p.id) ||
            (m.sender_id === p.id && m.receiver_id === currentUserId)
        );
        return {
          id: p.id,
          name: p.name,
          age: p.age ?? 0,
          category: p.category ?? "",
          role: p.role ?? "",
          location: p.location ?? "",
          followers: p.followers ?? 0,
          following: p.following ?? 0,
          tags: p.tags ?? [],
          bio: p.bio ?? "",
          seeking: p.seeking ?? "",
          avatar: p.avatar,
          color: p.color,
          companies: [],
          lastMessage: lastMsg?.content ?? null,
          lastMessageAt: lastMsg?.created_at ?? null,
        };
      });

      result.sort((a, b) => {
        if (a.lastMessageAt && b.lastMessageAt)
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        if (a.lastMessageAt) return -1;
        if (b.lastMessageAt) return 1;
        return 0;
      });

      setChats(result);
      setLoading(false);
    };

    load();
  }, [currentUserId, supabase]);

  // Realtime: refresh last-message previews when a new message arrives
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel("chats-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as { sender_id: number; receiver_id: number; content: string; created_at: string };
          const partnerId =
            msg.sender_id === currentUserId ? msg.receiver_id : msg.receiver_id === currentUserId ? msg.sender_id : null;
          if (!partnerId) return;
          setChats((prev) =>
            prev
              .map((c) =>
                c.id === partnerId
                  ? { ...c, lastMessage: msg.content, lastMessageAt: msg.created_at }
                  : c
              )
              .sort((a, b) => {
                if (a.lastMessageAt && b.lastMessageAt)
                  return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
                if (a.lastMessageAt) return -1;
                if (b.lastMessageAt) return 1;
                return 0;
              })
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, supabase]);

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "28px 20px 16px" }}>
        <h1 style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: -0.4,
          color: "var(--foreground)",
        }}>
          Chats
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
          {loading ? "Lade…" : `${chats.length} ${chats.length === 1 ? "Match" : "Matches"}`}
        </p>

        {/* Search bar */}
        {!loading && chats.length > 0 && (
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
              placeholder="Chats durchsuchen…"
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
        )}
      </div>

      {!loading && chats.length === 0 && (
        <div style={{ padding: "48px 32px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Users size={40} color="var(--text-dim)" strokeWidth={1.5} />
          </div>
          <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 15 }}>Noch keine Matches</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Geh zu <strong style={{ color: "var(--brand)" }}>Connect</strong> und schicke Anfragen — sobald jemand zurückschickt, öffnet sich der Chat.
          </p>
        </div>
      )}

      {!loading && chats.length > 0 && (
        <div style={{ padding: "0 20px" }}>
          {chats.filter((c) =>
            !query.trim() || (c.name ?? "").toLowerCase().includes(query.trim().toLowerCase())
          ).map((chat) => (
            <button
              key={chat.id}
              onClick={() => onOpenChat(chat)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                background: "none",
                border: "none",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <Avatar src={chat.avatar} color={chat.color} size={44} radius={10} shadow={false} />

              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 2,
                }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--foreground)" }}>
                    {chat.name}
                  </span>
                  {chat.lastMessageAt && (
                    <span style={{ fontSize: 11, color: "var(--text-faint)", flexShrink: 0, marginLeft: 8 }}>
                      {shortTime(chat.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 13,
                  color: chat.lastMessage ? "var(--text-dim)" : "var(--text-faint)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {chat.lastMessage ?? "Starte das Gespräch…"}
                </div>
              </div>

              <span style={{ fontSize: 16, color: "var(--text-faint)", flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function shortTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "jetzt";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
