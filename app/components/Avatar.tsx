"use client";

import { useState } from "react";

/**
 * Renders a profile avatar.
 * If `src` is a URL (uploaded photo) it shows an <img>.
 * Otherwise it renders the text initials on the colour gradient.
 * Bei Ladefehler des Bildes (z.B. expired Storage-URL) wird der
 * Gradient-Kreis ohne Inhalt gezeigt — damit nie die rohe URL als
 * Text aus dem broken <img> heraussickert.
 */
export function Avatar({
  src,
  color,
  size,
  radius,
  shadow = true,
  style,
}: {
  src: string;
  color: string;
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
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: shadow ? `0 4px 16px ${color}33` : undefined,
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
        <span style={{ fontSize: Math.round(size * 0.35), fontWeight: 700, color: "#fff" }}>
          {src}
        </span>
      ) : null}
    </div>
  );
}
