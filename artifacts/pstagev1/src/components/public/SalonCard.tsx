import { useLocation } from "wouter";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Provider, generateSlots, getNextAvailable } from "@/lib/types";
import { ds } from "@/lib/design-system";

interface SalonCardProps {
  provider: Provider;
  featured?: boolean;
}

export function SalonCard({ provider, featured = false }: SalonCardProps) {
  const [, setLocation] = useLocation();
  const nextAvailableText = getNextAvailable(provider);
  const slots = generateSlots(new Date(), provider).filter((s) => s.available).slice(0, 3);
  const priceIndicator = Array(provider.priceLevel).fill("€").join("");

  return (
    <motion.div
      className="group"
      style={{
        background: ds.colors.canvas,
        border: `1px solid ${ds.colors.border}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      whileHover={{ scale: 1.012, borderColor: "rgba(12,12,14,0.16)" }}
      whileTap={{ scale: 0.988 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onClick={() => setLocation(`/${provider.slug}`)}
    >
      {/* Image */}
      <div
        style={{
          position: "relative",
          aspectRatio: featured ? "16/9" : "3/4",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <motion.img
          src={provider.photos[0]}
          alt={provider.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
        />
        {provider.isPopular && (
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              height: 22,
              padding: "0 8px",
              backgroundColor: ds.colors.canvas,
              color: ds.colors.ink,
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 9999,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Populaire
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: ds.colors.ink,
                letterSpacing: "-0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {provider.name}
            </h3>
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
              {provider.address}
            </p>
          </div>
          <span style={{ fontSize: 13, color: "var(--ink-tertiary)", marginLeft: 8, flexShrink: 0 }}>
            {priceIndicator}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <Star size={13} color={ds.colors.rating} fill={ds.colors.rating} />
          <span style={{ fontSize: 13, fontWeight: 500, color: ds.colors.ink }}>
            {provider.rating.toFixed(1)}
          </span>
          <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>
            · {provider.reviewCount} avis
          </span>
        </div>

        <hr style={{ border: "none", borderTop: `1px solid ${ds.colors.border}`, margin: "12px 0" }} />

        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 8 }}>
          {nextAvailableText}
        </p>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
          {slots.map((slot, idx) => (
            <motion.button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/booking/${provider.slug}`);
              }}
              style={{
                height: 32,
                padding: "0 12px",
                border: `1px solid ${ds.colors.border}`,
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 500,
                color: ds.colors.ink,
                background: "transparent",
                cursor: "pointer",
              }}
              whileHover={{ backgroundColor: "rgba(12,12,14,0.04)", borderColor: "rgba(12,12,14,0.20)" }}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.15 }}
            >
              {slot.time}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
