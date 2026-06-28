import { useState, useEffect, useCallback, useRef } from "react";
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
const TOPBAR_HEIGHT = 84; // floating pill: 20px top + 56px height + 8px buffer

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
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${bg};border:2px solid ${border};display:flex;align-items:center;justify-content:center;transition:all .2s ease">
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
      pathOptions={{ color: "#2563EB", fillColor: "#3B82F6", fillOpacity: 0.5, weight: 2 }}
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
   Result card — redesigned
───────────────────────────────────────────── */
function ResultCard({
  provider, isSelected, onHover, onLeave,
}: {
  provider: Provider;
  isSelected: boolean;
  onHover: () => void;
  onLeave: () => void;
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
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        backgroundColor: isSelected ? "rgba(12,12,14,0.03)" : "var(--surface-1)",
        border: `1px solid ${isSelected ? "var(--hairline-strong)" : "var(--hairline)"}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        transition: "border-color 0.18s ease, background-color 0.18s ease",
        cursor: "pointer",
      }}
    >
      {/* ── Photo ── */}
      <div
        onClick={() => setLocation(`/${provider.slug}`)}
        style={{ width: 164, flexShrink: 0, position: "relative", overflow: "hidden" }}
      >
        <img
          src={provider.photos[0]}
          alt={provider.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Gradient overlay bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 56,
          background: "linear-gradient(to top, rgba(10,10,15,0.45) 0%, transparent 100%)",
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
        {/* Price at bottom of image */}
        <span style={{
          position: "absolute", bottom: 10, right: 10,
          fontSize: 11, fontWeight: 600, color: "#FFFFFF",
          letterSpacing: "-0.01em", pointerEvents: "none",
        }}>
          {minPrice != null ? `dès ${minPrice} MAD` : ""}
        </span>
      </div>

      {/* ── Info ── */}
      <div
        onClick={() => setLocation(`/${provider.slug}`)}
        style={{
          flex: 1, minWidth: 0,
          padding: "16px 16px 16px 18px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          gap: 0,
        }}
      >
        {/* Top: name + category + verified */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
            <p style={{
              fontSize: 15, fontWeight: 600, color: "var(--ink)",
              letterSpacing: "-0.015em", lineHeight: 1.2,
              margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {provider.name}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              {provider.isVerified && (
                <CheckCircle2 size={12} color="var(--ink-secondary)" />
              )}
              <span style={{
                fontSize: 10, fontWeight: 600, color: "var(--ink-secondary)",
                backgroundColor: "rgba(12,12,14,0.06)",
                paddingInline: 7, paddingBlock: 3, borderRadius: 5,
                letterSpacing: "0.01em", whiteSpace: "nowrap",
              }}>
                {categoryLabel}
              </span>
            </div>
          </div>

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
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
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

          {/* Service chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
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
          </div>
        </div>

        {/* Bottom: duration stat */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10 }}>
          <Clock size={10} color="var(--ink-tertiary)" />
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
            À partir de <strong style={{ fontWeight: 600, color: "var(--ink-secondary)" }}>{minDuration} min</strong>
          </span>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{
        flexShrink: 0, width: 136,
        borderLeft: "1px solid var(--hairline)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "16px 14px", gap: 10,
        backgroundColor: "transparent",
        transition: "background-color 0.18s ease",
      }}>
        <button
          onClick={e => { e.stopPropagation(); setLocation(`/booking/${provider.slug}`); }}
          style={{
            width: "100%", height: 38,
            backgroundColor: "var(--ink)", color: "#FFFFFF",
            border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "var(--font)",
            letterSpacing: "-0.01em",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(12,12,14,0.82)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--ink)"; }}
        >
          Réserver
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 2 }}>
            <Calendar size={10} color="var(--ink-tertiary)" />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)", letterSpacing: "-0.01em" }}>
              Prochaine dispo
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--ink-secondary)", fontWeight: 500 }}>
            {nextSlot}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Skeleton card
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 14, border: "1px solid var(--hairline)",
      overflow: "hidden", display: "flex", height: 128,
    }}>
      <div style={{ width: 130, backgroundColor: "rgba(12,12,14,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ width: "60%", height: 14, borderRadius: 4, backgroundColor: "rgba(12,12,14,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "40%", height: 11, borderRadius: 4, backgroundColor: "rgba(12,12,14,0.06)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.08s" }} />
        <div style={{ width: "75%", height: 11, borderRadius: 4, backgroundColor: "rgba(12,12,14,0.06)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.12s" }} />
        <div style={{ width: "50%", height: 11, borderRadius: 4, backgroundColor: "rgba(12,12,14,0.06)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.16s" }} />
      </div>
      <div style={{ width: 130, borderLeft: "1px solid var(--hairline)", padding: 14, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 90, height: 36, borderRadius: 9, backgroundColor: "rgba(12,12,14,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: 70, height: 11, borderRadius: 4, backgroundColor: "rgba(12,12,14,0.06)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.1s" }} />
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, paddingBlock: 20 }}>
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
  const { isMobile } = useBreakpoint();
  const listRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [categoryId, cityId]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (categoryId) p.set("category", categoryId);
    if (cityId) p.set("city", cityId);
    navigate(`/search?${p.toString()}`, { replace: true });
    setPage(1);
  }, [categoryId, cityId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const adaptedProviders = adaptProviderList(rawProviders ?? []);

  const allResults = adaptedProviders
    .filter(p => {
      if (userCoords) {
        if (categoryId && categoryId !== "all" && p.category !== categoryId) return false;
        return true;
      }
      if (categoryId && categoryId !== "all" && p.category !== categoryId) return false;
      if (cityId && p.city.toLowerCase() !== cityId.toLowerCase()) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortId === "nearest") return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      if (sortId === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortId === "price-asc") return (a.minPriceCents ?? Infinity) - (b.minPriceCents ?? Infinity);
      if (sortId === "price-desc") return (b.minPriceCents ?? 0) - (a.minPriceCents ?? 0);
      return 0;
    });

  const totalPages = Math.ceil(allResults.length / PER_PAGE);
  const results = allResults.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const cityLabel = cityId || "Maroc";
  const categoryLabel = SERVICE_CATEGORIES.find(c => c.id === categoryId)?.label || null;
  const hasActiveFilters = !!(categoryId || cityId || userCoords);

  const goPage = useCallback((p: number) => {
    setPageDir(p > page ? 1 : -1);
    setPage(p);
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

  const resetFilters = () => { setCategoryId(""); setCityId(""); setSortId("relevance"); setUserCoords(null); };

  /* ── Mobile layout ── */
  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)" }}>
        <TopBar />
        <div style={{ paddingTop: TOPBAR_HEIGHT }}>
          {/* Mobile filters */}
          <div style={{
            position: "sticky", top: 0, zIndex: 100,
            backgroundColor: "rgba(251,251,252,0.97)", backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--hairline)",
            padding: "10px 16px", display: "flex", gap: 8,
          }}>
            <div style={{ flex: 1 }}>
              <NiceSelect options={SERVICE_CATEGORIES} value={categoryId || "all"} onChange={id => setCategoryId(id === "all" ? "" : id)} placeholder="Catégorie" />
            </div>
            <div style={{ flex: 1 }}>
              <NiceSelect options={CITY_OPTIONS} value={cityId} onChange={v => { setCityId(v); setUserCoords(null); }} placeholder="Ville" searchable />
            </div>
            <button
              onClick={handleLocateMe}
              disabled={geoLoading}
              title="Rechercher près de moi"
              style={{
                width: 34, height: 34, flexShrink: 0,
                border: `1px solid ${userCoords ? "#2563EB" : "var(--hairline)"}`,
                borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: userCoords ? "rgba(37,99,235,0.08)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <LocateFixed size={14} color={userCoords ? "#2563EB" : "var(--ink-tertiary)"} />
            </button>
            {hasActiveFilters && (
              <button onClick={resetFilters} style={{ width: 34, height: 34, border: "1px solid var(--hairline)", borderRadius: 8, backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={14} color="var(--ink-tertiary)" />
              </button>
            )}
          </div>

          {/* Mobile map */}
          <div style={{ height: 200, borderBottom: "1px solid var(--hairline)", position: "relative" }}>
            <MapContainer center={defaultCenter} zoom={5} style={{ width: "100%", height: "100%" }} zoomControl={false} attributionControl={false} scrollWheelZoom={false}>
              <ZoomControl position="bottomright" />
              <TileLayer key={tileMode} url={TILES[tileMode]} />
              <MapFlyTo providers={mapProviders} />
              <UserLocationMarker coords={userCoords} />
              {mapProviders.map(p => (
                <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={makePin(selectedId === p.id)} eventHandlers={{ click: () => setSelectedId(selectedId === p.id ? null : p.id) }} />
              ))}
            </MapContainer>
          </div>

          {/* Mobile cards */}
          <div style={{ padding: "16px 16px 32px" }}>
            <p style={{ fontSize: 13, color: "var(--ink-tertiary)", marginBottom: 14 }}>
              <strong style={{ fontWeight: 600, color: "var(--ink)" }}>{allResults.length}</strong> établissement{allResults.length !== 1 ? "s" : ""}
            </p>
            {!loading && results.map(p => (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <ResultCard provider={p} isSelected={selectedId === p.id} onHover={() => setSelectedId(p.id)} onLeave={() => {}} />
              </div>
            ))}
            {!loading && <Pagination page={page} totalPages={totalPages} onPage={goPage} />}
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  /* ── Desktop split layout ── */
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)" }}>
      <TopBar />

      {/* Split content — page scrolls, map is sticky */}
      <div style={{ display: "flex", paddingTop: TOPBAR_HEIGHT }}>

        {/* ── LEFT PANEL ── */}
        <div
          ref={listRef}
          style={{
            width: 700,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--hairline)",
            backgroundColor: "var(--canvas)",
          }}
        >
          {/* Sticky filter bar */}
          <div style={{
            position: "sticky", top: 0, zIndex: 100,
            backgroundColor: "rgba(251,251,252,0.97)", backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--hairline)",
            padding: "14px 24px",
            flexShrink: 0,
          }}>
            {/* Page title + count */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h1 style={{
                  fontSize: 16, fontWeight: 600, color: "var(--ink)",
                  letterSpacing: "-0.015em", lineHeight: 1.2, margin: "0 0 2px",
                }}>
                  {categoryLabel ? `${categoryLabel}` : "Établissements beauté"}
                  {cityId ? ` à ${cityLabel}` : " au Maroc"}
                </h1>
                <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}>
                  {loading ? "Chargement…" : `${allResults.length} résultat${allResults.length !== 1 ? "s" : ""}`}
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
                    fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", fontFamily: "var(--font)",
                  }}
                >
                  <X size={10} />Réinitialiser
                </button>
              )}
            </div>

            {/* Filter selects */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <NiceSelect options={SERVICE_CATEGORIES} value={categoryId || "all"} onChange={id => setCategoryId(id === "all" ? "" : id)} placeholder="Catégorie" />
              </div>
              <div style={{ flex: 1 }}>
                <NiceSelect options={CITY_OPTIONS} value={cityId} onChange={v => { setCityId(v); setUserCoords(null); }} placeholder="Toutes les villes" searchable />
              </div>
              <div style={{ width: 130, flexShrink: 0 }}>
                <NiceSelect options={SORT_OPTIONS} value={sortId} onChange={setSortId} placeholder="Trier" />
              </div>
              <button
                onClick={handleLocateMe}
                disabled={geoLoading}
                title="Rechercher près de moi"
                style={{
                  flexShrink: 0, height: 34, paddingInline: 10,
                  border: `1px solid ${userCoords ? "#2563EB" : "var(--hairline)"}`,
                  borderRadius: 8, cursor: geoLoading ? "wait" : "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                  backgroundColor: userCoords ? "rgba(37,99,235,0.08)" : "transparent",
                  fontSize: 12, fontWeight: 600,
                  color: userCoords ? "#2563EB" : "var(--ink-tertiary)",
                  fontFamily: "var(--font)", transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!userCoords) e.currentTarget.style.borderColor = "#2563EB"; }}
                onMouseLeave={e => { if (!userCoords) e.currentTarget.style.borderColor = "var(--hairline)"; }}
              >
                <LocateFixed size={13} />
                {geoLoading ? "…" : "Près de moi"}
              </button>
            </div>
          </div>

          {/* Cards */}
          <div style={{ padding: "16px 24px 8px", flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Skeletons */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
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
                  {results.map(provider => (
                    <ResultCard
                      key={provider.id}
                      provider={provider}
                      isSelected={selectedId === provider.id}
                      onHover={() => setSelectedId(provider.id)}
                      onLeave={() => setSelectedId(null)}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Empty state */}
            {!loading && results.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingBlock: 64 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(12,12,14,0.04)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <MapPin size={20} color="var(--ink-tertiary)" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 6px" }}>Aucun résultat</h3>
                <p style={{ fontSize: 13, color: "var(--ink-tertiary)", maxWidth: 220, margin: 0 }}>Modifiez vos critères de recherche.</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <Pagination page={page} totalPages={totalPages} onPage={goPage} />
            )}
          </div>

        </div>

        {/* ── RIGHT PANEL — sticky map ── */}
        <div style={{
          flex: 1,
          position: "sticky",
          top: 0,
          height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          alignSelf: "flex-start",
        }}>
          {/* Tile mode toggle */}
          <div style={{
            position: "absolute", top: 16, left: 16, zIndex: 800,
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
              position: "absolute", top: 16, right: 16, zIndex: 800,
              backgroundColor: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
              borderRadius: 9999, border: "1px solid var(--hairline)",
              paddingInline: 12, height: 34,
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "var(--ink)", display: "inline-block" }} />
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
        </div>
      </div>

      {/* Full-width footer below both columns */}
      <Footer />
    </div>
  );
}
