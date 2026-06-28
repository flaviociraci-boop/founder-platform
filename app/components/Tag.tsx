import React from "react";

/**
 * Monochrome pill used for skill tags, categories, status hints.
 * One look everywhere — no per-category color coding.
 *
 * Variants:
 *  - "default": surface fill, dim grey text. The 90% case.
 *  - "outline": same fill as default but 1px hairline border. Use when
 *    sitting on a card surface that's the same shade (avoids invisible
 *    tag-on-card collision).
 *  - "solid":  slightly stronger fill + white text. Use for active filter
 *    pills only.
 */
type Variant = "default" | "outline" | "solid";
type Size = "sm" | "md";

const FILL: Record<Variant, React.CSSProperties> = {
  default: { background: "var(--surface-2)", color: "var(--text-dim)" },
  outline: { background: "var(--surface-2)", color: "var(--text-dim)", border: "1px solid var(--border)" },
  solid:   { background: "var(--surface-3)", color: "var(--foreground)", border: "1px solid var(--border-strong)" },
};

const PAD: Record<Size, React.CSSProperties> = {
  sm: { padding: "3px 8px", fontSize: 11, lineHeight: 1.4 },
  md: { padding: "5px 10px", fontSize: 12, lineHeight: 1.4 },
};

export function Tag({
  children,
  variant = "default",
  size = "sm",
  style,
}: {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-tag)",
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...FILL[variant],
        ...PAD[size],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
