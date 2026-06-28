import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearch, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { NiceSelect } from "@/components/ui/NiceSelect";
import { getNextAvailable, type Provider } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adaptProviderList } from "@/lib/provider-adapter";
import { MOROCCO_CITIES, SERVICE_CATEGORIES, SORT_OPTIONS } from "@/lib/cities";
import {
  MapPin, Star, ChevronLeft, ChevronRight,
  Map, Satellite, X, Clock, CheckCircle2, Calendar, LocateFixed,
  Search, SlidersHorizontal, List, Compass,
} from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const CITY_OPTIONS = [
  { id: "", label: "Toutes les villes" },
  ...MOROCCO_CITIES.map(c => ({ id: c, label: c })),
];
const PER_PAGE = 8;
const TOPBAR_HEIGHT = 56;

const TILES = {
  map: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

const PRICE_SYMBOLS: Record<number, string> = { 1: "MAD", 2: "MAD MAD", 3: "MAD MAD MAD" };

/* ─────────────────────────────────────────────
   Custom map pin
───────────────────────────────────────────── */
function makePin(selected: boolean) {
  const bg = selected ? "#0C0C0E" : "#FFFFFF";
  const iconColor = selected ? "#FFFFFF" : "#0C0C0E";
  const border = selected ? "#0C0C0E" : "rgba(10,10,15,0.14)";
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${bg};border:2px solid ${border};display:flex;align-items:center;justify-content:center;transition:all .2s ease;box-shadow:none">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="6" cy="6" r="3" stroke="${iconColor}" stroke-width="2"/>
        <circle cx="6" cy="18" r="3" stroke="${iconColor}" stroke-width="2"/>
        <line x1="8.5" y1="8.5" x2="20" y2="4" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
        <line x1="8.5" y1="15.5" x2="20" y2="20" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
        <line x1="8.5" y1="8.5" x2="15" y2="12" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
        <line x1="8.5" y1="15.5" x2="15" y2="12" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

/* ─────────────────────────────────────────────
   Map auto-fit
───────────────────────────────────────────── */
function MapFlyTo({ providers }: { providers: Provider[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = providers.filter(p => p.latitude && p.longitude);
    if (!valid.length) return;
    if (valid.length === 1) {
      map.setView([valid[0].latitude!, valid[0].longitude!], 13, { animate: true });
      return;
    }
    map.fitBounds(
      L.latLngBounds(valid.map(p => [p.latitude!, p.longitude!] as [number, number])),
      { padding: [60, 60], animate: true }
    );
  }, [providers.map(p => p.id).join(",")]);
  return null;
}

/* ─────────────────────────────────────────────
   User location marker
───────────────────────────────────────────── */
function UserLocationMarker({ coords }: { coords: { lat: number; lng: number } | null }) {
  if (!coords) return null;
  return (
    <CircleMarker
      center={[coords.lat, coords.lng]}
      radius={9}
      pathOptions={{ color: "#D4466E", fillColor: "#D4466E", fillOpacity: 0.25, weight: 2 }}
    />
  );
}

/* ─────────────────────────────────────────────
   Star rating display
───────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={11}
          style={{
            fill: i <= Math.round(rating) ? "var(--rating)" : "transparent",
            color: "var(--rating)",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Result card — redesigned with better hierarchy
───────────────────────────────────────────── */
function ResultCard({
  provider, isSelected, onHover, onLeave, index = 0,
}: {
  provider: Provider;
  isSelected: boolean;
  onHover: () => void;
  onLeave: () => void;
  index?: number;
}) {
  const [, setLocation] = useLocation();
  const nextSlot = getNextAvailable(provider);
  const categoryLabel = SERVICE_CATEGORIES.find(c => c.id === provider.category)?.label ?? provider.category;
  const topServices = provider.services.slice(0, 3);
  const minPrice = provider.minPriceCents != null
    ? provider.minPriceCents / 100
    : provider.services.length > 0
      ? Math.min(...provider.services.map(s => s.priceCents)) / 100
      : null;
  const minDuration = provider.minDurationMinutes != null
    ? provider.minDurationMinutes
    : provider.services.length > 0
      ? Math.min(...provider.services.map(s => s.durationMinutes))
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="result-card"
      style={{
        backgroundColor: isSelected ? "rgba(12,12,14,0.03)" : "var(--surface-1)",
        border: `1px solid ${isSelected ? "var(--hairline-strong)" : "var(--hairline)"}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        transition: "border-color 0.2s ease, background-color 0.2s ease",
        cursor: "pointer",
      }}
    >
      {/* ── Photo ── */}
      <div
        onClick={() => setLocation(`/${provider.slug}`)}
        style={{
          width: 156,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={provider.photos[0]}
          alt={provider.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 50%, rgba(10,10,15,0.5) 100%)",
          pointerEvents: "none",
        }} />
        {/* Popular badge */}
        {provider.isPopular && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            height: 20, paddingInline: 8,
            display: "inline-flex", alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 9999, fontSize: 9, fontWeight: 600, color: "var(--ink)",
            letterSpacing: "0.04em", pointerEvents: "none", textTransform: "uppercase",
          }}>
            Populaire
          </span>
        )}
        {/* Price badge at bottom */}
        {minPrice != null && (
          <span style={{
            position: "absolute", bottom: 10, left: 10,
            height: 22, paddingInline: 8,
            display: "inline-flex", alignItems: "center",
            backgroundColor: "rgba(10,10,15,0.72)",
            backdropFilter: "blur(6px)",
            borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#FFFFFF",
            letterSpacing: "-0.01em", pointerEvents: "none",
          }}>
            dès {minPrice} MAD
          </span>
        )}
      </div>

      {/* ── Info ── */}
      <div
        onClick={() => setLocation(`/${provider.slug}`)}
        style={{
          flex: 1, minWidth: 0,
          padding: "14px 14px 14px 16px",
          display: "flex", flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <p style={{
            fontSize: 15, fontWeight: 600, color: "var(--ink)",
            letterSpacing: "-0.015em", lineHeight: 1.2,
            margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {provider.name}
          </p>
          {provider.isVerified && (
            <CheckCircle2 size={12} color="var(--ink-secondary)" style={{ flexShrink: 0 }} />
          )}
        </div>

        {/* Category tag */}
        <span style={{
          display: "inline-block", alignSelf: "flex-start",
          fontSize: 10, fontWeight: 600, color: "var(--ink-secondary)",
          backgroundColor: "rgba(12,12,14,0.06)",
          paddingInline: 7, paddingBlock: 3, borderRadius: 5,
          letterSpacing: "0.01em", marginBottom: 8,
        }}>
          {categoryLabel}
        </span>

        {/* Rating row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Stars rating={provider.rating} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{provider.rating}</span>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>· {provider.reviewCount} avis</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "var(--hairline-strong)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)", fontWeight: 500, letterSpacing: "0.01em" }}>
            {PRICE_SYMBOLS[provider.priceLevel] ?? "MAD"}
          </span>
        </div>

        {/* Address + distance */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: "auto" }}>
          <MapPin size={10} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {provider.address}, {provider.city}
          </span>
          {provider.distanceKm != null && (
            <span style={{
              flexShrink: 0, marginLeft: 4,
              fontSize: 10, fontWeight: 600, color: "var(--ink-secondary)",
              backgroundColor: "rgba(12,12,14,0.06)",
              paddingInline: 6, paddingBlock: 2, borderRadius: 4,
            }}>
              {provider.distanceKm < 1
                ? `${Math.round(provider.distanceKm * 1000)} m`
                : `${provider.distanceKm} km`}
            </span>
          )}
        </div>

        {/* Service chips + duration */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          {topServices.map(s => (
            <span key={s.id} style={{
              fontSize: 11, fontWeight: 500, color: "var(--ink-secondary)",
              backgroundColor: "rgba(12,12,14,0.04)",
              border: "1px solid var(--hairline)",
              paddingInline: 8, paddingBlock: 3, borderRadius: 6,
              whiteSpace: "nowrap",
            }}>
              {s.name}
            </span>
          ))}
          {minDuration != null && (
            <span style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 11, color: "var(--ink-tertiary)", marginLeft: "auto",
            }}>
              <Clock size={10} />
              {minDuration} min
            </span>
          )}
        </div>
      </div>

      {/* ── CTA panel ── */}
      <div style={{
        flexShrink: 0,
        width: 130,
        borderLeft: "1px solid var(--hairline)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "14px 12px", gap: 10,
      }}>
        <button
          onClick={e => { e.stopPropagation(); setLocation(`/booking/${provider.slug}`); }}
          className="ds-btn ds-btn-primary ds-btn-sm"
          style={{ width: "100%", fontFamily: "var(--font)" }}
        >
          Réserver
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 2 }}>
            <Calendar size= {9} color="var(--ink-tertiary)" />
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--ink-tertiary)", letterSpacing: "-0.01em" }}>
              Prochaine dispo
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--ink-secondary)", fontWeight: 500 }}>
            {nextSlot}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Skeleton card
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 12, border: "1px solid var(--hairline)",
      overflow: "hidden", display: "flex", height: 124,
    }}>
      <div className="skeleton" style={{ width: 132, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton" style={{ width: "55%", height: 14 }} />
        <div className="skeleton" style={{ width: "35%", height: 10 }} />
        <div className="skeleton" style={{ width: "70%", height: 10 }} />
        <div style={{ marginTop: "auto", display: "flex", gap: 6 }}>
          <div className="skeleton" style={{ width: 50, height: 18, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 60, height: 18, borderRadius: 6 }} />
        </div>
      </div>
      <div style={{
        width: 120, flexShrink: 0,
        borderLeft: "1px solid var(--hairline)",
        padding: 14, display: "flex", flexDirection: "column", gap: 8,
        alignItems: "center", justifyContent: "center",
      }}>
        <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 60, height: 10 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Pagination
───────────────────────────────────────────── */
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const base: React.CSSProperties = {
    height: 32, minWidth: 32, paddingInline: 8, borderRadius: 7,
    border: "1px solid var(--hairline)", backgroundColor: "var(--surface-1)",
    fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
    transition: "all 0.15s ease", fontFamily: "var(--font)", letterSpacing: "-0.01em",
  };
  const active: React.CSSProperties = { ...base, backgroundColor: "var(--ink)", borderColor: "var(--ink)", color: "#FFFFFF", fontWeight: 600 };
  const disabled: React.CSSProperties = { ...base, opacity: 0.32, cursor: "not-allowed" };

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, paddingBlock: 24 }}>
      <button disabled={page === 1} onClick={() => onPage(page - 1)} style={page === 1 ? disabled : base}>
        <ChevronLeft size={13} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} style={{ ...base, border: "none", backgroundColor: "transparent", cursor: "default", color: "var(--ink-tertiary)" }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            style={p === page ? active : base}
            onMouseEnter={e => { if (p !== page) e.currentTarget.style.backgroundColor = "rgba(12,12,14,0.04)"; }}
            onMouseLeave={e => { if (p !== page) e.currentTarget.style.backgroundColor = "var(--surface-1)"; }}
          >{p}</button>
        )
      )}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)} style={page === totalPages ? disabled : base}>
        <ChevronRight size={13} />
      </button>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Filter pills — show active filters
───────────────────────────────────────────── */
function ActiveFilterPills({
  categoryId,
  cityId,
  userCoords,
  categoryLabel,
  cityLabel,
  onRemoveCategory,
  onRemoveCity,
  onRemoveLocation,
}: {
  categoryId: string;
  cityId: string;
  userCoords: { lat: number; lng: number } | null;
  categoryLabel: string | null;
  cityLabel: string;
  onRemoveCategory: () => void;
  onRemoveCity: () => void;
  onRemoveLocation: () => void;
}) {
  const pills: { label: string; onRemove: () => void }[] = [];
  if (categoryId && categoryLabel) pills.push({ label: categoryLabel, onRemove: onRemoveCategory });
  if (cityId) pills.push({ label: cityId, onRemove: onRemoveCity });
  if (userCoords) pills.push({ label: "À proximité", onRemove: onRemoveLocation });

  if (!pills.length) return null;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {pills.map(pill => (
        <button
          key={pill.label}
          onClick={pill.onRemove}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            height: 26, paddingInline: "8px 6px",
            borderRadius: 9999,
            backgroundColor: "rgba(12,12,14,0.06)",
            border: "none",
            fontSize: 11, fontWeight: 500, color: "var(--ink-secondary)",
            fontFamily: "var(--font)", cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(12,12,14,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(12,12,14,0.06)"; }}
        >
          {pill.label}
          <X size={10} style={{ flexShrink: 0 }} />
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Empty state
───────────────────────────────────────────── */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", paddingBlock: 80, paddingInline: 24,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        backgroundColor: "rgba(12,12,14,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16,
      }}>
        <Compass size={20} color="var(--ink-tertiary)" />
      </div>
      <h3 style={{
        fontSize: 16, fontWeight: 600, color: "var(--ink)",
        letterSpacing: "-0.015em", margin: "0 0 6px",
      }}>
        Aucun résultat
      </h3>
      <p style={{
        fontSize: 13, color: "var(--ink-tertiary)",
        maxWidth: 260, margin: "0 0 20px", lineHeight: 1.5,
      }}>
        Essayez de modifier vos filtres ou d'élargir votre zone de recherche.
      </p>
      <button
        onClick={onReset}
        className="ds-btn ds-btn-secondary ds-btn-sm"
        style={{ fontFamily: "var(--font)" }}
      >
        Réinitialiser les filtres
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Search input component
───────────────────────────────────────────── */
function SearchInput({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div style={{
      position: "relative",
      flex: 1,
      minWidth: 0,
    }}>
      <Search
        size={14}
        style={{
          position: "absolute", left: 12, top: "50%",
          transform: "translateY(-50%)",
          color: "var(--ink-tertiary)",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        placeholder="Rechercher un établissement, un service…"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 36,
          paddingLeft: 34,
          paddingRight: value ? 32 : 12,
          backgroundColor: "rgba(12,12,14,0.04)",
          border: "1px solid var(--hairline)",
          borderRadius: 8,
          color: "var(--ink)",
          fontFamily: "var(--font)",
          fontSize: 13,
          outline: "none",
          transition: "border-color 0.15s ease",
          boxSizing: "border-box",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = "var(--ink)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "var(--hairline)"; }}
      />
      {value && (
        <button
          onClick={onClear}
          style={{
            position: "absolute", right: 8, top: "50%",
            transform: "translateY(-50%)",
            width: 20, height: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", backgroundColor: "transparent",
            cursor: "pointer", color: "var(--ink-tertiary)",
            padding: 0,
          }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function SearchPage() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(searchString);
  const { isMobile, isLg } = useBreakpoint();
  const listRef = useRef<HTMLDivElement>(null);

  // ── State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState(params.get("category") || "");
  const [cityId, setCityId] = useState(params.get("city") || "");
  const [sortId, setSortId] = useState("relevance");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageDir, setPageDir] = useState<1 | -1>(1);
  const [tileMode, setTileMode] = useState<"map" | "satellite">("map");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  // ── Data ──
  const { data: rawProviders, isLoading: apiLoading } = useQuery({
    queryKey: ["providers", cityId, userCoords?.lat, userCoords?.lng],
    queryFn: () => api.searchProviders({
      city: userCoords ? undefined : (cityId || undefined),
      lat: userCoords?.lat,
      lng: userCoords?.lng,
      radius: 25,
    }),
    staleTime: 30_000,
  });

  useEffect(() => {
    setLoading(apiLoading);
  }, [apiLoading]);

  // Loading timeout
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [categoryId, cityId, searchQuery]);

  // Sync URL params
  useEffect(() => {
    const p = new URLSearchParams();
    if (categoryId) p.set("category", categoryId);
    if (cityId) p.set("city", cityId);
    navigate(`/search?${p.toString()}`, { replace: true });
    setPage(1);
  }, [categoryId, cityId]);

  // Scroll top on page change
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // ── Derived state ──
  const adaptedProviders = adaptProviderList(rawProviders ?? []);

  const allResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return adaptedProviders
      .filter(p => {
        // Text search filter
        if (q) {
          const nameMatch = p.name.toLowerCase().includes(q);
          const serviceMatch = p.services.some(s => s.name.toLowerCase().includes(q));
          const cityMatch = p.city.toLowerCase().includes(q);
          const catMatch = (SERVICE_CATEGORIES.find(c => c.id === p.category)?.label ?? "").toLowerCase().includes(q);
          if (!nameMatch && !serviceMatch && !cityMatch && !catMatch) return false;
        }
        // Category filter
        if (categoryId && categoryId !== "all" && p.category !== categoryId) return false;
        // City filter (not used when geolocation is active)
        if (!userCoords && cityId && p.city.toLowerCase() !== cityId.toLowerCase()) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortId === "nearest") return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
        if (sortId === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
        if (sortId === "price-asc") return (a.minPriceCents ?? Infinity) - (b.minPriceCents ?? Infinity);
        if (sortId === "price-desc") return (b.minPriceCents ?? 0) - (a.minPriceCents ?? 0);
        return 0;
      });
  }, [adaptedProviders, searchQuery, categoryId, cityId, userCoords, sortId]);

  const totalPages = Math.ceil(allResults.length / PER_PAGE);
  const results = allResults.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const cityLabel = cityId || "Maroc";
  const categoryLabel = SERVICE_CATEGORIES.find(c => c.id === categoryId)?.label || null;
  const hasActiveFilters = !!(categoryId || cityId || userCoords || searchQuery);

  const goPage = useCallback((p: number) => {
    setPageDir(p > page ? 1 : -1);
    setPage(p);
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const mapProviders = results.filter(p => p.latitude && p.longitude);
  const allMapProviders = allResults.filter(p => p.latitude && p.longitude);
  const defaultCenter: [number, number] =
    allMapProviders.length > 0
      ? [allMapProviders[0].latitude!, allMapProviders[0].longitude!]
      : [31.7917, -7.0926];

  const slideVariants = {
    enter: (dir: number) => ({ y: dir > 0 ? 16 : -16, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? -16 : 16, opacity: 0 }),
  };

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortId("nearest");
        setCityId("");
        setPage(1);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 10000 }
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setCategoryId("");
    setCityId("");
    setSortId("relevance");
    setUserCoords(null);
  }, []);

  /* ── Shared map content ── */
  const mapContent = (
    <>
      {/* Tile mode toggle */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 800,
        display: "flex",
        backgroundColor: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
        borderRadius: 9999, border: "1px solid var(--hairline)", padding: 3, gap: 2,
      }}>
        {(["map", "satellite"] as const).map(mode => (
          <button key={mode} onClick={() => setTileMode(mode)} style={{
            height: 28, paddingInline: 12, borderRadius: 9999, border: "none",
            backgroundColor: tileMode === mode ? "var(--ink)" : "transparent",
            color: tileMode === mode ? "#FFFFFF" : "var(--ink-secondary)",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
            cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.18s ease",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {mode === "map" ? <><Map size={11} />Carte</> : <><Satellite size={11} />Satellite</>}
          </button>
        ))}
      </div>

      {/* Count badge */}
      {!loading && mapProviders.length > 0 && (
        <div style={{
          position: "absolute", top: 12, right: 12, zIndex: 800,
          backgroundColor: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
          borderRadius: 9999, border: "1px solid var(--hairline)",
          paddingInline: 12, height: 32,
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, fontWeight: 500, color: "var(--ink-secondary)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--ink)", display: "inline-block" }} />
          {mapProviders.length} sur cette page
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        key={`map-${isMobile ? "mobile" : "desktop"}`}
      >
        <ZoomControl position="bottomright" />
        <TileLayer key={tileMode} url={TILES[tileMode]} attribution={tileMode === "map" ? "© CARTO" : "© Esri"} />
        <MapFlyTo providers={mapProviders} />
        <UserLocationMarker coords={userCoords} />
        {mapProviders.map(provider => (
          <Marker
            key={provider.id}
            position={[provider.latitude!, provider.longitude!]}
            icon={makePin(selectedId === provider.id)}
            eventHandlers={{
              click: () => setSelectedId(selectedId === provider.id ? null : provider.id),
              mouseover: () => setSelectedId(provider.id),
              mouseout: () => setSelectedId(null),
            }}
          >
            <Popup closeButton={false} className="custom-popup" offset={[0, -20]}>
              <div
                onClick={() => navigate(`/${provider.slug}`)}
                style={{ width: 210, cursor: "pointer", fontFamily: "var(--font)", borderRadius: 10, overflow: "hidden" }}
              >
                <img src={provider.photos[0]} alt={provider.name} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 3px", letterSpacing: "-0.01em" }}>{provider.name}</p>
                  <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: "0 0 6px" }}>{provider.city}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Stars rating={provider.rating} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>{provider.rating}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>({provider.reviewCount})</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );

  /* ── Shared filter bar — used on both mobile and desktop ── */
  const filterBar = (
    <div style={{
      position: "sticky", top: TOPBAR_HEIGHT, zIndex: 100,
      backgroundColor: "rgba(251,251,252,0.97)", backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--hairline)",
      padding: "12px 20px",
      flexShrink: 0,
    }}>
      {/* Top row: title + results count + reset */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10,
      }}>
        <div>
          <h1 style={{
            fontSize: 15, fontWeight: 600, color: "var(--ink)",
            letterSpacing: "-0.015em", lineHeight: 1.2, margin: 0,
          }}>
            {categoryLabel ? `${categoryLabel}` : "Établissements beauté"}
            {" à "}
            {cityLabel}
          </h1>
          <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: "2px 0 0" }}>
            {loading ? "Chargement…" : `${allResults.length} résultat${allResults.length !== 1 ? "s" : ""}`}
            {sortId === "nearest" && userCoords && " · Triés par proximité"}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              height: 26, paddingInline: 9,
              border: "1px solid var(--hairline)", borderRadius: 6,
              backgroundColor: "transparent", cursor: "pointer",
              fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)",
              fontFamily: "var(--font)", whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; e.currentTarget.style.color = "var(--ink)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--hairline)"; e.currentTarget.style.color = "var(--ink-tertiary)"; }}
          >
            <X size={10} />Réinitialiser
          </button>
        )}
      </div>

      {/* Filter controls row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Search input */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <SearchInput value={searchQuery} onChange={v => { setSearchQuery(v); setPage(1); }} onClear={() => { setSearchQuery(""); setPage(1); }} />
        </div>
        {/* Category */}
        <div style={{ flex: 0.75, minWidth: 0 }}>
          <NiceSelect options={SERVICE_CATEGORIES} value={categoryId || "all"} onChange={id => setCategoryId(id === "all" ? "" : id)} placeholder="Catégorie" />
        </div>
        {/* City */}
        <div style={{ flex: 0.75, minWidth: 0 }}>
          <NiceSelect options={CITY_OPTIONS} value={cityId} onChange={v => { setCityId(v); setUserCoords(null); }} placeholder="Ville" searchable />
        </div>
        {/* Sort */}
        <div style={{ width: 130, flexShrink: 0, display: isMobile ? "none" : "block" }}>
          <NiceSelect options={SORT_OPTIONS} value={sortId} onChange={setSortId} placeholder="Trier" />
        </div>
        {/* Locate me */}
        <button
          onClick={handleLocateMe}
          disabled={geoLoading}
          title="Rechercher près de moi"
          style={{
            flexShrink: 0, height: 36, paddingInline: 10,
            border: `1px solid ${userCoords ? "var(--accent)" : "var(--hairline)"}`,
            borderRadius: 8, cursor: geoLoading ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: 5,
            backgroundColor: userCoords ? "var(--accent-tint)" : "transparent",
            fontSize: 12, fontWeight: 600,
            color: userCoords ? "var(--accent)" : "var(--ink-tertiary)",
            fontFamily: "var(--font)", transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { if (!userCoords) e.currentTarget.style.borderColor = "var(--ink)"; }}
          onMouseLeave={e => { if (!userCoords) e.currentTarget.style.borderColor = "var(--hairline)"; }}
        >
          <LocateFixed size={13} />
          {geoLoading ? "…" : isMobile ? "" : "Près de moi"}
        </button>
      </div>

      {/* Active filter pills */}
      {(categoryId || cityId || userCoords) && (
        <div style={{ marginTop: 8 }}>
          <ActiveFilterPills
            categoryId={categoryId}
            cityId={cityId}
            userCoords={userCoords}
            categoryLabel={categoryLabel}
            cityLabel={cityLabel}
            onRemoveCategory={() => setCategoryId("")}
            onRemoveCity={() => setCityId("")}
            onRemoveLocation={() => { setUserCoords(null); setSortId("relevance"); }}
          />
        </div>
      )}
    </div>
  );

  /* ── Results list ── */
  const resultsList = (
    <>
      {/* Skeleton loading */}
      {loading && (
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div style={{ padding: "16px 20px 8px", flex: 1, display: "flex", flexDirection: "column" }}>
          <AnimatePresence mode="wait" custom={pageDir}>
            <motion.div
              key={`page-${page}`}
              custom={pageDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              {results.map((provider, i) => (
                <ResultCard
                  key={provider.id}
                  provider={provider}
                  isSelected={selectedId === provider.id}
                  onHover={() => setSelectedId(provider.id)}
                  onLeave={() => setSelectedId(null)}
                  index={i}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {!loading && results.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPage={goPage} />
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && (
        <div style={{ padding: "16px 20px" }}>
          <EmptyState onReset={resetFilters} />
        </div>
      )}
    </>
  );

  /* ══════════════════════════════════════════
     MOBILE LAYOUT (< 768px)
     ══════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)" }}>
        <TopBar />
        {filterBar}

        {/* Mobile: collapsible map */}
        <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 0 }}>
          <button
            onClick={() => setMobileMapOpen(!mobileMapOpen)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", height: 36,
              paddingInline: 14,
              backgroundColor: "rgba(12,12,14,0.04)",
              border: "1px solid var(--hairline)", borderRadius: 8,
              cursor: "pointer", fontFamily: "var(--font)",
              fontSize: 12, fontWeight: 600, color: "var(--ink-secondary)",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Map size={13} />
              {mobileMapOpen ? "Masquer la carte" : "Afficher la carte"}
            </span>
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, color: "var(--ink-tertiary)",
            }}>
              {mapProviders.length} établissements
              <motion.span
                animate={{ rotate: mobileMapOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex" }}
              >
                <ChevronLeft size={12} style={{ transform: "rotate(-90deg)" }} />
              </motion.span>
            </span>
          </button>
        </div>

        <AnimatePresence>
          {mobileMapOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 220, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden", position: "relative" }}
            >
              <div style={{ height: 220, borderBottom: "1px solid var(--hairline)", marginTop: 8, position: "relative" }}>
                {mapContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile results */}
        <div style={{ paddingBottom: 32 }}>
          {resultsList}
        </div>

        <Footer />
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DESKTOP LAYOUT (≥ 768px)
     ══════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)" }}>
      <TopBar />

      <div style={{ display: "flex", paddingTop: 0 }}>

        {/* ── LEFT PANEL ── */}
        <div
          ref={listRef}
          style={{
            width: isLg ? 660 : 540,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--hairline)",
            backgroundColor: "var(--canvas)",
            overflow: "auto",
            maxHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          }}
        >
          {filterBar}
          <div style={{ flex: 1, overflow: "auto" }}>
            {resultsList}
          </div>
        </div>

        {/* ── RIGHT PANEL — sticky map ── */}
        <div style={{
          flex: 1,
          position: "sticky",
          top: TOPBAR_HEIGHT,
          height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          alignSelf: "flex-start",
        }}>
          {mapContent}
        </div>
      </div>

      <Footer />
    </div>
  );
}
