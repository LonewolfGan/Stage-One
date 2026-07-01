interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { fontSize: 13, letterSpacing: "0.18em" },
  md: { fontSize: 16, letterSpacing: "0.18em" },
  lg: { fontSize: 22, letterSpacing: "0.18em" },
};

export function Logo({ size = "md", className }: LogoProps) {
  const s = sizes[size];
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontWeight: 700,
        fontSize: s.fontSize,
        letterSpacing: s.letterSpacing,
        textTransform: "uppercase",
        color: "var(--ink)",
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      PSTAGEV1
    </span>
  );
}
