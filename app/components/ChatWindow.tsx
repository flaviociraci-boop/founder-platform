"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { User } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";

function playSwoosh() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx() as AudioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    osc.type = "sine";
    // Descending sweep 900 Hz → 220 Hz over 160 ms — the iMessage "swoosh"
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.16);
    // Soft envelope: fast attack, smooth decay
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.start(t);
    osc.stop(t + 0.16);
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext not available — fail silently
  }
}

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
  // Genau eine Message wird zu einer Zeit animiert — die zuletzt
  // hinzugefügte. Nach ~200 ms zurückgesetzt, damit ältere Messages beim
  // Scrollen oder Re-Render nicht erneut animieren.
  const [animatedMessageId, setAnimatedMessageId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  // Bei Mount + Partner-Wechsel: alle ungelesenen new_message-Notifications
  // vom aktuellen Chat-Partner als gelesen markieren (Chat ist offen, also
  // ist die Bell für genau diese Conversation redundant).
  useEffect(() => {
    void supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("type", "new_message")
      .eq("recipient_id", currentUserId)
      .eq("sender_id", partner.id)
      .eq("is_read", false);
  }, [currentUserId, partner.id, supabase]);

  // Lock document scroll while chat is open so iOS never shifts the
  // layout viewport (keeps vp.offsetTop = 0, eliminating the keyboard gap).
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, []);

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
          if (!inConversation) return;

          let appended = false;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            appended = true;
            return [...prev, msg];
          });
          if (!appended) return;

          // Animation triggern (~180 ms, danach automatisch zurückgesetzt
          // damit ältere Messages beim Scroll nicht erneut animieren).
          setAnimatedMessageId(msg.id);
          setTimeout(
            () => setAnimatedMessageId((cur) => (cur === msg.id ? null : cur)),
            220,
          );

          // Incoming-only: gleicher Send-Sound wie beim Senden + Notification
          // sofort als gelesen markieren, damit die Bell nicht aufzuckt
          // während der Chat offen ist.
          if (msg.sender_id === partner.id) {
            playSwoosh();
            void supabase
              .from("notifications")
              .update({ is_read: true })
              .eq("type", "new_message")
              .eq("recipient_id", currentUserId)
              .eq("sender_id", partner.id)
              .eq("is_read", false);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, partner.id, supabase]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scrollToBottom = () => {
    // Wait for iOS keyboard animation (~350 ms) then snap to latest message
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 350);
  };

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    playSwoosh();
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
    /*
     * height: 100% fills the overlay div which is sized to 100dvh.
     * 100dvh (dynamic viewport height) automatically shrinks when the
     * iOS keyboard opens, so this flex column squeezes — header stays
     * at the top, input stays at the bottom, messages fill the middle.
     */
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
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
        >←</button>

        <Avatar src={partner.avatar} color={partner.color} size={42} radius={13}
          style={{ boxShadow: `0 4px 12px ${partner.color}44` }} />

        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{partner.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{partner.role}</div>
        </div>

        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#10b981", boxShadow: "0 0 6px #10b981",
          flexShrink: 0,
        }} />
      </div>

      {/* Messages — flex:1 fills the remaining space between header and input */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
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
            <Avatar src={partner.avatar} color={partner.color} size={64} radius={20}
              style={{ boxShadow: `0 8px 24px ${partner.color}33` }} />
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
          const isAnimating = msg.id === animatedMessageId;
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginTop: isFirstInGroup && i > 0 ? 8 : 0,
                animation: isAnimating ? "message-in 180ms ease-out" : undefined,
              }}
            >
              <div style={{
                maxWidth: "72%",
                padding: "10px 14px",
                borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: isMine
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "rgba(255,255,255,0.07)",
                border: isMine ? "none" : "1px solid rgba(255,255,255,0.08)",
                fontSize: 14, lineHeight: 1.5, color: "#fff",
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

      {/* Input bar — flexShrink:0 keeps it at the bottom of the flex column */}
      <div style={{
        padding: "12px 16px 16px",
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
          onFocus={scrollToBottom}
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
            /* 16px prevents iOS Safari from auto-zooming on input focus */
            fontSize: 16,
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
            width: 46, height: 46,
            borderRadius: 14, flexShrink: 0,
            background: text.trim()
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "rgba(255,255,255,0.05)",
            border: text.trim() ? "none" : "1px solid rgba(255,255,255,0.08)",
            color: text.trim() ? "#fff" : "rgba(255,255,255,0.2)",
            cursor: text.trim() && !sending ? "pointer" : "default",
            fontSize: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
            boxShadow: text.trim() ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
          }}
        >↑</button>
      </div>
    </div>
  );
}
