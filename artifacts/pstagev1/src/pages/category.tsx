import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { SERVICE_CATEGORIES, MOROCCO_CITIES } from "@/lib/cities";
import { Search, ArrowRight, MapPin, ChevronDown, Tag } from "lucide-react";
import { useBreakpoint, useIsMobile } from "@/hooks/use-mobile";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

/* ── Per-category config ─────────────────────────────────── */
const CATEGORY_CONFIG: Record<string, {
  image: string;
  headline: string;
  subtitle: string;
  plural: string;
}> = {
  coiffeur: {
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80&fit=crop",
    headline: "Les meilleurs coiffeurs du Maroc",
    subtitle: "Coupe, brushing, coloration — trouvez le salon qu'il vous faut.",
    plural: "coiffeurs",
  },
  barbier: {
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80&fit=crop",
    headline: "Les meilleurs barbiers du Maroc",
    subtitle: "Rasage, coupe homme, entretien de barbe — l'expérience du vrai barbier.",
    plural: "barbiers",
  },
  manucure: {
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&q=80&fit=crop",
    headline: "Salons de manucure & pédicure",
    subtitle: "Gel, semi-permanent, nail art — prenez soin de vos mains et de vos pieds.",
    plural: "salons de manucure",
  },
  beaute: {
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&q=80&fit=crop",
    headline: "Instituts de beauté au Maroc",
    subtitle: "Soins du visage, épilation, maquillage — sublimez votre beauté au quotidien.",
    plural: "instituts de beauté",
  },
  "bien-etre": {
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80&fit=crop",
    headline: "Spas & centres de bien-être",
    subtitle: "Massages, hammam, relaxation — offrez-vous un moment de pure détente.",
    plural: "centres de bien-être",
  },
  maquillage: {
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100d6a6?w=1600&q=80&fit=crop",
    headline: "Artistes maquilleurs au Maroc",
    subtitle: "Mariage, événement, quotidien — confiez votre visage à des expertes.",
    plural: "artistes maquilleurs",
  },
  epilation: {
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1600&q=80&fit=crop",
    headline: "Centres d'épilation au Maroc",
    subtitle: "Cire, laser, fil — une peau douce et sans souci, toute l'année.",
    plural: "centres d'épilation",
  },
  soin: {
    image: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=1600&q=80&fit=crop",
    headline: "Instituts de soins visage",
    subtitle: "Nettoyage, hydratation, anti-âge — prenez soin de votre peau avec les meilleurs.",
    plural: "instituts de soins",
  },
};

const CITY_CARDS = [
  { city: "Casablanca",   img: "https://images.unsplash.com/photo-1553301997-e1e8e4c1e3d1?w=600&q=70&fit=crop" },
  { city: "Marrakech",    img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=70&fit=crop" },
  { city: "Rabat",        img: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&q=70&fit=crop" },
  { city: "Fès",          img: "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=600&q=70&fit=crop" },
  { city: "Tanger",       img: "https://images.unsplash.com/photo-1548407260-da850faa41e3?w=600&q=70&fit=crop" },
  { city: "Agadir",       img: "https://images.unsplash.com/photo-1548700734-d1e6e57e0a8e?w=600&q=70&fit=crop" },
  { city: "Meknès",       img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=70&fit=crop" },
  { city: "Oujda",        img: "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=600&q=70&fit=crop" },
  { city: "Kénitra",      img: "https://images.unsplash.com/photo-1449496967047-2a322e7ec170?w=600&q=70&fit=crop" },
  { city: "Tétouan",      img: "https://images.unsplash.com/photo-1519923834699-ef0b7cde4712?w=600&q=70&fit=crop" },
  { city: "Chefchaouen",  img: "https://images.unsplash.com/photo-1548681528-6a5c45b66063?w=600&q=70&fit=crop" },
  { city: "Essaouira",    img: "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=600&q=70&fit=crop" },
];

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

export default function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [cityId, setCityId] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const { isMobile, isLg } = useBreakpoint();
  const isMobileSimple = useIsMobile();

  const cityRef = useRef<HTMLDivElement>(null);
  useClickOutside(cityRef, () => { setCityOpen(false); setCityQuery(""); });

  const cfg = CATEGORY_CONFIG[categorySlug ?? ""] ?? CATEGORY_CONFIG["coiffeur"];
  const categoryLabel = SERVICE_CATEGORIES.find(c => c.id === categorySlug)?.label ?? "Coiffeur";

  const filteredCities = cityQuery
    ? MOROCCO_CITIES.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()))
    : MOROCCO_CITIES;

  function handleSearch() {
    const params = new URLSearchParams({ category: categorySlug ?? "coiffeur" });
    if (query.trim()) params.set("q", query.trim());
    if (cityId) params.set("city", cityId);
    setLocation(`/search?${params}`);
  }

  function goToCity(city: string) {
    setLocation(`/search?category=${categorySlug}&city=${encodeURIComponent(city)}`);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      <TopBar />

      {/* ── PAGE TITLE BANNER (compact) ─────────────────────── */}
      <section
        style={{
          position: "relative",
          height: isMobile ? 280 : 340,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${cfg.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.0, 0.0, 0.2, 1] }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            paddingInline: isMobile ? 20 : 40,
            maxWidth: 800,
            width: "100%",
          }}
        >
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
            style={{
              fontSize: isMobile ? "clamp(22px, 7vw, 30px)" : "clamp(28px, 3.5vw, 42px)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.12,
              color: "#FFFFFF",
              marginBottom: 10,
            }}
          >
            {cfg.headline}
          </motion.h1>

        </div>

      </section>

      {/* ── SEARCH CONSOLE (same as home, category pre-fixed) ── */}
      <div
        style={{
          paddingInline: isMobile ? 16 : 40,
          maxWidth: 860,
          marginInline: "auto",
          width: "100%",
          marginTop: isMobile ? -16 : -20,
          marginBottom: isMobile ? 48 : 64,
          position: "relative",
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
          style={{
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-panel)",
            width: "100%",
          }}
        >
          {isMobileSimple ? (
            /* ── Mobile ── */
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Category — fixed badge row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 52,
                  paddingInline: 16,
                  borderBottom: "1px solid var(--hairline)",
                }}
              >
                <Tag size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)", flex: 1 }}>
                  {categoryLabel}
                </span>
              </div>

              {/* City row */}
              <div ref={cityRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setCityOpen(v => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    height: 52,
                    paddingInline: 16,
                    fontSize: 14,
                    fontWeight: 500,
                    color: cityId ? "var(--ink)" : "var(--ink-tertiary)",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--hairline)",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    textAlign: "left",
                  }}
                >
                  <MapPin size={14} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{cityId || "Ville"}</span>
                  <ChevronDown
                    size={14}
                    color="var(--ink-tertiary)"
                    style={{ transition: "transform var(--ease)", transform: cityOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                {cityOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      right: 0,
                      zIndex: 200,
                      backgroundColor: "var(--surface-1)",
                      border: "1px solid var(--hairline-strong)",
                      borderRadius: "var(--radius-card)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--hairline)" }}>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Rechercher une ville…"
                        value={cityQuery}
                        onChange={e => setCityQuery(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          width: "100%",
                          height: 36,
                          paddingInline: 10,
                          backgroundColor: "rgba(12,12,14,0.04)",
                          border: "none",
                          borderRadius: "var(--radius-control)",
                          fontSize: 14,
                          color: "var(--ink)",
                          fontFamily: "var(--font)",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                      <button
                        type="button"
                        onClick={() => { setCityId(""); setCityOpen(false); setCityQuery(""); }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 14, fontWeight: !cityId ? 600 : 400, color: !cityId ? "var(--accent)" : "var(--ink-secondary)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font)" }}
                      >
                        Toutes les villes
                      </button>
                      {filteredCities.map(city => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => { setCityId(city); setCityOpen(false); setCityQuery(""); }}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 14, fontWeight: cityId === city ? 600 : 400, color: cityId === city ? "var(--accent)" : "var(--ink-secondary)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font)" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,12,14,0.04)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Text input + search button */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Prestation, salon…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  style={{
                    flex: 1,
                    height: 52,
                    paddingInline: 16,
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "var(--ink)",
                    backgroundColor: "transparent",
                    fontFamily: "var(--font)",
                    minWidth: 0,
                  }}
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: 7,
                    height: 38,
                    width: 38,
                    backgroundColor: "var(--accent)",
                    color: "#FFFFFF",
                    borderRadius: "var(--radius-control)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"; }}
                >
                  <Search size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* ── Desktop: inline row ── */
            <div style={{ display: "flex", alignItems: "center", height: 54, gap: 0 }}>

              {/* Category — fixed badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 54,
                  paddingInline: "14px 16px",
                  borderRight: "1px solid var(--hairline)",
                  flexShrink: 0,
                  minWidth: 150,
                  userSelect: "none",
                }}
              >
                <Tag size={13} color="var(--accent)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--accent)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {categoryLabel}
                </span>
              </div>

              {/* City dropdown */}
              <div ref={cityRef} style={{ position: "relative", flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setCityOpen(v => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 54,
                    paddingInline: "14px 10px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: cityId ? "var(--ink)" : "var(--ink-tertiary)",
                    background: "transparent",
                    border: "none",
                    borderRight: "1px solid var(--hairline)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font)",
                    minWidth: 130,
                  }}
                >
                  <MapPin size={13} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: "left" }}>{cityId || "Ville"}</span>
                  <ChevronDown
                    size={13}
                    color="var(--ink-tertiary)"
                    style={{ transition: "transform var(--ease)", transform: cityOpen ? "rotate(180deg)" : "none", flexShrink: 0 }}
                  />
                </button>
                {cityOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      width: 220,
                      zIndex: 200,
                      backgroundColor: "var(--surface-1)",
                      border: "1px solid var(--hairline-strong)",
                      borderRadius: "var(--radius-card)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--hairline)" }}>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Rechercher une ville…"
                        value={cityQuery}
                        onChange={e => setCityQuery(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          width: "100%",
                          height: 32,
                          paddingInline: 10,
                          backgroundColor: "rgba(12,12,14,0.04)",
                          border: "none",
                          borderRadius: "var(--radius-control)",
                          fontSize: 13,
                          color: "var(--ink)",
                          fontFamily: "var(--font)",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                      <button
                        type="button"
                        onClick={() => { setCityId(""); setCityOpen(false); setCityQuery(""); }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 16px", fontSize: 13, fontWeight: !cityId ? 600 : 400, color: !cityId ? "var(--accent)" : "var(--ink-secondary)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font)", transition: "background-color var(--ease-fast)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,12,14,0.04)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                      >
                        Toutes les villes
                      </button>
                      {filteredCities.length === 0 ? (
                        <div style={{ padding: "10px 16px", fontSize: 13, color: "var(--ink-tertiary)" }}>
                          Aucune ville trouvée
                        </div>
                      ) : (
                        filteredCities.map(city => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => { setCityId(city); setCityOpen(false); setCityQuery(""); }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 16px", fontSize: 13, fontWeight: cityId === city ? 600 : 400, color: cityId === city ? "var(--accent)" : "var(--ink-secondary)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font)", transition: "background-color var(--ease-fast)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,12,14,0.04)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                          >
                            {city}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Text input */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", paddingInline: 12 }}>
                <input
                  type="text"
                  placeholder="Prestation, salon…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "var(--ink)",
                    backgroundColor: "transparent",
                    fontFamily: "var(--font)",
                    minWidth: 0,
                  }}
                />
              </div>

              {/* Search button */}
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  margin: 7,
                  height: 40,
                  paddingInline: 20,
                  backgroundColor: "var(--accent)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  borderRadius: "var(--radius-control)",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font)",
                  transition: "background-color var(--ease)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"; }}
              >
                <Search size={14} />
                Rechercher
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── CITIES GRID ─────────────────────────────────────── */}
      <section
        style={{
          paddingBottom: isMobile ? 56 : 96,
          paddingInline: isMobile ? 16 : 40,
          maxWidth: 1200,
          marginInline: "auto",
          width: "100%",
        }}
      >
        <Stagger
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : isLg
              ? "repeat(4, 1fr)"
              : "repeat(3, 1fr)",
            gap: isMobile ? 12 : 16,
          }}
        >
          {CITY_CARDS.map(({ city, img }) => (
            <StaggerItem key={city}>
              <motion.div
                onClick={() => goToCity(city)}
                whileHover="hover"
                initial="rest"
                animate="rest"
                style={{
                  position: "relative",
                  borderRadius: isMobile ? 16 : 20,
                  overflow: "hidden",
                  cursor: "pointer",
                  aspectRatio: isMobile ? "4/3" : "3/2",
                  border: "1px solid var(--hairline)",
                }}
              >
                <motion.div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
                  transition={{ duration: 0.55, ease: [0.0, 0.0, 0.2, 1] }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(5,5,8,0.72) 0%, rgba(5,5,8,0.1) 60%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: isMobile ? "12px 14px" : "16px 18px",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: isMobile ? 11 : 12,
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: 2,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {categoryLabel}
                    </p>
                    <p
                      style={{
                        fontSize: isMobile ? 15 : 17,
                        fontWeight: 600,
                        color: "#FFFFFF",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.2,
                      }}
                    >
                      {city}
                    </p>
                  </div>
                  <motion.div
                    variants={{ rest: { opacity: 0, x: -6 }, hover: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.22 }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ArrowRight size={14} color="#FFFFFF" />
                  </motion.div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <Reveal>
        <section
          style={{
            paddingBlock: isMobile ? 56 : 80,
            paddingInline: isMobile ? 16 : 40,
            maxWidth: 1200,
            marginInline: "auto",
            width: "100%",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(12,12,14,0.04)",
              border: "1px solid var(--hairline)",
              borderRadius: isMobile ? 20 : 28,
              paddingBlock: isMobile ? 40 : 56,
              paddingInline: isMobile ? 24 : 64,
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: isMobile ? 28 : 40,
            }}
          >
            <div style={{ maxWidth: 520 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-tertiary)",
                  marginBottom: 12,
                }}
              >
                Vous êtes professionnel ?
              </p>
              <h2
                style={{
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  color: "var(--ink)",
                  marginBottom: 12,
                }}
              >
                Rejoignez les {cfg.plural} déjà sur la plateforme
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--ink-secondary)",
                  lineHeight: 1.55,
                }}
              >
                Gérez vos rendez-vous, votre agenda et votre équipe depuis un seul endroit. Inscription gratuite, sans engagement.
              </p>
            </div>
            <motion.button
              onClick={() => setLocation("/auth/register")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              style={{
                flexShrink: 0,
                height: 48,
                paddingInline: 28,
                backgroundColor: "var(--accent)",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Inscrire mon établissement
              <ArrowRight size={15} />
            </motion.button>
          </div>
        </section>
      </Reveal>

      <Footer />
    </div>
  );
}
