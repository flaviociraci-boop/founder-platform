"use client";

// Glocken-Button mit Unread-Badge. Bisher inline in DiscoverScreen.tsx
// gerendert — extrahiert für Wiederverwendung in der Desktop-Sidebar-
// Top-Bar (Schritt 1 Desktop-Layout, 22.05.2026). Auf Mobile wird die
// Komponente weiter aus DiscoverScreen heraus genutzt (gleiche Position
// wie vorher); auf Desktop sitzt sie in der AppShell-Top-Bar rechts oben.

import { Bell } from "lucide-react";

type Props = {
  unreadCount: number;
  onClick: () => void;
};

export default function NotificationBell({ unreadCount, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Mitteilungen"
      style={{
        width: 40, height: 40, borderRadius: 12,
        background: "rgba(255,255,255,0.08)", border: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", position: "relative", flexShrink: 0,
        color: "rgba(255,255,255,0.7)",
      }}
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span style={{
          position: "absolute", top: -4, right: -4,
          minWidth: 16, height: 16, borderRadius: 8,
          background: "#ef4444",
          fontSize: 9, fontWeight: 700, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 3px", boxSizing: "border-box",
        }}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
