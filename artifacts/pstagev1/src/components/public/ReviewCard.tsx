import { ds } from "@/lib/design-system";

interface Review {
  id:              string;
  author:          string;
  avatarInitials:  string;
  date:            string;
  rating:          number;
  comment:         string;
  providerReply?:  string | null;
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div
      style={{
        backgroundColor: ds.colors.canvas,
        border:          `1px solid ${ds.colors.border}`,
        borderRadius:    16,
        padding:         "20px 20px 18px",
        display:         "flex",
        flexDirection:   "column",
        gap:             12,
        height:          "100%",
        boxSizing:       "border-box",
        transition:      "border-color 140ms ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = ds.colors.borderStrong; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = ds.colors.border; }}
    >
      {/* Stars + date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", gap: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.43L7 8.885l-3.09 1.615.59-3.43L2 4.635l3.455-.505L7 1z"
                fill={i <= review.rating ? ds.colors.rating : ds.colors.canvasMuted}
              />
            </svg>
          ))}
        </div>
        <span style={{ fontSize: 11, color: ds.colors.inkTertiary }}>{review.date}</span>
      </div>

      {/* Comment */}
      {review.comment && (
        <p
          style={{
            fontSize:   13,
            color:      ds.colors.inkSecondary,
            lineHeight: 1.65,
            margin:     0,
            flex:       1,
          }}
        >
          "{review.comment}"
        </p>
      )}

      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width:           32,
            height:          32,
            borderRadius:    "50%",
            backgroundColor: ds.colors.canvasMuted,
            color:           ds.colors.inkSecondary,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            fontSize:        11,
            fontWeight:      600,
            flexShrink:      0,
            letterSpacing:   "-0.01em",
          }}
        >
          {review.avatarInitials}
        </div>
        <span
          style={{
            fontSize:      13,
            fontWeight:    600,
            color:         ds.colors.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {review.author}
        </span>
      </div>

      {/* Provider reply — shown only if exists */}
      {review.providerReply && (
        <div
          style={{
            marginTop:       4,
            padding:         "10px 12px",
            backgroundColor: ds.colors.canvasSubtle,
            border:          `1px solid ${ds.colors.border}`,
            borderRadius:    10,
          }}
        >
          <p
            style={{
              fontSize:      11,
              fontWeight:    600,
              color:         ds.colors.inkTertiary,
              margin:        "0 0 4px",
              letterSpacing: "0.01em",
              textTransform: "uppercase",
            }}
          >
            Réponse du salon
          </p>
          <p
            style={{
              fontSize:   12,
              color:      ds.colors.inkSecondary,
              lineHeight: 1.6,
              margin:     0,
            }}
          >
            {review.providerReply}
          </p>
        </div>
      )}
    </div>
  );
}
