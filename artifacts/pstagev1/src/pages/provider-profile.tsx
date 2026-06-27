import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { getNextAvailable, type Review } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adaptProvider } from "@/lib/provider-adapter";
import {
  Star, Heart, Share2, MapPin, Clock, CheckCircle2,
  Calendar, ChevronLeft, Scissors, ExternalLink,
} from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";

/* ─── constants ─────────────────────────────────────── */
const TOPBAR_H = 84;
const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

/* ─── mini helpers ───────────────────────────────────── */
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i} size={size}
          style={{
            fill: i <= Math.round(rating) ? "var(--rating)" : "transparent",
            color: "var(--rating)",
          }}
        />
      ))}
    </span>
  );
}

/* ─── hero gallery ───────────────────────────────────── */
function HeroGallery({ photos }: { photos: string[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "230px 230px",
      gap: 3,
      height: 463,
      overflow: "hidden",
    }}>
      {/* main large photo */}
      <div style={{ gridRow: "1 / 3", overflow: "hidden" }}>
        <img
          src={photos[0]}
          alt="Photo principale"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 500ms ease" }}
          onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
        />
      </div>
      {/* 4 thumbnails */}
      {photos.slice(1, 5).map((p, i) => (
        <div key={i} style={{ overflow: "hidden" }}>
          <img
            src={p}
            alt={`Photo ${i + 2}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 500ms ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── service row (no wrapper box) ──────────────────── */
function ServiceRow({ service, providerSlug, isLast }: { service: any; providerSlug: string; isLast: boolean }) {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, paddingBlock: 16,
        borderBottom: isLast ? "none" : "1px solid var(--hairline)",
        transition: "background-color 0.14s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em" }}>
            {service.name}
          </span>
          {service.isPopular && (
            <span style={{
              fontSize: 9, fontWeight: 600, color: "var(--accent)",
              backgroundColor: "var(--accent-tint)",
              paddingInline: 6, paddingBlock: 2, borderRadius: 4,
              letterSpacing: "0.03em", textTransform: "uppercase" as const,
            }}>
              Populaire
            </span>
          )}
        </div>
        {service.description && (
          <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 4px", lineHeight: 1.4 }}>
            {service.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} color="var(--ink-tertiary)" />
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{service.durationMinutes} min</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {(service.priceCents / 100).toFixed(0)} MAD
        </span>
        <button
          onClick={() => setLocation(`/booking/${providerSlug}?serviceId=${service.id}`)}
          style={{
            height: 32, paddingInline: 16,
            backgroundColor: hovered ? "#D4466E" : "transparent",
            color: hovered ? "#FFFFFF" : "var(--ink)",
            border: "1px solid",
            borderColor: hovered ? "#D4466E" : "var(--hairline-strong)",
            borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "var(--font)",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap" as const,
          }}
        >
          Choisir
        </button>
      </div>
    </div>
  );
}

/* ─── review item (no border box) ───────────────────── */
function ReviewItem({ review, isFirst }: { review: any; isFirst: boolean }) {
  return (
    <div style={{
      paddingBlock: 20,
      borderTop: isFirst ? "none" : "1px solid var(--hairline)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            backgroundColor: "var(--accent-tint)", color: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            {review.avatarInitials}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em" }}>
              {review.author}
            </p>
            <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0, marginTop: 1 }}>
              {review.date}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <Star size={12} color="var(--rating)" fill="var(--rating)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{review.rating}</span>
        </div>
      </div>
      <p style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.65, margin: 0 }}>
        {review.comment}
      </p>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────── */
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

  const reviews: Review[] = (rawProvider?.reviews ?? []).slice(0, 5).map((r: any) => ({
    id: r.id,
    author: "Client vérifié",
    avatarInitials: r.id.slice(0, 2).toUpperCase(),
    date: new Date(r.createdAt).toLocaleDateString("fr-MA", { day: "numeric", month: "long", year: "numeric" }),
    rating: r.rating,
    comment: r.comment ?? "",
  }));

  const [favorited, setFavorited] = useState(false);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)" }}>
        <TopBar />
        <div style={{ paddingTop: TOPBAR_H }}>
          <div style={{ height: 463, backgroundColor: "rgba(12,12,14,0.06)", animationName: "pulse" }} className="animate-pulse" />
          <div className="page-container" style={{ paddingTop: 28 }}>
            <div style={{ height: 32, width: 240, borderRadius: 8, backgroundColor: "rgba(12,12,14,0.06)" }} className="animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !provider) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--canvas)" }}>
        <div style={{ textAlign: "center" }}>
          <Scissors size={32} color="var(--ink-disabled)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: "var(--ink-secondary)", fontWeight: 500 }}>Établissement introuvable</p>
          <button
            onClick={() => setLocation("/search")}
            style={{
              marginTop: 16, height: 36, paddingInline: 18,
              backgroundColor: "rgba(12,12,14,0.04)", color: "var(--ink)",
              border: "1px solid var(--hairline)", borderRadius: 8,
              fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)",
            }}
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  const groupedServices = provider.services.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, typeof provider.services>);

  const nextSlot = getNextAvailable(provider);
  const todayDow = new Date().getDay();
  const minPrice = provider.services.length > 0 ? Math.min(...provider.services.map(s => s.priceCents)) / 100 : 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      <TopBar />

      <main style={{ flex: 1, paddingTop: TOPBAR_H }}>

        {/* ── Hero gallery ── full-width ── */}
        <HeroGallery photos={provider.photos} />

        {/* ── Content ── */}
        <div className="page-container">

          {/* ── Info strip ── */}
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: 16, paddingTop: 28, paddingBottom: 24,
            borderBottom: "1px solid var(--hairline)",
            flexWrap: "wrap",
          }}>
            <div>
              {/* Breadcrumb */}
              <button
                onClick={() => setLocation("/search")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 12, color: "var(--ink-tertiary)", background: "none",
                  border: "none", cursor: "pointer", padding: 0, marginBottom: 10,
                  fontFamily: "var(--font)",
                  transition: "color 0.14s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)"; }}
              >
                <ChevronLeft size={13} />
                Retour aux résultats
              </button>

              {/* Name + verified */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <h1 style={{
                  fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 600,
                  color: "var(--ink)", letterSpacing: "-0.02em",
                  lineHeight: 1.1, margin: 0,
                }}>
                  {provider.name}
                </h1>
                {provider.isVerified && (
                  <CheckCircle2 size={20} color="#D4466E" style={{ flexShrink: 0 }} />
                )}
              </div>

              {/* Meta row */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Stars rating={provider.rating} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                    {provider.rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>
                    ({provider.reviewCount} avis)
                  </span>
                </div>
                <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "var(--hairline-strong)", flexShrink: 0 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={12} color="var(--ink-tertiary)" />
                  <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>
                    {provider.address}, {provider.city}
                  </span>
                </div>
                <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "var(--hairline-strong)", flexShrink: 0 }} />
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "var(--ink-secondary)",
                  backgroundColor: "rgba(12,12,14,0.06)",
                  paddingInline: 8, paddingBlock: 3, borderRadius: 5,
                  letterSpacing: "0.01em",
                }}>
                  {provider.category.charAt(0).toUpperCase() + provider.category.slice(1)}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "var(--hairline-strong)", flexShrink: 0 }} />
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(provider.address + ", " + provider.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 12, color: "var(--ink-tertiary)",
                    textDecoration: "none",
                    transition: "color 0.14s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-tertiary)"; }}
                >
                  <ExternalLink size={11} />
                  Voir sur la carte
                </a>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingTop: 4 }}>
              <button
                onClick={() => setFavorited(f => !f)}
                style={{
                  width: 40, height: 40,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--hairline-strong)", borderRadius: 10,
                  background: favorited ? "var(--accent-tint)" : "transparent",
                  cursor: "pointer", transition: "background 0.14s, border-color 0.14s",
                }}
                onMouseEnter={e => { if (!favorited) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,12,14,0.04)"; }}
                onMouseLeave={e => { if (!favorited) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                <Heart
                  size={16}
                  color={favorited ? "#D4466E" : "var(--ink)"}
                  fill={favorited ? "#D4466E" : "none"}
                  style={{ transition: "all 0.14s" }}
                />
              </button>
              <button
                style={{
                  width: 40, height: 40,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--hairline-strong)", borderRadius: 10,
                  background: "transparent",
                  cursor: "pointer", transition: "background 0.14s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,12,14,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                <Share2 size={16} color="var(--ink)" />
              </button>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div style={{
            display: isLg ? "grid" : "flex",
            gridTemplateColumns: "1fr 380px",
            flexDirection: "column",
            gap: isLg ? 64 : 0,
            alignItems: "flex-start",
            paddingTop: 40,
          }}>

            {/* ────────── LEFT — main content ────────── */}
            <div style={{ minWidth: 0 }}>

              {/* Description */}
              <p style={{
                fontSize: 15, color: "var(--ink-secondary)", lineHeight: 1.7,
                marginBottom: 48, maxWidth: 640,
              }}>
                {provider.description}
              </p>

              {/* ── Services ── */}
              <div style={{ marginBottom: 56 }}>
                <h2 style={{
                  fontSize: 22, fontWeight: 600, color: "var(--ink)",
                  letterSpacing: "-0.015em", marginBottom: 28,
                }}>
                  Nos prestations
                </h2>
                {Object.entries(groupedServices).map(([category, services], catIdx) => (
                  <motion.div
                    key={category}
                    style={{ marginBottom: 32 }}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ delay: catIdx * 0.06, duration: 0.38, ease: [0, 0, 0.2, 1] }}
                  >
                    <h3 style={{
                      fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      marginBottom: 0, paddingBottom: 12,
                      borderBottom: "1px solid var(--hairline)",
                    }}>
                      {category}
                    </h3>
                    {services.map((service, i) => (
                      <ServiceRow
                        key={service.id}
                        service={service}
                        providerSlug={provider.slug}
                        isLast={i === services.length - 1}
                      />
                    ))}
                  </motion.div>
                ))}
              </div>

              {/* ── Staff ── */}
              {provider.staff.length > 0 && (
                <div style={{ marginBottom: 56 }}>
                  <h2 style={{
                    fontSize: 22, fontWeight: 600, color: "var(--ink)",
                    letterSpacing: "-0.015em", marginBottom: 6,
                  }}>
                    Notre équipe
                  </h2>
                  <p style={{ fontSize: 14, color: "var(--ink-tertiary)", marginBottom: 24 }}>
                    {provider.staff.length} professionnel{provider.staff.length > 1 ? "s" : ""} à votre service
                  </p>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {provider.staff.map(member => (
                      <motion.button
                        key={member.id}
                        onClick={() => setLocation(`/booking/${provider.slug}?staffId=${member.id}`)}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 16px",
                          backgroundColor: "var(--surface-1)",
                          border: "1px solid var(--hairline)",
                          borderRadius: 12,
                          cursor: "pointer", fontFamily: "var(--font)",
                          textAlign: "left",
                        }}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%", overflow: "hidden",
                          flexShrink: 0, backgroundColor: "rgba(12,12,14,0.06)",
                        }}>
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={member.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{
                              width: "100%", height: "100%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 14, fontWeight: 600, color: "var(--ink-secondary)",
                            }}>
                              {member.initials}
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em" }}>
                            {member.firstName}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0, marginTop: 2 }}>
                            {member.speciality}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Reviews ── */}
              <div style={{
                paddingTop: 40, borderTop: "1px solid var(--hairline)",
                marginBottom: 56,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                  <h2 style={{
                    fontSize: 22, fontWeight: 600, color: "var(--ink)",
                    letterSpacing: "-0.015em", margin: 0,
                  }}>
                    Avis clients
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Star size={18} color="var(--rating)" fill="var(--rating)" />
                    <span style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                      {provider.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-tertiary)", marginBottom: 24 }}>
                  {provider.reviewCount} avis vérifiés
                </p>
                <div>
                  {reviews.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-20px" }}
                      transition={{ delay: i * 0.05, duration: 0.32, ease: [0, 0, 0.2, 1] }}
                    >
                      <ReviewItem review={review} isFirst={i === 0} />
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>

            {/* ────────── RIGHT — sticky sidebar ────────── */}
            {isLg && (
              <div style={{
                position: "sticky",
                top: TOPBAR_H + 24,
                backgroundColor: "var(--surface-1)",
                border: "1px solid var(--hairline)",
                borderRadius: 16,
                overflow: "hidden",
              }}>
                {/* Rating header */}
                <div style={{
                  padding: "24px 24px 20px",
                  borderBottom: "1px solid var(--hairline)",
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 40, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                      {provider.rating.toFixed(1)}
                    </span>
                    <div>
                      <Stars rating={provider.rating} size={14} />
                      <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0, marginTop: 3 }}>
                        {provider.reviewCount} avis
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}>
                    À partir de <strong style={{ fontWeight: 600, color: "var(--ink)" }}>{minPrice} MAD</strong>
                  </p>
                </div>

                {/* Next slot */}
                <div style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--hairline)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: "var(--accent-tint)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Calendar size={14} color="var(--accent)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0 }}>Prochaine disponibilité</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", margin: 0, marginTop: 1 }}>
                      {nextSlot}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--hairline)" }}>
                  <button
                    onClick={() => setLocation(`/booking/${provider.slug}`)}
                    style={{
                      width: "100%", height: 46,
                      backgroundColor: "#D4466E", color: "#FFFFFF",
                      border: "none", borderRadius: 12,
                      fontSize: 15, fontWeight: 600,
                      cursor: "pointer", fontFamily: "var(--font)",
                      letterSpacing: "-0.01em",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#B8345B"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#D4466E"; }}
                  >
                    Réserver maintenant
                  </button>
                  <p style={{ fontSize: 11, color: "var(--ink-tertiary)", textAlign: "center", margin: 0, marginTop: 10 }}>
                    Réservation gratuite · Annulation facile
                  </p>
                </div>

                {/* Business hours */}
                <div style={{ padding: "20px 24px" }}>
                  <p style={{
                    fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    marginBottom: 14,
                  }}>
                    Horaires d'ouverture
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                    {provider.businessHours.map((hours, idx) => {
                      const isToday = hours.dayOfWeek === todayDow;
                      return (
                        <li
                          key={idx}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            fontSize: 12,
                            backgroundColor: isToday ? "var(--accent-tint)" : "transparent",
                            marginInline: isToday ? -8 : 0,
                            paddingInline: isToday ? 8 : 0,
                            paddingBlock: isToday ? 3 : 0,
                            borderRadius: isToday ? 6 : 0,
                          }}
                        >
                          <span style={{ color: isToday ? "var(--accent)" : "var(--ink-tertiary)", fontWeight: isToday ? 600 : 400 }}>
                            {DAY_NAMES[hours.dayOfWeek]}
                          </span>
                          <span style={{ fontWeight: isToday ? 600 : 500, color: hours.isClosed ? "var(--ink-disabled)" : isToday ? "var(--accent)" : "var(--ink)" }}>
                            {hours.isClosed ? "Fermé" : `${hours.openTime} – ${hours.closeTime}`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile floating bar */}
      {!isLg && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          backgroundColor: "rgba(251,251,250,0.96)", backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--hairline)", padding: "12px 20px",
          zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0 }}>Prochaine dispo</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", margin: 0 }}>{nextSlot}</p>
          </div>
          <button
            onClick={() => setLocation(`/booking/${provider.slug}`)}
            style={{
              height: 42, paddingInline: 28,
              backgroundColor: "#D4466E", color: "#FFFFFF",
              border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font)",
              letterSpacing: "-0.01em",
            }}
          >
            Réserver
          </button>
        </div>
      )}
    </div>
  );
}
