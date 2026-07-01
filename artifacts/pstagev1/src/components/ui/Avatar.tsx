import { useState } from "react";

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  /** Adapts bg/text colors when rendered on an accent background */
  onAccent?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Avatar — shows a photo when available (with onError fallback) or initials.
 * Works for staff, owners, or any named entity.
 */
export function Avatar({ name, photoUrl, size = 36, onAccent = false, style, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    display: "block",
    ...style,
  };

  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={className}
        onError={() => setFailed(true)}
        style={{ ...base, objectFit: "cover" }}
      />
    );
  }

  const initials = getInitials(name);
  return (
    <div
      className={className}
      style={{
        ...base,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: onAccent ? "rgba(255,255,255,0.22)" : "rgba(12,12,14,0.07)",
        color: onAccent ? "#fff" : "var(--ink-tertiary)",
        fontSize: Math.max(10, Math.round(size * 0.38)),
        fontWeight: 600,
        letterSpacing: "-0.01em",
        fontFamily: "var(--font)",
        userSelect: "none",
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
