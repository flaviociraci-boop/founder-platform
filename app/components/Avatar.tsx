"use client";

import { useState } from "react";

/**
 * Profile avatar.
 * - `src` is a URL → renders <img> with object-cover.
 * - Otherwise treats `src` as initials text on a neutral dark-gray surface.
 *
 * The `color` prop is accepted for backwards compatibility with existing
 * callsites but is intentionally NOT used to colour the placeholder —
 * per-user gradients were the biggest "AI-template" tell. All initial
 * fallbacks now share one neutral surface (--avatar-placeholder).
 */
export function Avatar({
  src,
  size,
  radius,
  shadow = false,
  style,
}: {
  src: string;
  /** Accepted for backwards compat; ignored — see component docs. */
  color?: string;
  size: number;
  radius?: number;
  shadow?: boolean;
  style?: React.CSSProperties;
}) {
  const r = radius ?? Math.round(size * 0.28);
  const isUrl = src?.startsWith("http") || src?.startsWith("blob:");
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = isUrl && !imgFailed;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "var(--avatar-placeholder)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: shadow ? "0 1px 2px rgba(0,0,0,0.4)" : undefined,
        ...style,
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Profilbild"
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : !isUrl ? (
        <span
          style={{
            fontSize: Math.round(size * 0.36),
            fontWeight: 600,
            color: "var(--avatar-placeholder-text)",
            letterSpacing: 0.2,
          }}
        >
          {src}
        </span>
      ) : null}
    </div>
  );
}
