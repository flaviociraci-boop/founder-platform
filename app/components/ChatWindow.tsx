"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { User } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";

type Message = {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
};

type Props = {
  partner: User;
  currentUserId: number;
  onBack: () => void;
};

export default function ChatWindow({ partner, currentUserId, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  // Load initial messages
  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${partner.id}),` +
        `and(sender_id.eq.${partner.id},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages(data ?? []));
  }, [currentUserId, partner.id, supabase]);

  // Realtime subscription
  useEffect(() => {
    const channelName = `chat:${Math.min(currentUserId, partner.id)}-${Math.max(currentUserId, partner.id)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          const inConversation =
            (msg.sender_id === currentUserId && msg.receiver_id === partner.id) ||
            (msg.sender_id === partner.id && msg.receiver_id === currentUserId);
          if (inConversation) {
            setMessages((prev) => {
              // Avoid duplicate if we optimistically added it
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, partner.id, supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    setSending(true);
    await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: partner.id,
      content,
    });
    setSending(false);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#0a0a0f",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "rgba(10,10,15,0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            width: 36, height: 36,
            color: "#fff",
            cursor: "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ←
        </button>

        <div style={{
          width: 42, height: 42,
          borderRadius: 13,
          flexShrink: 0,
          background: `linear-gradient(135deg, ${partner.color}, ${partner.color}88)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 15,
          boxShadow: `0 4px 12px ${partner.color}44`,
        }}>
          {partner.avatar}
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{partner.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{partner.role}</div>
        </div>

        <div style={{
          width: 8, height: 8,
          borderRadius: "50%",
          background: "#10b981",
          boxShadow: "0 0 6px #10b981",
          flexShrink: 0,
        }} />
      </div>

      {/* Messages */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "60px 0",
          }}>
            <div style={{
              width: 64, height: 64,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${partner.color}, ${partner.color}88)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              boxShadow: `0 8px 24px ${partner.color}33`,
            }}>
              {partner.avatar}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>
                Ihr habt ein Match! 🤝
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                Starte das Gespräch mit {partner.name}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.sender_id === currentUserId;
          const prevMsg = messages[i - 1];
          const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginTop: isFirstInGroup && i > 0 ? 8 : 0,
              }}
            >
              <div style={{
                maxWidth: "72%",
                padding: "10px 14px",
                borderRadius: isMine
                  ? "18px 18px 4px 18px"
                  : "18px 18px 18px 4px",
                background: isMine
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "rgba(255,255,255,0.07)",
                border: isMine ? "none" : "1px solid rgba(255,255,255,0.08)",
                fontSize: 14,
                lineHeight: 1.5,
                color: "#fff",
                wordBreak: "break-word",
                boxShadow: isMine ? "0 4px 12px rgba(99,102,241,0.25)" : "none",
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px 32px",
        background: "rgba(10,10,15,0.97)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        gap: 10,
        alignItems: "flex-end",
        flexShrink: 0,
      }}>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nachricht schreiben..."
          rows={1}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "12px 16px",
            color: "#fff",
            fontSize: 14,
            outline: "none",
            resize: "none",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.45,
            maxHeight: 120,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            flexShrink: 0,
            background: text.trim()
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "rgba(255,255,255,0.05)",
            border: text.trim() ? "none" : "1px solid rgba(255,255,255,0.08)",
            color: text.trim() ? "#fff" : "rgba(255,255,255,0.2)",
            cursor: text.trim() && !sending ? "pointer" : "default",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
            boxShadow: text.trim() ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
