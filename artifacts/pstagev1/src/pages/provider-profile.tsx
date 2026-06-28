import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { getNextAvailable } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adaptProvider } from "@/lib/provider-adapter";
import {
  Star, Heart, MapPin, Phone,
  ChevronLeft, ChevronRight, ChevronDown,
  Navigation, ThumbsUp,
} from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";

/* ─── constants ─────────────────────────────────────── */
const TOPBAR_H = 84;
const DAY_NAMES_SHORT = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];
const MONTH_NAMES = [
  "Jan.", "Fév.", "Mar.", "Avr.", "Mai", "Juin",
  "Juil.", "Août", "Sep.", "Oct.", "Nov.", "Déc.",
];

/* ─── Stars ─────────────────────────────────────────── */
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(rating);
        const half = !filled && i <= Math.ceil(rating) && rating % 1 >= 0.4;
        return (
          <Star
            key={i} size={size}
            style={{
              fill: filled ? "var(--rating)" : half ? "var(--rating)" : "transparent",
              color: "var(--rating)",
              opacity: half ? 0.55 : 1,
            }}
          />
        );
      })}
    </span>
  );
}

/* ─── HeroGallery ───────────────────────────────────── */
function HeroGallery({ photos }: { photos: string[] }) {
  const main = photos[0];
  const thumbs = photos.slice(1, 3);
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "240px 240px",
      gap: 4,
      height: 484,
      overflow: "hidden",
    }}>
      <div style={{ gridRow: "1 / 3", overflow: "hidden", borderRadius: "0 0 0 0" }}>
        {main ? (
          <img src={main} alt="Photo principale"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 500ms ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.03)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
          />
        ) : <div style={{ width: "100%", height: "100%", background: "var(--surface-3)" }} />}
      </div>
      {[0, 1].map(i => (
        <div key={i} style={{ overflow: "hidden" }}>
          {thumbs[i] ? (
            <img src={thumbs[i]} alt={`Photo ${i + 2}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 500ms ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
            />
          ) : <div style={{ width: "100%", height: "100%", background: "var(--surface-3)" }} />}
        </div>
      ))}
    </div>
  );
}

/* ─── MiniCalendar ──────────────────────────────────── */
function MiniCalendar({ onSelect }: { onSelect?: (date: Date) => void }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<number | null>(today.getDate());

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  return (
    <div style={{ padding: "16px 20px 20px" }}>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={prevMonth} style={{
          width: 28, height: 28, border: "1px solid var(--hairline)", borderRadius: 6,
          background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ChevronLeft size={13} color="var(--ink-secondary)" />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={nextMonth} style={{
          width: 28, height: 28, border: "1px solid var(--hairline)", borderRadius: 6,
          background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ChevronRight size={13} color="var(--ink-secondary)" />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAY_NAMES_SHORT.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)", paddingBlock: 4, letterSpacing: "0.01em" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSel = day === selected;
          const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => {
                setSelected(day);
                onSelect?.(new Date(year, month, day));
              }}
              style={{
                width: "100%", aspectRatio: "1",
                borderRadius: 6, border: "none", cursor: isPast ? "default" : "pointer",
                fontSize: 12, fontWeight: isSel || isToday ? 600 : 400,
                background: isSel ? "var(--ink)" : isToday ? "rgba(12,12,14,0.08)" : "none",
                color: isSel ? "#fff" : isPast ? "var(--ink-tertiary)" : "var(--ink)",
                transition: "background 120ms ease",
                opacity: isPast ? 0.35 : 1,
                fontFamily: "var(--font)",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── ServiceRow ────────────────────────────────────── */
function ServiceRow({ service, providerSlug, isLast }: { service: any; providerSlug: string; isLast: boolean }) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid var(--hairline)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 16, paddingBlock: 16,
      }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 3px" }}>
            {service.name}
          </p>
          {service.description && (
            <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0, lineHeight: 1.45 }}>
              {service.description}
            </p>
          )}
        </div>
        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            {(service.priceCents / 100).toFixed(0)} MAD
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{service.durationMinutes} min</span>
        </div>
        {/* CTA */}
        <button
          onClick={() => setLocation(`/booking/${providerSlug}?serviceId=${service.id}`)}
          style={{
            flexShrink: 0, height: 34, paddingInline: 16,
            background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            fontFamily: "var(--font)", letterSpacing: "-0.01em",
            transition: "background 140ms ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-hover)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}
        >
          Choisir
        </button>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            flexShrink: 0, width: 28, height: 28,
            background: "none", border: "1px solid var(--hairline)",
            borderRadius: 6, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: "flex" }}
          >
            <ChevronDown size={13} color="var(--ink-tertiary)" />
          </motion.span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {service.staffIds?.length > 0 && (
                <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}>
                  Disponible avec {service.staffIds.length} professionnel{service.staffIds.length > 1 ? "s" : ""}
                </p>
              )}
              <button
                onClick={() => setLocation(`/booking/${providerSlug}?serviceId=${service.id}`)}
                style={{
                  alignSelf: "flex-start", height: 32, paddingInline: 14,
                  background: "var(--ink)", color: "#fff",
                  border: "none", borderRadius: 8,
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  fontFamily: "var(--font)",
                }}
              >
                Réserver cette prestation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── StaffCard ─────────────────────────────────────── */
function StaffCard({ member, providerSlug }: { member: any; providerSlug: string }) {
  const [, setLocation] = useLocation();
  return (
    <button
      onClick={() => setLocation(`/booking/${providerSlug}?staffId=${member.id}`)}
      style={{
        background: "#fff", border: "1px solid var(--hairline)",
        borderRadius: 14, cursor: "pointer",
        textAlign: "left", padding: 12, fontFamily: "var(--font)",
        display: "flex", flexDirection: "column", gap: 10,
        width: "100%", transition: "border-color 140ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--hairline)"; }}
    >
      {/* Square photo */}
      <div style={{
        width: "100%", aspectRatio: "1",
        borderRadius: 9, overflow: "hidden",
        background: "var(--surface-2)",
      }}>
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={member.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 400ms ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 600, color: "var(--ink-tertiary)",
            letterSpacing: "-0.02em",
          }}>
            {member.initials}
          </div>
        )}
      </div>
      {/* Name + speciality */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 3px", letterSpacing: "-0.01em" }}>
          {member.firstName}
        </p>
        <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0, lineHeight: 1.4 }}>
          {member.speciality}
        </p>
      </div>
    </button>
  );
}

/* ─── ReviewItem ────────────────────────────────────── */
function ReviewItem({ review }: { review: any }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--hairline)",
      borderRadius: 14, padding: "20px 20px 18px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "var(--surface-2)", color: "var(--ink-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, flexShrink: 0,
            letterSpacing: "-0.01em",
          }}>
            {review.avatarInitials}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em" }}>
              {review.author}
            </p>
            <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: "2px 0 0" }}>
              {review.date}
            </p>
          </div>
        </div>
        {/* Stars + score */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Stars rating={review.rating} size={12} />
          <span style={{
            fontSize: 12, fontWeight: 600, color: "#fff",
            background: "var(--rating)", borderRadius: 6,
            padding: "2px 7px", letterSpacing: "-0.01em",
          }}>
            {review.rating}
          </span>
        </div>
      </div>
      {/* Comment */}
      <p style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.7, margin: "0 0 14px" }}>
        {review.comment}
      </p>
      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ThumbsUp size={12} color="var(--ink-tertiary)" />
        <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>Avis vérifié</span>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function ProviderProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { isLg } = useBreakpoint();

  const { data: rawProvider, isLoading, isError } = useQuery({
    queryKey: ["provider", slug],
    queryFn: () => api.getProvider(slug!),
    enabled: !!slug,
    staleTime: 30_000,
  });

  const provider = rawProvider ? adaptProvider(rawProvider) : null;

  const reviews = (rawProvider?.reviews ?? []).slice(0, 5).map((r: any) => ({
    id: r.id,
    author: "Client vérifié",
    avatarInitials: r.id.slice(0, 2).toUpperCase(),
    date: new Date(r.createdAt).toLocaleDateString("fr-MA", { day: "numeric", month: "long", year: "numeric" }),
    rating: r.rating,
    comment: r.comment ?? "",
  }));

  const [favorited, setFavorited] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(true);

  /* ── loading ── */
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
        <TopBar />
        <div style={{ paddingTop: TOPBAR_H }}>
          <div style={{ height: 484, background: "rgba(12,12,14,0.06)" }} className="animate-pulse" />
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px" }}>
            <div style={{ height: 32, width: 260, borderRadius: 8, background: "rgba(12,12,14,0.06)", marginBottom: 12 }} className="animate-pulse" />
            <div style={{ height: 16, width: 180, borderRadius: 6, background: "rgba(12,12,14,0.04)" }} className="animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !provider)) {
    setLocation("/404");
    return null;
  }

  const nextSlot = getNextAvailable(provider);
  const todayDow = new Date().getDay();
  const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const categoryLabel = provider.category.charAt(0).toUpperCase() + provider.category.slice(1);

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      <TopBar />

      <main style={{ flex: 1, paddingTop: TOPBAR_H }}>

        {/* ── Hero ── */}
        <HeroGallery photos={provider.photos} />

        {/* ── Content wrapper ── */}
        <div style={{ width: "100%", padding: "0 48px" }}>

          {/* ── Breadcrumb + title ── */}
          <div style={{ paddingTop: 28, paddingBottom: 32, borderBottom: "1px solid var(--hairline)" }}>

            {/* Back link */}
            <button
              onClick={() => setLocation("/search")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 12, color: "var(--ink-tertiary)",
                background: "none", border: "none", cursor: "pointer",
                padding: 0, marginBottom: 14, fontFamily: "var(--font)",
                transition: "color 140ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-tertiary)"; }}
            >
              <ChevronLeft size={13} />
              Retour aux résultats
            </button>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                {/* City · Category */}
                <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: "0 0 6px", letterSpacing: "-0.005em" }}>
                  {provider.city} · {categoryLabel}
                </p>
                {/* Title */}
                <h1 style={{
                  fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 600,
                  color: "var(--ink)", letterSpacing: "-0.025em",
                  lineHeight: 1.1, margin: "0 0 10px",
                }}>
                  {provider.name}
                </h1>
                {/* Description */}
                <p style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.65, maxWidth: 560, margin: 0 }}>
                  {provider.description}
                </p>
              </div>
              {/* Favori */}
              <button
                onClick={() => setFavorited(f => !f)}
                style={{
                  width: 40, height: 40, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--hairline)", borderRadius: 10,
                  background: favorited ? "var(--accent-tint)" : "#fff",
                  cursor: "pointer", transition: "all 140ms",
                }}
              >
                <Heart size={16} color={favorited ? "var(--accent)" : "var(--ink)"} fill={favorited ? "var(--accent)" : "none"} />
              </button>
            </div>
          </div>

          {/* ── Two-column ── */}
          <div style={{
            display: isLg ? "grid" : "flex",
            gridTemplateColumns: "1fr 340px",
            flexDirection: "column",
            gap: isLg ? 56 : 0,
            alignItems: "flex-start",
            paddingTop: 40,
            paddingBottom: 80,
          }}>

            {/* ─────────── LEFT ─────────── */}
            <div style={{ minWidth: 0 }}>

              {/* Services */}
              <section style={{ marginBottom: 56 }}>
                <h2 style={{
                  fontSize: 20, fontWeight: 600, color: "var(--ink)",
                  letterSpacing: "-0.02em", margin: "0 0 20px",
                }}>
                  Nos prestations
                </h2>
                <div style={{ borderTop: "1px solid var(--hairline)" }}>
                  {provider.services.map((service, i) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-20px" }}
                      transition={{ delay: i * 0.04, duration: 0.3, ease: [0, 0, 0.2, 1] }}
                    >
                      <ServiceRow
                        service={service}
                        providerSlug={provider.slug}
                        isLast={i === provider.services.length - 1}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Staff */}
              {provider.staff.length > 0 && (
                <section style={{ marginBottom: 56 }}>
                  <h2 style={{
                    fontSize: 20, fontWeight: 600, color: "var(--ink)",
                    letterSpacing: "-0.02em", margin: "0 0 20px",
                  }}>
                    Notre équipe
                  </h2>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(provider.staff.length, 4)}, 1fr)`,
                    gap: 16,
                  }}>
                    {provider.staff.map((member, i) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                      >
                        <StaffCard member={member} providerSlug={provider.slug} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Reviews — collapsible */}
              <section style={{ borderTop: "1px solid var(--hairline)", paddingTop: 32, marginBottom: 56 }}>
                <button
                  onClick={() => setReviewsOpen(o => !o)}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, width: "100%",
                    background: "none", border: "none", cursor: "pointer",
                    padding: 0, marginBottom: reviewsOpen ? 20 : 0, fontFamily: "var(--font)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <h2 style={{
                      fontSize: 20, fontWeight: 600, color: "var(--ink)",
                      letterSpacing: "-0.02em", margin: 0,
                    }}>
                      Avis clients
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Stars rating={provider.rating} size={14} />
                      <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                        {provider.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <motion.span
                    animate={{ rotate: reviewsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: "flex", flexShrink: 0 }}
                  >
                    <ChevronDown size={18} color="var(--ink-tertiary)" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {reviewsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      {reviews.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {reviews.map((review) => (
                            <ReviewItem key={review.id} review={review} />
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 14, color: "var(--ink-tertiary)", paddingBlock: 20 }}>
                          Aucun avis pour le moment. Soyez le premier à laisser votre avis après votre visite.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

            </div>

            {/* ─────────── RIGHT — sticky sidebar ─────────── */}
            {isLg && (
              <div style={{
                position: "sticky",
                top: TOPBAR_H + 24,
                background: "#fff",
                border: "1px solid var(--hairline)",
                borderRadius: 14,
                overflow: "hidden",
              }}>

                {/* CTA */}
                <div style={{ padding: "20px 20px 16px" }}>
                  <button
                    onClick={() => setLocation(`/booking/${provider.slug}`)}
                    style={{
                      width: "100%", height: 44,
                      background: "var(--accent)", color: "#fff",
                      border: "none", borderRadius: 9,
                      fontSize: 14, fontWeight: 600, cursor: "pointer",
                      fontFamily: "var(--font)", letterSpacing: "-0.01em",
                      transition: "background 140ms",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-hover)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}
                  >
                    Réserver maintenant
                  </button>
                </div>

                {/* Calendar */}
                <div style={{ borderTop: "1px solid var(--hairline)" }}>
                  <MiniCalendar />
                </div>

                {/* Next slot */}
                <div style={{ borderTop: "1px solid var(--hairline)", padding: "12px 20px" }}>
                  <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: "0 0 2px" }}>
                    Prochaine disponibilité :
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em" }}>
                    {nextSlot}
                  </p>
                </div>

                {/* Address + phone */}
                <div style={{ borderTop: "1px solid var(--hairline)", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <MapPin size={13} color="var(--ink-tertiary)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: 1.5 }}>
                      {provider.address}, {provider.city}
                    </span>
                  </div>
                  {rawProvider?.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Phone size={13} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--ink-secondary)" }}>{rawProvider.phone}</span>
                    </div>
                  )}
                </div>

                {/* Y aller */}
                <div style={{ borderTop: "1px solid var(--hairline)", padding: "12px 20px" }}>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent((provider.address || "") + ", " + provider.city)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      height: 36, borderRadius: 8,
                      border: "1px solid var(--hairline)",
                      fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
                      textDecoration: "none", background: "#fff",
                      transition: "border-color 120ms",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink)"; e.currentTarget.style.color = "var(--ink)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--hairline)"; e.currentTarget.style.color = "var(--ink-secondary)"; }}
                  >
                    <Navigation size={12} />
                    Y aller sur Google Maps
                  </a>
                </div>

                {/* Rating */}
                <div style={{ borderTop: "1px solid var(--hairline)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Stars rating={provider.rating} size={13} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{provider.rating.toFixed(1)}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>({provider.reviewCount} avis)</span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile CTA */}
          {!isLg && (
            <div style={{ padding: "24px 0 40px" }}>
              <button
                onClick={() => setLocation(`/booking/${provider.slug}`)}
                style={{
                  width: "100%", height: 48,
                  background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: 10,
                  fontSize: 15, fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--font)", letterSpacing: "-0.01em",
                }}
              >
                Réserver maintenant
              </button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
