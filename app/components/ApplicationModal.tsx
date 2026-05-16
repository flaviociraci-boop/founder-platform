"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Project } from "@/app/lib/data";

const MAX_LEN = 500;

type Props = {
  project: Project;
  applicantUserId: number;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ApplicationModal({ project, applicantUserId, onClose, onSuccess }: Props) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    const { error: insertErr } = await supabase
      .from("applications")
      .insert({
        project_id: project.id,
        user_id: applicantUserId,
        message: message.trim() || null,
      });

    if (insertErr) {
      console.error("[application] insert failed:", insertErr);
      setError(insertErr.message);
      setSubmitting(false);
      return;
    }

    // Applicant-Counter erhöhen — fail-non-fatal, der eigentliche Insert ist
    // schon durch.
    await supabase.rpc("increment_applicants", { project_id: project.id });

    onSuccess();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#13131a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 24,
          maxWidth: 440,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: `0 20px 60px ${project.color ?? "#6366f1"}22`,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
              color: project.color ?? "#6366f1", marginBottom: 4,
            }}>
              BEWERBUNG
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>
              {project.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer", fontSize: 16, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <p style={{
          margin: "0 0 12px", fontSize: 13,
          color: "rgba(255,255,255,0.55)", lineHeight: 1.5,
        }}>
          Erzähl kurz, warum du gut zum Projekt passt. Der Projekt-Ersteller bekommt deine
          Nachricht direkt in seine Notifications.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LEN))}
          placeholder="Hey, ich bin … und würde gerne …"
          rows={6}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "12px 14px",
            color: "#fff", fontSize: 14, outline: "none",
            resize: "vertical", minHeight: 110, maxHeight: 240,
            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        />
        <div style={{
          marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.35)",
          textAlign: "right",
        }}>
          {message.length}/{MAX_LEN}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12, padding: "10px 14px",
              color: "#fca5a5", fontSize: 13, lineHeight: 1.4,
            }}
          >
            Bewerbung konnte nicht gesendet werden: {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          style={{
            width: "100%", marginTop: 16, padding: "14px 0",
            borderRadius: 14, border: "none",
            background: submitting
              ? "rgba(255,255,255,0.06)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", fontWeight: 700, fontSize: 15,
            cursor: submitting ? "default" : "pointer",
            boxShadow: submitting ? "none" : "0 4px 16px rgba(99,102,241,0.3)",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Sende…" : "Bewerbung senden"}
        </button>
      </div>
    </div>
  );
}
