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
        backgroundColor: isConfirmed ? "#FBEEF1" : "rgba(12,12,14,0.06)",
        borderLeft: `2px solid ${isConfirmed ? "#D4466E" : "rgba(12,12,14,0.30)"}`,
        border: `1px solid ${isConfirmed ? "rgba(212, 70, 110, 0.18)" : "rgba(12, 12, 14, 0.08)"}`,
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
          color: isConfirmed ? "#D4466E" : "#8C8A82",
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
            color: "#8C8A82",
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
