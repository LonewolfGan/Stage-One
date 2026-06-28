import { useLocation } from "wouter";
import { Service } from "@/lib/types";

interface ServiceCardProps {
  service: Service;
  providerSlug: string;
}

export function ServiceCard({ service, providerSlug }: ServiceCardProps) {
  const [, setLocation] = useLocation();

  return (
    <div
      style={{
        paddingTop: 16,
        paddingBottom: 16,
        borderBottom: "1px solid rgba(12, 12, 14, 0.08)",
      }}
      className="last:border-0"
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#0C0C0E",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {service.name}
          </h4>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-tertiary)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {service.description}
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-tertiary)", marginTop: 4 }}>
            {service.durationMinutes} min
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#0C0C0E",
            }}
          >
            {(service.priceCents / 100).toFixed(0)} MAD
          </span>
          <button
            onClick={() => setLocation(`/booking/${providerSlug}?serviceId=${service.id}`)}
            style={{
              height: 32,
              paddingLeft: 16,
              paddingRight: 16,
              background: "var(--accent)",
              color: "#FFFFFF",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 9999,
              cursor: "pointer",
              transition: "opacity 140ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
          >
            Choisir
          </button>
        </div>
      </div>
    </div>
  );
}
