import { ds } from "@/lib/design-system";

interface SectionTitleProps {
  children: React.ReactNode;
  description?: string;
  count?: number;
}

export function SectionTitle({ children, description, count }: SectionTitleProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2
          style={{
            fontSize:      14,
            fontWeight:    600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            margin:        0,
            color:         ds.colors.inkTertiary,
          }}
        >
          {children}
        </h2>
        {count !== undefined && (
          <span
            style={{
              fontSize:   11,
              fontWeight: 500,
              color:      ds.colors.inkDisabled,
            }}
          >
            · {count}
          </span>
        )}
      </div>
      {description && (
        <p
          style={{
            fontSize:  12,
            color:     ds.colors.inkTertiary,
            margin:    "4px 0 0",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
