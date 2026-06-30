import { ds } from "@/lib/design-system";

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export function LoadingSpinner({ size = 24, color }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        width:       size,
        height:      size,
        borderRadius: "50%",
        border:      `2px solid ${ds.colors.canvasMuted}`,
        borderTopColor: color ?? ds.colors.ink,
        animation:   "spin 0.75s linear infinite",
        flexShrink:  0,
      }}
    />
  );
}

export function LoadingPage() {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        minHeight:      "40vh",
      }}
    >
      <LoadingSpinner size={28} />
    </div>
  );
}
