import { motion } from "framer-motion";

interface BookingBlockProps {
  booking: {
    id: string;
    clientName: string;
    service: string;
    staff: string;
    time: string;
    duration: number;
    amount: number;
    status: string;
  };
}

export function BookingBlock({ booking }: BookingBlockProps) {
  const isConfirmed = booking.status === "confirmed";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      whileHover={{ scale: 1.02, zIndex: 2 }}
      style={{
        position: "absolute",
        left: 4,
        right: 4,
        backgroundColor: isConfirmed ? "rgba(12,12,14,0.05)" : "rgba(12,12,14,0.03)",
        border: `1px solid ${isConfirmed ? "rgba(12,12,14,0.16)" : "rgba(12, 12, 14, 0.08)"}`,
        borderStyle: isConfirmed ? "solid" : "dashed",
        borderRadius: 4,
        padding: "4px 8px",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: isConfirmed ? "var(--ink)" : "var(--ink-tertiary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        {isConfirmed ? booking.service : "Bloqué"}
      </p>
      {isConfirmed && (
        <p
          style={{
            fontSize: 11,
            color: "var(--ink-tertiary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
        >
          {booking.clientName}
        </p>
      )}
    </motion.div>
  );
}
