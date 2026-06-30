import type { ReactNode } from "react";
import { ds } from "@/lib/design-system";

interface PageHeaderProps {
  title:        string;
  description?: string;
  action?:      ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "flex-start",
        justifyContent: "space-between",
        marginBottom:   32,
        gap:            16,
      }}
    >
      <div>
        <h1
          style={{
            fontSize:      24,
            fontWeight:    600,
            letterSpacing: "-0.02em",
            lineHeight:    1.2,
            margin:        0,
            color:         ds.colors.ink,
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              fontSize:   14,
              marginTop:  4,
              marginBottom: 0,
              lineHeight: 1.5,
              color:      ds.colors.inkSecondary,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
