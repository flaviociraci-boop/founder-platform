"use client";

import React from "react";

/**
 * Single source of truth for "+ Folgen" / "Gefolgt" buttons.
 * Used on every card and on the profile detail. Never per-user coloured —
 * the previous look had each card pull from `user.color`, which was the
 * loudest visual noise in the feed.
 *
 *  - unfollowed: subtle outline, light text, "+ Folgen"
 *  - followed:   muted grey fill, "Gefolgt"
 */
export function FollowButton({
  followed,
  onClick,
  size = "md",
  block = false,
}: {
  followed: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
  /** Full-width: use on profile detail page next to other CTAs. */
  block?: boolean;
}) {
  const padding = size === "sm" ? "6px 12px" : size === "lg" ? "11px 0" : "8px 16px";
  const fontSize = size === "sm" ? 12 : size === "lg" ? 14 : 13;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      style={{
        padding,
        width: block ? "100%" : undefined,
        borderRadius: "var(--radius-button)",
        fontSize,
        fontWeight: 600,
        cursor: "pointer",
        background: followed ? "var(--surface-3)" : "transparent",
        border: `1px solid ${followed ? "var(--border-strong)" : "var(--border)"}`,
        color: followed ? "var(--text-muted)" : "var(--foreground)",
        transition: "background 0.12s ease, border-color 0.12s ease",
        whiteSpace: "nowrap",
      }}
    >
      {followed ? "Gefolgt" : "+ Folgen"}
    </button>
  );
}
