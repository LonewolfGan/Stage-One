import { useState } from "react";
import { useLocation } from "wouter";
import { Service } from "@/lib/types";
import { motion } from "framer-motion";

interface ServiceCardProps {
  service: Service;
  providerSlug: string;
}

export function ServiceCard({ service, providerSlug }: ServiceCardProps) {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-16px" }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        /* Outer shell — double-bezel */
        position: "relative",
        borderRadius: 20,
        border: "1px solid var(--hairline)",
        padding: 2,
        backgroundColor: hovered ? "rgba(212,70,110,0.03)" : "var(--surface-1)",
        boxShadow: hovered
          ? "0 8px 32px rgba(212,70,110,0.10), 0 2px 8px rgba(12,12,14,0.06)"
          : "0 2px 8px rgba(12,12,14,0.04)",
        transition: "box-shadow 340ms cubic-bezier(0.32,0.72,0,1), background-color 340ms cubic-bezier(0.32,0.72,0,1), border-color 340ms ease",
        borderColor: hovered ? "rgba(212,70,110,0.22)" : "var(--hairline)",
        cursor: "default",
      }}
    >
      {/* Inner core */}
      <div
        style={{
          borderRadius: 18,
          padding: "22px 22px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          height: "100%",
          backgroundColor: "transparent",
        }}
      >
        {/* Top row — name + duration pill */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <h4
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              margin: 0,
              flex: 1,
            }}
          >
            {service.name}
          </h4>

          {/* Duration badge */}
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "var(--ink-tertiary)",
              backgroundColor: "rgba(12,12,14,0.06)",
              borderRadius: 9999,
              padding: "4px 10px",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            {service.durationMinutes} min
          </span>
        </div>

        {/* Description */}
        {service.description && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-secondary)",
              lineHeight: 1.6,
              margin: 0,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {service.description}
          </p>
        )}

        {/* Bottom row — price + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: "auto",
            paddingTop: 14,
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {(service.priceCents / 100).toFixed(0)}{" "}
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)", letterSpacing: 0 }}>
              MAD
            </span>
          </span>

          <motion.button
            onClick={() => setLocation(`/booking/${providerSlug}?serviceId=${service.id}`)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            style={{
              height: 36,
              paddingInline: 18,
              backgroundColor: "var(--accent)",
              color: "#FFFFFF",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              borderRadius: 9999,
              cursor: "pointer",
              fontFamily: "var(--font)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Réserver
            {/* Arrow icon nested in pill */}
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 9999,
                backgroundColor: "rgba(255,255,255,0.20)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path d="M2 8L8 2M8 2H3M8 2V7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
