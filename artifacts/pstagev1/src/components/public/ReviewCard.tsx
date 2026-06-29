import { Review } from "@/lib/types";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--surface-1)",
        border: "1px solid var(--hairline)",
        borderRadius: 20,
        padding: "24px 24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "border-color 140ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hairline-strong)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hairline)";
      }}
    >
      {/* Stars */}
      <div style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.43L7 8.885l-3.09 1.615.59-3.43L2 4.635l3.455-.505L7 1z"
              fill={i <= review.rating ? "#E8A33D" : "rgba(12,12,14,0.10)"}
            />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-secondary)",
          lineHeight: 1.65,
          margin: 0,
          flex: 1,
        }}
      >
        "{review.comment}"
      </p>

      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "rgba(12,12,14,0.06)",
            color: "var(--ink-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {review.avatarInitials}
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink)",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {review.author}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-tertiary)",
              lineHeight: 1.4,
              marginTop: 1,
            }}
          >
            {review.date}
          </div>
        </div>
      </div>
    </div>
  );
}
