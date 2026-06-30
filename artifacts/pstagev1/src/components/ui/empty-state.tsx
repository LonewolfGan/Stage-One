import type { LucideIcon } from "lucide-react";
import { ds } from "@/lib/design-system";
import { Button } from "@/components/ui/DSButton";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        paddingBlock:   64,
        textAlign:      "center",
        gap:            0,
      }}
    >
      <div
        style={{
          width:           40,
          height:          40,
          borderRadius:    "50%",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          marginBottom:    16,
          backgroundColor: ds.colors.canvasMuted,
        }}
      >
        <Icon size={20} style={{ color: ds.colors.inkTertiary }} />
      </div>

      <h3
        style={{
          fontSize:      15,
          fontWeight:    500,
          letterSpacing: "-0.01em",
          marginBottom:  4,
          color:         ds.colors.ink,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize:  13,
          maxWidth:  220,
          lineHeight: 1.55,
          color:     ds.colors.inkTertiary,
          margin:    "0 0 0",
        }}
      >
        {description}
      </p>

      {action && (
        <Button
          variant="primary"
          size="sm"
          onClick={action.onClick}
          style={{ marginTop: 16 }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
