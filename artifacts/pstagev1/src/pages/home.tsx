import { useRef, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/public/HeroSection";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adaptProviderList } from "@/lib/provider-adapter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Logo } from "@/components/ui/Logo";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";


const COLLAGE_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200&auto=format&fit=crop",
    label: "Coiffure",
    style: { left: "5%", top: "5%", width: 440, height: 320 },
  },
  {
    img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200&auto=format&fit=crop",
    label: "Barbier",
    style: { right: "6%", top: "8%", width: 360, height: 420 },
  },
  {
    img: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=1200&auto=format&fit=crop",
    label: "Manucure",
    style: { left: "2%", top: "52%", width: 380, height: 280 },
  },
  {
    img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop",
    label: "Bien-être",
    style: { right: "5%", top: "58%", width: 420, height: 300 },
  },
  {
    img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop",
    label: "Institut beauté",
    style: { left: "30%", top: "74%", width: 360, height: 260 },
  },
];

const BEAUTY_CASES = [
  {
    title: "Coiffure & Couleur",
    desc: "Coupes, balayages et soins capillaires.",
    img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Barbiers & Rasage",
    desc: "Barbe sculptée, rasage au rasoir et soins homme.",
    img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Ongles & Manucure",
    desc: "Nail art, gel et semi-permanent. Sans attendre.",
    img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Bien-être & Massages",
    desc: "Massages, soins du corps et rituels hammam.",
    img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop",
  },
];

type TestimonialData = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
};

function TestimonialCard({ quote, name, role, avatar, rating }: TestimonialData) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: 340,
        backgroundColor: "var(--surface-1)",
        border: "1px solid var(--hairline)",
        borderRadius: 20,
        padding: "28px 28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Stars */}
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: rating }).map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.43L7 8.885l-3.09 1.615.59-3.43L2 4.635l3.455-.505L7 1z" fill="#E8A33D" />
          </svg>
        ))}
      </div>
      {/* Quote */}
      <p
        style={{
          fontSize: 15,
          color: "var(--ink-secondary)",
          lineHeight: 1.65,
          margin: 0,
          flex: 1,
        }}
      >
        "{quote}"
      </p>
      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {avatar && (
          <img
            src={avatar}
            alt={name}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            style={{ width: 38, height: 38, borderRadius: 9999, objectFit: "cover", flexShrink: 0 }}
          />
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-tertiary)", lineHeight: 1.4 }}>{role}</div>
        </div>
      </div>
    </div>
  );
}

const TESTIMONIALS: TestimonialData[] = [
  {
    quote: "Je remplis mon agenda sans passer des heures au téléphone. Mes clientes réservent seules, même à minuit.",
    name: "Nadia Oumrhar",
    role: "Salon Nadia · Casablanca",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    quote: "En deux semaines, j'ai eu 40% de réservations en plus. Le widget est simple et mes clients adorent.",
    name: "Youssef Benhadi",
    role: "Barber Atlas · Marrakech",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    quote: "Fini les no-shows ! Les rappels automatiques ont réduit mes annulations de moitié.",
    name: "Salma Idrissi",
    role: "Institut Élégance · Rabat",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    quote: "Le dashboard est clair, je vois mes revenus en temps réel. C'est exactement ce dont j'avais besoin.",
    name: "Karim Bensouda",
    role: "Salon K · Agadir",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    quote: "J'ai supprimé mon agenda papier dès la première semaine. Mes collaboratrices gèrent elles-mêmes leurs créneaux.",
    name: "Fatima Zahra Mellouk",
    role: "Beauté Zahra · Fès",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
];

const TESTIMONIALS_2: TestimonialData[] = [
  {
    quote: "Mes clientes voient mes disponibilités en direct. Plus d'appels manqués, plus de confusion.",
    name: "Hind Cherkaoui",
    role: "Studio Hind · Tanger",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    quote: "La configuration prend 10 minutes. Le support répond en moins d'une heure. Parfait.",
    name: "Omar Rahhali",
    role: "Barbershop Omar · Oujda",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    quote: "Je travaille à domicile et la plateforme me donne une image professionnelle. Mes clients font confiance.",
    name: "Sara Lamrani",
    role: "Sara à domicile · Rabat",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    quote: "Les statistiques m'ont aidé à comprendre quelles prestations marchent le mieux. J'ai recentré mon offre.",
    name: "Leila Nasri",
    role: "Nail Studio L · Casablanca",
    avatar: "https://images.unsplash.com/photo-1523264653568-d3d4032d1476?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
  {
    quote: "Avant je perdais des clients faute de réponse rapide. Maintenant ils réservent en ligne et je suis libérée.",
    name: "Amina Tazi",
    role: "Institut Amina · Meknès",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop",
    rating: 5,
  },
];

const STEPS = [
  {
    step: "01",
    title: "Disponibilités en temps réel",
    desc: "Consultez les créneaux libres et réservez instantanément, 24h/24 et 7j/7. Plus besoin d'appeler.",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1400&auto=format&fit=crop",
  },
  {
    step: "02",
    title: "Profils vérifiés",
    desc: "Chaque salon est contrôlé : photos, avis clients et certifications à jour.",
    img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1400&auto=format&fit=crop",
  },
  {
    step: "03",
    title: "Zéro frais de réservation",
    desc: "La réservation est entièrement gratuite pour les clients. Toujours. Sans surprise.",
    img: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=1400&auto=format&fit=crop",
  },
];

function StickyStepsSection({ isMobile }: { isMobile: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (isMobile) return;
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const step = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
      setActiveStep(step);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  if (isMobile) {
    return (
      <section style={{ paddingBlock: 72, backgroundColor: "var(--canvas)", borderTop: "1px solid var(--hairline)" }}>
        <div className="page-container">
          <h2 style={{ fontSize: "clamp(26px, 6vw, 36px)", fontWeight: 600, letterSpacing: "-0.025em", color: "var(--ink)", marginBottom: 48, lineHeight: 1.2 }}>
            La plateforme de réservation pour votre beauté
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {STEPS.map(({ step, title, desc, img }) => (
              <div key={step} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "4/3" }}>
                  <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{step}</span>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", margin: "8px 0 10px", letterSpacing: "-0.015em" }}>{title}</h3>
                  <p style={{ fontSize: 15, color: "var(--ink-secondary)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      style={{
        height: `${STEPS.length * 100}vh`,
        backgroundColor: "var(--canvas)",
        borderTop: "1px solid var(--hairline)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          overflow: "hidden",
        }}
      >
        {/* Left — sticky image panel */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          {STEPS.map(({ img, title }, i) => (
            <img
              key={i}
              src={img}
              alt={title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: activeStep === i ? 1 : 0,
                transition: "opacity 700ms cubic-bezier(0.4,0,0.2,1)",
                willChange: "opacity",
              }}
            />
          ))}
          {/* Subtle overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.08) 0%, transparent 60%)", pointerEvents: "none", zIndex: 1 }} />
        </div>

        {/* Right — steps panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px 80px 80px 72px",
            gap: 0,
          }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 2.5vw, 38px)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              color: "var(--ink)",
              marginBottom: 56,
            }}
          >
            La plateforme de réservation<br />pour votre beauté
          </h2>

          {/* Progress rail */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Rail line */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, backgroundColor: "var(--hairline)" }} />
            {/* Active indicator */}
            <div
              style={{
                position: "absolute",
                left: 0,
                width: 2,
                backgroundColor: "var(--accent)",
                top: `${(activeStep / STEPS.length) * 100}%`,
                height: `${(1 / STEPS.length) * 100}%`,
                transition: "top 500ms cubic-bezier(0.4,0,0.2,1)",
              }}
            />

            {STEPS.map(({ step, title, desc }, i) => {
              const isActive = activeStep === i;
              return (
                <div
                  key={step}
                  style={{
                    paddingLeft: 28,
                    paddingBlock: 28,
                    opacity: isActive ? 1 : 0.35,
                    transition: "opacity 500ms ease",
                    cursor: "default",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 500,
                      color: isActive ? "var(--ink)" : "var(--ink-tertiary)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                      transition: "color 400ms ease",
                    }}
                  >
                    {step}
                  </span>
                  <h3
                    style={{
                      fontSize: "clamp(18px, 1.6vw, 22px)",
                      fontWeight: 600,
                      color: "var(--ink)",
                      letterSpacing: "-0.015em",
                      lineHeight: 1.25,
                      marginBottom: 12,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      color: "var(--ink-secondary)",
                      lineHeight: 1.65,
                      margin: 0,
                      maxWidth: 380,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const { data: rawProviders } = useQuery({
    queryKey: ["providers", "featured"],
    queryFn: () => api.searchProviders(),
    staleTime: 60_000,
  });
  const featuredProviders = adaptProviderList(rawProviders ?? []).slice(0, 3);

  const { data: featuredReviews = [] } = useQuery<any[]>({
    queryKey: ["reviews", "featured"],
    queryFn: () => api.get("/reviews/featured?limit=10"),
    staleTime: 300_000,
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)" }}>
      <TopBar />
      <HeroSection />


      {/* ─────────────────────────────────────────
          SECTION 2 — Floating collage "Sans Attendre."
      ───────────────────────────────────────── */}
      <section
        style={{
          minHeight: isMobile ? "auto" : 1200,
          width: "100%",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "var(--canvas)",
          paddingBlock: isMobile ? 80 : 120,
        }}
      >
        {/* Large background text */}
        <div
          style={{
            position: isMobile ? "relative" : "absolute",
            inset: isMobile ? undefined : 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(64px, 13vw, 180px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 0.9,
              color: "var(--ink)",
              textAlign: "center",
            }}
          >
            Sans<br />Attendre
          </h2>
        </div>

        {/* Floating glass cards — desktop only */}
        {!isMobile && COLLAGE_CARDS.map(({ img, label, style }, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              borderRadius: 28,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.45)",
              zIndex: 5,
              ...style,
            }}
          >
            <img
              src={img}
              alt={label}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 14,
                left: 14,
                backgroundColor: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.70)",
                borderRadius: 9999,
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "var(--ink)" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink)" }}>
                {label}
              </span>
            </div>
          </div>
        ))}

      </section>

      {/* ─────────────────────────────────────────
          SECTION 3 — Manifeste
      ───────────────────────────────────────── */}
      <section
        style={{
          paddingBlock: isMobile ? 80 : 160,
          backgroundColor: "var(--canvas)",
          borderTop: "1px solid var(--hairline)",
          overflow: "hidden",
        }}
      >
        <div
          className="page-container"
          style={{ position: "relative" }}
        >
          {/* Decorative oversized quotation mark */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: isMobile ? -20 : -48,
              left: isMobile ? -8 : -16,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: isMobile ? 160 : 280,
              lineHeight: 1,
              color: "var(--ink)",
              opacity: 0.07,
              pointerEvents: "none",
              userSelect: "none",
              fontWeight: 700,
            }}
          >
            "
          </span>

          {/* Quote body */}
          <blockquote
            style={{
              margin: 0,
              padding: 0,
              position: "relative",
              zIndex: 1,
            }}
          >
            <p
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: isMobile ? "clamp(28px, 7vw, 40px)" : "clamp(40px, 4.5vw, 72px)",
                fontWeight: 400,
                fontStyle: "italic",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: "var(--ink)",
                maxWidth: isMobile ? "100%" : "85%",
                margin: 0,
                marginBottom: isMobile ? 32 : 48,
              }}
            >
              La beauté ne devrait jamais être{" "}
              <span
                style={{
                  fontStyle: "normal",
                  fontWeight: 700,
                  color: "var(--ink)",
                  letterSpacing: "-0.03em",
                }}
              >
                une question de timing.
              </span>
              {" "}Tous les créneaux disponibles, visibles en direct, partout au Maroc.
            </p>

            {/* Attribution line */}
            <footer
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 1,
                  backgroundColor: "var(--hairline-strong)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--ink-tertiary)",
                }}
              >
                ANUBIS
              </span>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          SECTION 4 — Sticky scroll storytelling
      ───────────────────────────────────────── */}
      <StickyStepsSection isMobile={isMobile} />

      {/* ─────────────────────────────────────────
          SECTION 5 — Pour tous les profils (2×2 grid)
      ───────────────────────────────────────── */}
      <section
        style={{
          paddingBlock: isMobile ? 72 : 120,
          backgroundColor: "var(--canvas)",
          borderTop: "1px solid var(--hairline)",
        }}
      >
        <div className="page-container">
          <Reveal>
            <h2
              style={{
                fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
                textAlign: "center",
                marginBottom: 48,
              }}
            >
              Pour tous les profils beauté
            </h2>
          </Reveal>

          <Stagger className="home-cases-grid">
            {BEAUTY_CASES.map(({ title, desc, img }) => (
              <StaggerItem key={title}>
                <motion.div
                  className="group"
                  onClick={() => setLocation("/search")}
                  style={{
                    position: "relative",
                    height: 380,
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: "pointer",
                    border: "1px solid var(--hairline)",
                  }}
                  whileHover={{ scale: 1.018 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                >
                  <motion.img
                    src={img}
                    alt={title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.55, ease: [0.0, 0.0, 0.2, 1] }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(12,12,14,0.65) 0%, transparent 55%)",
                    }}
                  />
                  <div style={{ position: "absolute", bottom: 28, left: 28, right: 28 }}>
                    <h4 style={{ fontSize: 20, fontWeight: 600, color: "var(--canvas)", letterSpacing: "-0.015em", marginBottom: 6 }}>{title}</h4>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          SECTION 6 — Témoignages carousel
      ───────────────────────────────────────── */}
      <section
        style={{
          paddingBlock: isMobile ? 72 : 120,
          backgroundColor: "var(--canvas)",
          borderTop: "1px solid var(--hairline)",
          overflow: "hidden",
        }}
      >
        <div className="page-container" style={{ marginBottom: 48 }}>
        </div>

        {/* Row 1 — scrolls left */}
        {featuredReviews.length > 0 && (
          <div style={{ overflow: "hidden", marginBottom: 16 }}>
            <div
              className="testimonial-track"
              style={{ gap: 16, animationDuration: "40s" }}
            >
              {[...featuredReviews, ...featuredReviews].map((r: any, i: number) => (
                <TestimonialCard
                  key={i}
                  quote={r.comment ?? ""}
                  name={r.clientName ?? "Client anonyme"}
                  role={r.providerName ?? ""}
                  avatar=""
                  rating={r.rating ?? 5}
                />
              ))}
            </div>
          </div>
        )}

        {featuredReviews.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBlock: 24 }}>
            <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>
              Les premiers avis apparaîtront ici
            </p>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────
          SECTION 7 — Salons populaires (cards)
      ───────────────────────────────────────── */}
      <section
        style={{
          paddingBlock: isMobile ? 72 : 120,
          backgroundColor: "var(--canvas)",
          borderTop: "1px solid var(--hairline)",
        }}
      >
        <div className="page-container">
          <Reveal>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, gap: 16, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 600, letterSpacing: "-0.025em", color: "var(--ink)", margin: 0 }}>
                Salons à la une
              </h2>
              <motion.button
                onClick={() => setLocation("/search")}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink)",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid var(--ink)",
                  paddingBottom: 2,
                  cursor: "pointer",
                }}
                whileHover={{ opacity: 0.55 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                Voir tous
              </motion.button>
            </div>
          </Reveal>

          <Stagger className="home-salons-grid">
            {featuredProviders.map(provider => (
              <StaggerItem key={provider.id}>
                <motion.div
                  className="group"
                  onClick={() => setLocation(`/${provider.slug}`)}
                  style={{ cursor: "pointer" }}
                  whileHover="hover"
                  initial="rest"
                  animate="rest"
                >
                  <div
                    style={{
                      height: 420,
                      borderRadius: 20,
                      overflow: "hidden",
                      marginBottom: 20,
                      border: "1px solid var(--hairline)",
                      background: "var(--surface-2)",
                    }}
                  >
                    {provider.photos[0] && (
                      <motion.img
                        src={provider.photos[0]}
                        alt={provider.name}
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
                        transition={{ duration: 0.55, ease: [0.0, 0.0, 0.2, 1] }}
                      />
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--ink-tertiary)", marginBottom: 8, letterSpacing: "0.02em" }}>
                    {provider.category} · {provider.city}
                  </p>
                  <motion.h4
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--ink)",
                      letterSpacing: "-0.015em",
                    }}
                    variants={{ rest: { color: "var(--ink)" }, hover: { color: "var(--ink-secondary)" } }}
                    transition={{ duration: 0.2 }}
                  >
                    {provider.name}
                  </motion.h4>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          SECTION 8 — CTA final
      ───────────────────────────────────────── */}
      <section
        style={{
          paddingBlock: isMobile ? 80 : 120,
          backgroundColor: "var(--canvas)",
          borderTop: "1px solid var(--hairline)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          paddingInline: isMobile ? 20 : 40,
        }}
      >
        <Reveal delay={0.05}>
          <h2 style={{
            fontSize: "clamp(32px, 4.5vw, 56px)",
            fontWeight: 600,
            color: "var(--ink)",
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            margin: "0 0 40px",
            maxWidth: 720,
            textAlign: "center",
          }}>
              Votre prochain <span className="whitespace-nowrap">rendez-vous</span> <br />vous attend en ligne
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <motion.button
              onClick={() => setLocation("/search")}
              style={{
                height: 46,
                paddingInline: 28,
                backgroundColor: "var(--accent)",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font)",
              }}
              whileHover={{ backgroundColor: "var(--accent-hover)", scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              Trouver un salon
            </motion.button>
            <motion.button
              onClick={() => setLocation("/auth/register?role=pro")}
              style={{
                height: 46,
                paddingInline: 28,
                backgroundColor: "transparent",
                color: "var(--ink)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                borderRadius: 9999,
                border: "1px solid var(--hairline-strong)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "var(--font)",
              }}
              whileHover={{ backgroundColor: "var(--ink)", color: "#FFFFFF", scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              Espace professionnel
              <ArrowRight size={14} />
            </motion.button>
          </div>
        </Reveal>
      </section>

      <Footer />

      {/* Floating dashboard demo button */}
      <a
        href="/dashboard/analytics"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: "var(--ink)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          padding: "10px 18px 10px 14px",
          borderRadius: 999,
          textDecoration: "none",
          letterSpacing: "-0.01em",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(8px)",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(12,12,14,0.80)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--ink)";
        }}
      >
        <span style={{
          width: 20, height: 20, borderRadius: 6,
          backgroundColor: "rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </span>
        Voir le Dashboard
      </a>
    </div>
  );
}
