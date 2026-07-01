import { LucideIcon } from "lucide-react";
import { ds } from "@/lib/design-system";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: ds.colors.canvasMuted }}
      >
        <Icon className="w-5 h-5" style={{ color: ds.colors.inkTertiary }} />
      </div>

      <h3
        className="text-[15px] font-medium tracking-[-0.01em] mb-1"
        style={{ color: ds.colors.ink }}
      >
        {title}
      </h3>

      <p
        className="text-[13px] max-w-[220px] sm:max-w-[260px]"
        style={{ color: ds.colors.inkTertiary }}
      >
        {description}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}