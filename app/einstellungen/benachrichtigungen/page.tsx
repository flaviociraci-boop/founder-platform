"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Toggle = { key: string; label: string; desc: string };

const TOGGLES: Toggle[] = [
  { key: "matches", label: "Match-Benachrichtigungen", desc: "Wenn jemand zurück-connected" },
  { key: "messages", label: "Neue Nachrichten", desc: "Chat-Nachrichten per Push & E-Mail" },
  { key: "applications", label: "Projekt-Bewerbungen", desc: "Bewerbungen auf deine Projekte" },
  { key: "updates", label: "Plattform-Updates", desc: "Neue Features und Ankündigungen" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    matches: true,
    messages: true,
    applications: false,
    updates: false,
  });

  const flip = (key: string) => setToggles((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#0a0a0f", minHeight: "100vh", color: "#fff" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
        background: "rgba(10,10,15,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.back()} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, width: 36, height: 36, color: "#fff", cursor: "pointer",
          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
        }}>←</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Benachrichtigungen</span>
      </div>

      <div style={{ padding: "24px 20px" }}>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {TOGGLES.map((item, i) => (
            <div
              key={item.key}
              style={{
                display: "flex", alignItems: "center", gap: 16, padding: "18px 16px",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", marginTop: 3 }}>{item.desc}</div>
              </div>
              <button
                onClick={() => flip(item.key)}
                style={{
                  width: 50, height: 30, borderRadius: 15, flexShrink: 0,
                  background: toggles[item.key] ? "#6366f1" : "rgba(255,255,255,0.12)",
                  border: "none", cursor: "pointer", position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 3,
                  left: toggles[item.key] ? 23 : 3,
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                }} />
              </button>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
          Einstellungen werden lokal gespeichert. Push-Benachrichtigungen erfordern die Browser-Berechtigung.
        </p>
      </div>
    </div>
  );
}
