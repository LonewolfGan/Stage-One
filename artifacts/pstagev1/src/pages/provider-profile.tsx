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
  Navigation, Share2,
} from "lucide-react";
import { ReviewCard } from "@/components/public/ReviewCard";
import { useBreakpoint } from "@/hooks/use-mobile";
import { ds } from "@/lib/design-system";

/* ─── constants ─────────────────────────────────────── */
const SIDEBAR_TOP = 24;
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
function HeroGallery({ photos, providerName }: { photos: string[]; providerName?: string }) {
  const main = photos[0];
  const thumbs = photos.slice(1, 3);
  const totalPhotos = photos.length;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "62% 38%",
      gridTemplateRows: "1fr 1fr",
      gap: 6,
      height: "clamp(460px, 58vh, 600px)",
      position: "relative",
      borderRadius: 16,
      overflow: "hidden",
    }}>
      {/* Main large photo */}
      <div style={{
        gridRow: "1 / 3",
        overflow: "hidden",
        position: "relative",
        borderRadius: 14,
      }}>
        {main ? (
          <img src={main} alt={providerName ?? "Photo principale"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 600ms cubic-bezier(0.25,0.46,0.45,0.94)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.03)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
          />
        ) : <div style={{ width: "100%", height: "100%", background: "var(--surface-3)", borderRadius: 14 }} />}
      </div>

      {/* 2 thumbnails */}
      {[0, 1].map(i => (
        <div key={i} style={{
          overflow: "hidden",
          position: "relative",
          borderRadius: 14,
        }}>
          {thumbs[i] ? (
            <img src={thumbs[i]} alt={`Photo ${i + 2}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 600ms cubic-bezier(0.25,0.46,0.45,0.94)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
            />
          ) : <div style={{ width: "100%", height: "100%", background: "var(--surface-3)" }} />}
        </div>
      ))}

      {/* "Voir toutes les photos" pill — bottom-right */}
      {totalPhotos > 0 && (
        <div style={{
          position: "absolute", bottom: 14, right: 14,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(10,10,15,0.10)",
          borderRadius: 9,
          padding: "7px 13px",
          fontSize: 12, fontWeight: 500, color: "var(--ink)",
          cursor: "pointer",
          letterSpacing: "-0.01em",
          display: "flex", alignItems: "center", gap: 6,
          userSelect: "none",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          Voir les {totalPhotos} photos
        </div>
      )}
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
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16, paddingBlock: 16,
      borderBottom: isLast ? "none" : "1px solid var(--hairline)",
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
        {service.staffIds?.length > 0 && (
          <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: "4px 0 0" }}>
            {service.staffIds.length} professionnel{service.staffIds.length > 1 ? "s" : ""} disponible{service.staffIds.length > 1 ? "s" : ""}
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
        background: ds.colors.canvas, border: `1px solid ${ds.colors.border}`,
        borderRadius: ds.radius.lg, cursor: "pointer",
        textAlign: "left", padding: 12, fontFamily: "var(--font)",
        display: "flex", flexDirection: "column", gap: 10,
        width: "100%", height: "100%", transition: "border-color 140ms ease",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = ds.colors.borderMedium; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = ds.colors.border; }}
    >
      {/* Square photo */}
      <div style={{
        width: "100%", aspectRatio: "1",
        borderRadius: ds.radius.md, overflow: "hidden",
        background: ds.colors.canvasMuted,
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
            fontSize: 22, fontWeight: 600, color: ds.colors.inkTertiary,
            letterSpacing: "-0.02em",
          }}>
            {member.initials}
          </div>
        )}
      </div>
      {/* Name + speciality */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: ds.colors.ink, margin: "0 0 3px", letterSpacing: "-0.01em" }}>
          {member.firstName}
        </p>
        <p style={{ fontSize: 11, color: ds.colors.inkTertiary, margin: 0, lineHeight: 1.4 }}>
          {member.speciality}
        </p>
      </div>
    </button>
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
    providerReply: r.reply ?? null,
  }));

  const [favorited, setFavorited] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: provider?.name ?? "", url }).catch(() => {
        navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
      });
    } else {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  };

  /* ── loading ── */
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
        <TopBar />
        <div style={{ height: "clamp(380px, 48vh, 520px)", background: "rgba(12,12,14,0.06)" }} className="animate-pulse" />
        <div style={{ padding: "32px 48px" }}>
          <div style={{ height: 32, width: 260, borderRadius: 8, background: "rgba(12,12,14,0.06)", marginBottom: 12 }} className="animate-pulse" />
          <div style={{ height: 16, width: 180, borderRadius: 6, background: "rgba(12,12,14,0.04)" }} className="animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !provider) {
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

      <main style={{ flex: 1 }}>

        {/* ── Hero ── */}
        <div style={{ padding: "20px 48px 0" }}>
          <HeroGallery photos={provider.photos} providerName={provider.name} />
        </div>

        {/* ── Content wrapper ── */}
        <div style={{ padding: "0 48px" }}>

          {/* ── Breadcrumb + title ── */}
          <div style={{ paddingTop: 28, paddingBottom: 32, borderBottom: "1px solid var(--hairline)" }}>

            {/* Back button */}
            <button
              onClick={() => setLocation("/search")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, color: "var(--ink)",
                background: "transparent", border: "1px solid rgba(10,10,15,0.18)", cursor: "pointer",
                padding: "7px 13px", marginBottom: 20, fontFamily: "var(--font)",
                borderRadius: 8, fontWeight: 500, letterSpacing: "-0.01em",
                transition: "border-color 140ms, color 140ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(10,10,15,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(10,10,15,0.18)"; }}
            >
              <ChevronLeft size={14} />
              Retour aux résultats
            </button>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
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
            <div style={{ minWidth: 0, maxWidth: 900 }}>

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
                        style={{ height: "100%" }}
                      >
                        <StaffCard member={member} providerSlug={provider.slug} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Business Hours */}
              {provider.businessHours && provider.businessHours.length > 0 && (
                <section style={{ marginBottom: 56 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em", margin: "0 0 20px" }}>
                    Horaires d'ouverture
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--hairline)", borderRadius: 12, overflow: "hidden" }}>
                    {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((dayName, dow) => {
                      const hours = provider.businessHours.find((h) => h.dayOfWeek === dow);
                      const isToday = dow === todayDow;
                      return (
                        <div
                          key={dow}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "11px 18px",
                            backgroundColor: isToday ? "rgba(12,12,14,0.025)" : "transparent",
                            borderBottom: dow < 6 ? "1px solid var(--hairline)" : "none",
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: isToday ? 600 : 400, color: isToday ? "var(--ink)" : "var(--ink-secondary)", minWidth: 90 }}>
                            {dayName}
                          </span>
                          {hours?.isClosed ? (
                            <span style={{ fontSize: 12, color: "var(--ink-tertiary)", fontStyle: "italic" }}>Fermé</span>
                          ) : hours ? (
                            <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: isToday ? 600 : 400, letterSpacing: "-0.01em" }}>
                              {hours.openTime} – {hours.closeTime}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--ink-tertiary)", fontStyle: "italic" }}>Non renseigné</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Reviews */}
              <section style={{ borderTop: "1px solid var(--hairline)", paddingTop: 32, marginBottom: 56 }}>
                {/* Titre toujours visible */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
                      Avis clients
                    </h2>
                    {provider.reviewCount > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Stars rating={provider.rating} size={14} />
                        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                          {provider.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {reviews.length > 0 && (
                    <button
                      onClick={() => setReviewsOpen(o => !o)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: 4, display: "flex", alignItems: "center",
                      }}
                    >
                      <motion.span animate={{ rotate: reviewsOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}>
                        <ChevronDown size={18} color="var(--ink-tertiary)" />
                      </motion.span>
                    </button>
                  )}
                </div>

                {reviews.length > 0 ? (
                  <AnimatePresence initial={false}>
                    {reviewsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: 16,
                          alignItems: "stretch",
                        }}>
                          {reviews.map((review, i) => (
                            <motion.div
                              key={review.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05, duration: 0.28, ease: [0, 0, 0.2, 1] }}
                              style={{ height: "100%" }}
                            >
                              <ReviewCard review={review} />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  /* ── Empty state ── */
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 8 }}>
                    <img
                      src="/empty-reviews.svg"
                      alt="Pas encore d'avis"
                      style={{ width: 200, height: 200, objectFit: "contain", marginBottom: 12 }}
                    />
                    <p style={{ fontSize: 14, color: "var(--ink-tertiary)", margin: 0, maxWidth: 320, lineHeight: 1.6 }}>
                      Pas encore d'avis pour cet établissement. Réservez et soyez le premier à partager votre expérience !
                    </p>
                  </div>
                )}
              </section>

            </div>

            {/* ─────────── RIGHT — sticky sidebar ─────────── */}
            {isLg && (
              <div style={{
                position: "sticky",
                top: SIDEBAR_TOP,
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

                {/* Y aller + Partager */}
                <div style={{ borderTop: "1px solid var(--hairline)", padding: "12px 20px", display: "flex", gap: 8 }}>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent((provider.address || "") + ", " + provider.city)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      height: 34, borderRadius: 8,
                      border: "1px solid var(--hairline)",
                      fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
                      textDecoration: "none", background: "#fff",
                      transition: "border-color 120ms, color 120ms",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink)"; e.currentTarget.style.color = "var(--ink)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--hairline)"; e.currentTarget.style.color = "var(--ink-secondary)"; }}
                  >
                    <Navigation size={11} />
                    Y aller
                  </a>
                  <button
                    onClick={handleShare}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      height: 34, borderRadius: 8,
                      border: `1px solid ${copied ? "var(--ink)" : "var(--hairline)"}`,
                      background: copied ? "var(--ink)" : "#fff",
                      fontSize: 12, fontWeight: 500,
                      color: copied ? "#fff" : "var(--ink-secondary)",
                      cursor: "pointer", fontFamily: "var(--font)",
                      transition: "all 140ms",
                    }}
                    onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = "var(--ink)"; e.currentTarget.style.color = "var(--ink)"; } }}
                    onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = "var(--hairline)"; e.currentTarget.style.color = "var(--ink-secondary)"; } }}
                  >
                    <Share2 size={11} />
                    {copied ? "Lien copié !" : "Partager"}
                  </button>
                </div>

                {/* Rating — only if reviews exist */}
                {provider.reviewCount > 0 && (
                  <div style={{ borderTop: "1px solid var(--hairline)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Stars rating={provider.rating} size={13} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{provider.rating.toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>({provider.reviewCount} avis)</span>
                  </div>
                )}
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
