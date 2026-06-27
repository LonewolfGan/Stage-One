import { Review } from "@/lib/types";
import { Star } from "lucide-react";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(12, 12, 14, 0.08)",
        borderRadius: 12,
        padding: 20,
        transition: "border-color 140ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(12, 12, 14, 0.16)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(12, 12, 14, 0.08)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "#FBEEF1",
            color: "#D4466E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {review.avatarInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#0C0C0E",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {review.author}
          </h4>
          <p style={{ fontSize: 12, color: "#8C8A82", marginTop: 1, letterSpacing: "0.01em" }}>
            {review.date}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(12,12,14,0.06)",
            padding: "4px 8px",
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          <Star size={12} color="#E8A33D" fill="#E8A33D" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#0C0C0E" }}>
            {review.rating}
          </span>
        </div>
      </div>
      <p style={{ fontSize: 14, color: "#54534D", lineHeight: 1.6, margin: 0 }}>
        {review.comment}
      </p>
    </div>
  );
}
