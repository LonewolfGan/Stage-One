import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type DashboardReview } from "@/lib/api";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Star, MessageSquare, AlertCircle, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/DSButton";

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={rating >= s ? "#E8A33D" : "none"}
          stroke={rating >= s ? "#E8A33D" : "var(--hairline-strong)"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function RatingSummary({ reviews }: { reviews: DashboardReview[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div
      className="ds-card"
      style={{ display: "flex", gap: 32, alignItems: "center", marginBottom: 32, flexWrap: "wrap" }}
    >
      <div style={{ textAlign: "center", minWidth: 80 }}>
        <p style={{ fontSize: 40, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>
          {avg.toFixed(1)}
        </p>
        <div style={{ marginTop: 8 }}>
          <StarDisplay rating={Math.round(avg)} size={16} />
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-tertiary)", marginTop: 6 }}>
          {reviews.length} avis
        </p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}>
        {dist.map(({ star, count }) => {
          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
          return (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--ink-tertiary)", width: 12, textAlign: "right" }}>{star}</span>
              <Star size={11} fill="#E8A33D" stroke="#E8A33D" />
              <div style={{ flex: 1, height: 6, backgroundColor: "var(--surface-3)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    backgroundColor: "#E8A33D",
                    borderRadius: 3,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: "var(--ink-tertiary)", width: 20 }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewRow({ review }: { review: DashboardReview }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.reply ?? "");
  const [replyError, setReplyError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: (text: string) => api.replyToReview(review.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "reviews"] });
      setReplyOpen(false);
      setReplyError(null);
    },
    onError: (err: any) => {
      setReplyError(err?.data?.message ?? err?.message ?? "Erreur lors de l'envoi");
    },
  });

  return (
    <div
      className="ds-card"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%",
              backgroundColor: "var(--surface-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 600, color: "var(--ink-secondary)", flexShrink: 0,
            }}
          >
            {review.clientName ? review.clientName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              {review.clientName ?? "Client anonyme"}
            </p>
            <p style={{ fontSize: 12, color: "var(--ink-tertiary)", marginTop: 1 }}>
              {format(new Date(review.createdAt), "d MMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
        <StarDisplay rating={review.rating} />
      </div>

      {/* Comment */}
      {review.comment && (
        <p style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.6, margin: 0 }}>
          {review.comment}
        </p>
      )}
      {!review.comment && (
        <p style={{ fontSize: 13, color: "var(--ink-tertiary)", fontStyle: "italic" }}>Aucun commentaire.</p>
      )}

      {/* Existing reply */}
      {review.reply && !replyOpen && (
        <div
          style={{
            padding: "12px 14px", backgroundColor: "var(--surface-2)",
            borderRadius: "var(--radius-control)", borderLeft: "2px solid var(--accent)",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", marginBottom: 4 }}>
            Votre réponse
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.55, margin: 0 }}>
            {review.reply}
          </p>
        </div>
      )}

      {/* Reply toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => {
            setReplyOpen((v) => !v);
            if (!replyOpen) setReplyText(review.reply ?? "");
          }}
          style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500,
            color: "var(--ink-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          <MessageSquare size={13} />
          {review.reply ? "Modifier la réponse" : "Répondre"}
          {replyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Reply form */}
      {replyOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Répondez publiquement à cet avis…"
            maxLength={1000}
            rows={3}
            style={{
              width: "100%", padding: "10px 12px", fontSize: 14, lineHeight: 1.55,
              border: "1px solid var(--hairline)", borderRadius: "var(--radius-control)",
              backgroundColor: "var(--canvas-pure)", color: "var(--ink)",
              resize: "vertical", outline: "none", fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          {replyError && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", backgroundColor: "#FEF2F2", borderRadius: "var(--radius-control)" }}>
              <AlertCircle size={13} style={{ color: "#DC2626", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#DC2626" }}>{replyError}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={() => setReplyOpen(false)}
              style={{ fontSize: 13, color: "var(--ink-tertiary)", background: "none", border: "none", cursor: "pointer", padding: "8px 12px" }}
            >
              Annuler
            </button>
            <Button
              variant="primary"
              size="sm"
              disabled={!replyText.trim() || replyMutation.isPending}
              onClick={() => replyMutation.mutate(replyText.trim())}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Send size={13} />
              {replyMutation.isPending ? "Envoi…" : "Publier la réponse"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ["dashboard", "reviews"],
    queryFn: () => api.getDashboardReviews(),
    staleTime: 60_000,
  });

  const pending = reviews.filter((r) => !r.reply);
  const replied = reviews.filter((r) => r.reply);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--canvas)" }}>
      <DashboardSidebar />

      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px 96px" }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em", marginBottom: 6 }}>
              Avis clients
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>
              Répondez aux avis pour renforcer la confiance de vos futurs clients.
            </p>
          </div>

          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
              <div style={{ width: 32, height: 32, border: "2px solid var(--hairline)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}

          {isError && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", backgroundColor: "#FEF2F2", borderRadius: "var(--radius-control)", color: "#DC2626", fontSize: 14 }}>
              <AlertCircle size={16} /> Impossible de charger les avis.
            </div>
          )}

          {!isLoading && !isError && reviews.length === 0 && (
            <div className="ds-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <Star size={32} style={{ color: "var(--ink-tertiary)", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>Aucun avis pour l'instant</h3>
              <p style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>Les avis apparaîtront ici une fois que vos clients auront noté leurs réservations.</p>
            </div>
          )}

          {reviews.length > 0 && (
            <>
              <RatingSummary reviews={reviews} />

              {pending.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                    En attente de réponse ({pending.length})
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {pending.map((r) => <ReviewRow key={r.id} review={r} />)}
                  </div>
                </div>
              )}

              {replied.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                    Répondu ({replied.length})
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {replied.map((r) => <ReviewRow key={r.id} review={r} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
