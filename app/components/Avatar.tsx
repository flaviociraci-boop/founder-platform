/**
 * Renders a profile avatar.
 * If `src` is a URL (uploaded photo) it shows an <img>.
 * Otherwise it renders the text initials on the colour gradient.
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
  const isPhoto = src?.startsWith("http") || src?.startsWith("blob:");

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
      {isPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Profilbild"
          style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
        />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.35), fontWeight: 700, color: "#fff" }}>
          {src}
        </span>
      )}
    </div>
  );
}
