import type { ReactNode } from "react";
import { ds } from "@/lib/design-system";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1
          className="text-[24px] font-semibold tracking-[-0.02em]"
          style={{ color: ds.colors.ink }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="text-[14px] mt-1"
            style={{ color: ds.colors.inkSecondary }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}