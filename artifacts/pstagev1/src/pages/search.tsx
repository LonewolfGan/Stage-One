import {
  useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import { useSearch, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapContainer, TileLayer, Marker, Popup,
  useMap, ZoomControl, CircleMarker,
} from "react-leaflet";
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
  Map, X, Calendar, Search, LocateFixed,
  LayoutGrid, List, Compass, CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const CITY_OPTIONS = [
  { id: "", label: "Toutes les villes" },
  ...MOROCCO_CITIES.map(c => ({ id: c, label: c })),
];
const PER_PAGE = 9;
const TOPBAR_H = 56; // px — hauteur de la TopBar

/* ─────────────────────────────────────────────
   Map tiles
───────────────────────────────────────────── */
const CARTO_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

/* ─────────────────────────────────────────────
   Map pin factory
───────────────────────────────────────────── */
function makePin(selected: boolean, price?: string) {
  if (price && !selected) {
    return L.divIcon({
      className: "",
      html: `<div style="
        padding:4px 10px;border-radius:20px;
        background:#0C0C0E;color:#fff;
        font-size:11px;font-weight:600;
        font-family:'Inter',sans-serif;letter-spacing:-0.01em;
        white-space:nowrap;border:1.5px solid rgba(255,255,255,0.18);
        cursor:pointer;
      ">${price}</div>`,
      iconSize: [undefined as unknown as number, 28],
      iconAnchor: [36, 14],
      popupAnchor: [0, -18],
    });
  }
  const bg = selected ? "#D4466E" : "#0C0C0E";
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${bg};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#fff"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
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
      { padding: [64, 64], animate: true },
    );
  }, [providers.map(p => p.id).join(",")]);
  return null;
}

/* ─────────────────────────────────────────────
   User location dot
───────────────────────────────────────────── */
function UserDot({ coords }: { coords: { lat: number; lng: number } | null }) {
  if (!coords) return null;
  return (
    <CircleMarker
      center={[coords.lat, coords.lng]}
      radius={9}
      pathOptions={{ color: "#D4466E", fillColor: "#D4466E", fillOpacity: 0.22, weight: 2 }}
    />
  );
}

/* ─────────────────────────────────────────────
   Stars
───────────────────────────────────────────── */
function Stars({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1.5, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} style={{
          fill: i <= Math.round(rating) ? "var(--rating)" : "transparent",
          color: "var(--rating)",
          flexShrink: 0,
        }} />
      ))}
    </span>
  );
}

/* ─────────────────────────────────────────────
   ResultCard — List view
───────────────────────────────────────────── */
function ResultCardList({
  provider, isSelected, onHover, onLeave, index,
}: {
  provider: Provider; isSelected: boolean;
  onHover: () => void; onLeave: () => void; index: number;
}) {
  const [, nav] = useLocation();
  const [hov, setHov] = useState(false);
  const catLabel = SERVICE_CATEGORIES.find(c => c.id === provider.category)?.label ?? provider.category;
  const minPrice = provider.minPriceCents != null
    ? provider.minPriceCents / 100
    : provider.services.length > 0
      ? Math.min(...provider.services.map(s => s.priceCents)) / 100
      : null;
  const active = isSelected || hov;
  const nextSlot = getNextAvailable(provider);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => { setHov(true); onHover(); }}
      onMouseLeave={() => { setHov(false); onLeave(); }}
      onClick={() => nav(`/${provider.slug}`)}
      style={{
        display: "flex",
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${active ? "rgba(12,12,14,0.18)" : "rgba(12,12,14,0.08)"}`,
        backgroundColor: active ? "rgba(12,12,14,0.012)" : "#FFFFFF",
        cursor: "pointer",
        transition: "border-color 200ms ease, background-color 200ms ease",
        minHeight: 136,
      }}
    >
      {/* Photo */}
      <div style={{ width: 168, flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <img
          src={provider.photos[0] || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80"}
          alt={provider.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            transform: hov ? "scale(1.04)" : "scale(1)",
            transition: "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 40%, rgba(10,10,15,0.54) 100%)",
          pointerEvents: "none",
        }} />
        {provider.isPopular && (
          <span style={{
            position: "absolute", top: 9, left: 9,
            height: 18, paddingInline: 7,
            display: "inline-flex", alignItems: "center",
            background: "#fff", borderRadius: 9999,
            fontSize: 9, fontWeight: 700, color: "var(--ink)",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            Top
          </span>
        )}
        {minPrice != null && (
          <span style={{
            position: "absolute", bottom: 9, left: 9,
            height: 20, paddingInline: 7,
            display: "inline-flex", alignItems: "center",
            background: "rgba(10,10,15,0.68)", backdropFilter: "blur(8px)",
            borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#fff",
            letterSpacing: "-0.01em",
          }}>
            dès {minPrice} MAD
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1, minWidth: 0,
        padding: "14px 16px 12px",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
          <h3 style={{
            fontSize: 15, fontWeight: 600, color: "var(--ink)",
            letterSpacing: "-0.015em", lineHeight: 1.2, margin: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {provider.name}
          </h3>
          {provider.isVerified && (
            <CheckCircle2 size={12} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: "var(--ink-tertiary)",
          letterSpacing: "0.05em", textTransform: "uppercase",
          marginBottom: 8,
        }}>
          {catLabel}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Stars rating={provider.rating} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{provider.rating}</span>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>({provider.reviewCount})</span>
          <span style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--ink-disabled)", flexShrink: 0 }} />
          <MapPin size={10} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
            {provider.city}
            {provider.distanceKm != null && (
              <span style={{ color: "var(--ink-secondary)", fontWeight: 500 }}>
                {" · "}
                {provider.distanceKm < 1
                  ? `${Math.round(provider.distanceKm * 1000)} m`
                  : `${provider.distanceKm} km`}
              </span>
            )}
          </span>
        </div>

        {/* Services chips */}
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
          {provider.services.slice(0, 3).map(s => (
            <span key={s.id} style={{
              fontSize: 11, fontWeight: 500, color: "var(--ink-secondary)",
              background: "rgba(12,12,14,0.04)",
              border: "1px solid rgba(12,12,14,0.08)",
              paddingInline: 7, paddingBlock: 3, borderRadius: 5,
              whiteSpace: "nowrap",
            }}>
              {s.name}
            </span>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 11, color: "var(--ink-tertiary)", flex: 1,
          }}>
            <Calendar size={10} />
            <span>{nextSlot}</span>
          </div>
          <motion.button
            onClick={e => { e.stopPropagation(); nav(`/booking/${provider.slug}`); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              height: 30, paddingInline: 14,
              background: "var(--ink)", color: "#fff",
              fontSize: 11, fontWeight: 600, letterSpacing: "-0.01em",
              border: "none", borderRadius: 8, cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            Réserver
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────────
   ResultCard — Grid view
───────────────────────────────────────────── */
function ResultCardGrid({
  provider, isSelected, onHover, onLeave, index,
}: {
  provider: Provider; isSelected: boolean;
  onHover: () => void; onLeave: () => void; index: number;
}) {
  const [, nav] = useLocation();
  const [hov, setHov] = useState(false);
  const catLabel = SERVICE_CATEGORIES.find(c => c.id === provider.category)?.label ?? provider.category;
  const minPrice = provider.minPriceCents != null
    ? provider.minPriceCents / 100
    : provider.services.length > 0
      ? Math.min(...provider.services.map(s => s.priceCents)) / 100
      : null;
  const nextSlot = getNextAvailable(provider);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => { setHov(true); onHover(); }}
      onMouseLeave={() => { setHov(false); onLeave(); }}
      onClick={() => nav(`/${provider.slug}`)}
      style={{
        borderRadius: 14, overflow: "hidden",
        border: `1px solid ${(isSelected || hov) ? "rgba(12,12,14,0.18)" : "rgba(12,12,14,0.08)"}`,
        backgroundColor: "#fff", cursor: "pointer",
        transition: "border-color 200ms ease",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
        <img
          src={provider.photos[0] || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80"}
          alt={provider.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            transform: hov ? "scale(1.05)" : "scale(1)",
            transition: "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 45%, rgba(10,10,15,0.65) 100%)",
          pointerEvents: "none",
        }} />
        {provider.isPopular && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            height: 18, paddingInline: 7, display: "inline-flex", alignItems: "center",
            background: "#fff", borderRadius: 9999,
            fontSize: 9, fontWeight: 700, color: "var(--ink)",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            Top
          </span>
        )}
        <div style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
          <p style={{
            fontSize: 14, fontWeight: 600, color: "#fff",
            letterSpacing: "-0.015em", margin: 0, lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {provider.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
            <Stars rating={provider.rating} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{provider.rating}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>({provider.reviewCount})</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)",
            letterSpacing: "0.05em", textTransform: "uppercase",
          }}>
            {catLabel}
          </span>
          {minPrice != null && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              dès {minPrice} MAD
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={10} color="var(--ink-tertiary)" />
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{provider.city}</span>
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--ink-tertiary)" }}>
            <Calendar size={10} />
            <span>{nextSlot}</span>
          </div>
          <motion.button
            onClick={e => { e.stopPropagation(); nav(`/booking/${provider.slug}`); }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              height: 28, paddingInline: 12,
              background: "var(--ink)", color: "#fff",
              fontSize: 11, fontWeight: 600,
              border: "none", borderRadius: 7, cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            Réserver
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────── */
function SkeletonList() {
  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(12,12,14,0.08)", overflow: "hidden", display: "flex", height: 136 }}>
      <div className="skeleton" style={{ width: 168, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="skeleton" style={{ width: "52%", height: 14, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: "28%", height: 10, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: "68%", height: 10, borderRadius: 4 }} />
        <div style={{ marginTop: "auto", display: "flex", gap: 6 }}>
          <div className="skeleton" style={{ width: 58, height: 20, borderRadius: 5 }} />
          <div className="skeleton" style={{ width: 68, height: 20, borderRadius: 5 }} />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(12,12,14,0.08)", overflow: "hidden" }}>
      <div className="skeleton" style={{ aspectRatio: "4/3", width: "100%" }} />
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton" style={{ width: "48%", height: 10, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: "66%", height: 10, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: "36%", height: 10, borderRadius: 4 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Pagination
───────────────────────────────────────────── */
function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  if (total <= 1) return null;
  const base: React.CSSProperties = {
    height: 32, minWidth: 32, paddingInline: 8, borderRadius: 8,
    border: "1px solid rgba(12,12,14,0.10)", backgroundColor: "#fff",
    fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)",
    cursor: "pointer", display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: 4, transition: "all 0.15s ease",
    fontFamily: "var(--font)", letterSpacing: "-0.01em",
  };
  const active: React.CSSProperties = { ...base, background: "var(--ink)", borderColor: "var(--ink)", color: "#fff", fontWeight: 600 };
  const dis: React.CSSProperties = { ...base, opacity: 0.3, cursor: "not-allowed" };

  const pages: (number | "…")[] = [];
  if (total <= 7) for (let i = 1; i <= total; i++) pages.push(i);
  else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "24px 0 8px" }}>
      <button disabled={page === 1} onClick={() => onPage(page - 1)} style={page === 1 ? dis : base}>
        <ChevronLeft size={13} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} style={{ ...base, border: "none", background: "transparent", cursor: "default", color: "var(--ink-tertiary)" }}>…</span>
        ) : (
          <button key={p} onClick={() => onPage(p as number)} style={p === page ? active : base}>{p}</button>
        )
      )}
      <button disabled={page === total} onClick={() => onPage(page + 1)} style={page === total ? dis : base}>
        <ChevronRight size={13} />
      </button>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Empty state
───────────────────────────────────────────── */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", paddingBlock: 80, paddingInline: 24,
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "rgba(12,12,14,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18,
      }}>
        <Compass size={22} color="var(--ink-tertiary)" strokeWidth={1.5} />
      </div>
      <h3 style={{
        fontSize: 17, fontWeight: 600, color: "var(--ink)",
        letterSpacing: "-0.02em", margin: "0 0 8px",
      }}>
        Aucun résultat
      </h3>
      <p style={{
        fontSize: 13, color: "var(--ink-tertiary)",
        maxWidth: 280, margin: "0 0 22px", lineHeight: 1.55,
      }}>
        Essayez d'élargir la recherche ou de modifier les filtres.
      </p>
      <button
        onClick={onReset}
        style={{
          height: 36, paddingInline: 20,
          background: "var(--ink)", color: "#fff",
          fontSize: 12, fontWeight: 600, letterSpacing: "-0.01em",
          border: "none", borderRadius: 9, cursor: "pointer",
          fontFamily: "var(--font)",
        }}
      >
        Réinitialiser les filtres
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Category tab pills
───────────────────────────────────────────── */
const CATS = [
  { id: "", label: "Tout" },
  { id: "coiffeur", label: "Coiffeur" },
  { id: "barbier", label: "Barbier" },
  { id: "manucure", label: "Manucure" },
  { id: "beaute", label: "Institut beauté" },
  { id: "bien-etre", label: "Bien-être" },
  { id: "maquillage", label: "Maquillage" },
  { id: "epilation", label: "Épilation" },
  { id: "soin", label: "Soins visage" },
];

function CategoryTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{
      display: "flex", gap: 6, overflowX: "auto", flexShrink: 0,
      scrollbarWidth: "none", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
    }}>
      {CATS.map(cat => {
        const active = cat.id === value || (cat.id === "" && !value);
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            style={{
              flexShrink: 0, height: 30, paddingInline: 14,
              borderRadius: 9999,
              border: `1px solid ${active ? "var(--ink)" : "rgba(12,12,14,0.10)"}`,
              background: active ? "var(--ink)" : "transparent",
              color: active ? "#fff" : "var(--ink-secondary)",
              fontSize: 12, fontWeight: active ? 600 : 500,
              cursor: "pointer", fontFamily: "var(--font)",
              transition: "all 160ms ease", letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Map view (shared mobile / desktop)
───────────────────────────────────────────── */
function MapView({
  providers, selectedId, setSelectedId,
  userCoords, defaultCenter, navigate, instanceKey,
}: {
  providers: Provider[]; selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  userCoords: { lat: number; lng: number } | null;
  defaultCenter: [number, number]; navigate: (path: string) => void;
  instanceKey: string;
}) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Result badge */}
      {providers.length > 0 && (
        <div style={{
          position: "absolute", top: 12, right: 12, zIndex: 800,
          background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
          borderRadius: 9999, border: "1px solid rgba(12,12,14,0.10)",
          paddingInline: 12, height: 30,
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, fontWeight: 500, color: "var(--ink-secondary)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink)", display: "inline-block" }} />
          {providers.length} résultat{providers.length > 1 ? "s" : ""}
        </div>
      )}

      <MapContainer
        key={instanceKey}
        center={defaultCenter} zoom={6}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false} attributionControl={false}
        scrollWheelZoom={true}
      >
        <ZoomControl position="bottomright" />
        <TileLayer url={CARTO_LIGHT} attribution="© CARTO" />
        <MapFlyTo providers={providers} />
        <UserDot coords={userCoords} />
        {providers.map(p => {
          const minPrice = p.minPriceCents != null
            ? `${Math.round(p.minPriceCents / 100)} MAD`
            : p.services.length > 0
              ? `${Math.round(Math.min(...p.services.map(s => s.priceCents)) / 100)} MAD`
              : undefined;
          return (
            <Marker
              key={p.id}
              position={[p.latitude!, p.longitude!]}
              icon={makePin(selectedId === p.id, minPrice)}
              eventHandlers={{
                click: () => setSelectedId(selectedId === p.id ? null : p.id),
                mouseover: () => setSelectedId(p.id),
                mouseout: () => setSelectedId(null),
              }}
            >
              <Popup closeButton={false} offset={[0, -20]}>
                <div
                  onClick={() => navigate(`/${p.slug}`)}
                  style={{
                    width: 210, cursor: "pointer",
                    fontFamily: "var(--font)", borderRadius: 12, overflow: "hidden",
                  }}
                >
                  <img src={p.photos[0]} alt={p.name} style={{ width: "100%", height: 96, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "10px 12px" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 3px", letterSpacing: "-0.01em" }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: "0 0 6px" }}>{p.city}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Stars rating={p.rating} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>{p.rating}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>({p.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function SearchPage() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(searchString);
  const { isMobile, isLg } = useBreakpoint();

  /* ── filter bar height measurement (for sticky map offset) ── */
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [filterBarH, setFilterBarH] = useState(140);
  useEffect(() => {
    const el = filterBarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFilterBarH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── State ── */
  const [q, setQ] = useState(params.get("q") || "");
  const [categoryId, setCategoryId] = useState(params.get("category") || "");
  const [cityId, setCityId] = useState(params.get("city") || "");
  const [sortId, setSortId] = useState("relevance");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageDir, setPageDir] = useState<1 | -1>(1);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  /* ── Data ── */
  const { data: rawProviders, isLoading: apiLoading } = useQuery({
    queryKey: ["providers", cityId, userCoords?.lat, userCoords?.lng],
    queryFn: () => api.searchProviders({
      city: userCoords ? undefined : (cityId || undefined),
      lat: userCoords?.lat, lng: userCoords?.lng, radius: 25,
    }),
    staleTime: 30_000,
  });

  useEffect(() => { setLoading(apiLoading); }, [apiLoading]);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [categoryId, cityId, q]);

  /* Sync URL */
  useEffect(() => {
    const p = new URLSearchParams();
    if (categoryId) p.set("category", categoryId);
    if (cityId) p.set("city", cityId);
    if (q) p.set("q", q);
    navigate(`/search?${p.toString()}`, { replace: true });
    setPage(1);
  }, [categoryId, cityId, q]);

  /* ── Derived data ── */
  const adaptedProviders = adaptProviderList(rawProviders ?? []);
  const allResults = useMemo(() => {
    const sq = q.toLowerCase().trim();
    return adaptedProviders
      .filter(p => {
        if (sq) {
          const hit = p.name.toLowerCase().includes(sq)
            || p.services.some(s => s.name.toLowerCase().includes(sq))
            || p.city.toLowerCase().includes(sq)
            || (SERVICE_CATEGORIES.find(c => c.id === p.category)?.label ?? "").toLowerCase().includes(sq);
          if (!hit) return false;
        }
        if (categoryId && categoryId !== "all" && p.category !== categoryId) return false;
        if (!userCoords && cityId && p.city.toLowerCase() !== cityId.toLowerCase()) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortId === "nearest") return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
        if (sortId === "rating") return b.rating - a.rating;
        if (sortId === "price-asc") return (a.minPriceCents ?? Infinity) - (b.minPriceCents ?? Infinity);
        if (sortId === "price-desc") return (b.minPriceCents ?? 0) - (a.minPriceCents ?? 0);
        return 0;
      });
  }, [adaptedProviders, q, categoryId, cityId, userCoords, sortId]);

  const totalPages = Math.ceil(allResults.length / PER_PAGE);
  const results = allResults.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const mapProviders = results.filter(p => p.latitude && p.longitude);
  const defaultCenter: [number, number] =
    mapProviders.length > 0
      ? [mapProviders[0].latitude!, mapProviders[0].longitude!]
      : [31.7917, -7.0926];

  const hasFilters = !!(categoryId || cityId || userCoords || q);
  const categoryLabel = SERVICE_CATEGORIES.find(c => c.id === categoryId)?.label || null;

  const goPage = useCallback((p: number) => {
    setPageDir(p > page ? 1 : -1);
    setPage(p);
    window.scrollTo({ top: TOPBAR_H + filterBarH, behavior: "smooth" });
  }, [page, filterBarH]);

  const resetFilters = useCallback(() => {
    setQ(""); setCategoryId(""); setCityId("");
    setSortId("relevance"); setUserCoords(null);
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortId("nearest"); setCityId(""); setPage(1); setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 10000 },
    );
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({ y: dir > 0 ? 14 : -14, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? -14 : 14, opacity: 0 }),
  };

  /* ──────────────────────────────────────────────
     FILTER BAR (full-width, sticky under TopBar)
  ────────────────────────────────────────────── */
  const filterBar = (
    <div
      ref={filterBarRef}
      style={{
        position: "sticky",
        top: TOPBAR_H,
        zIndex: 100,
        background: "rgba(251,251,252,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(12,12,14,0.08)",
      }}
    >
      {/* Row 1 — controls */}
      <div style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: 8 }}>
        {/* Search */}
        <div style={{ position: "relative", flex: isMobile ? 1 : "0 0 320px", minWidth: 0 }}>
          <Search size={13} style={{
            position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
            color: "var(--ink-tertiary)", pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="Salon, prestation, ville…"
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            style={{
              width: "100%", height: 36,
              paddingLeft: 32, paddingRight: q ? 32 : 12,
              background: "rgba(12,12,14,0.04)",
              border: "1px solid rgba(12,12,14,0.10)",
              borderRadius: 9, outline: "none",
              fontSize: 13, color: "var(--ink)",
              fontFamily: "var(--font)", transition: "border-color 160ms ease, background 160ms ease",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "rgba(12,12,14,0.24)";
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "rgba(12,12,14,0.10)";
              e.currentTarget.style.background = "rgba(12,12,14,0.04)";
            }}
          />
          {q && (
            <button onClick={() => setQ("")} style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)",
              display: "flex", alignItems: "center", padding: 2,
            }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Divider */}
        {!isMobile && (
          <div style={{ width: 1, height: 20, background: "rgba(12,12,14,0.10)", flexShrink: 0 }} />
        )}

        {/* City */}
        {!isMobile && (
          <div style={{ width: 148, flexShrink: 0 }}>
            <NiceSelect
              options={CITY_OPTIONS}
              value={cityId}
              onChange={v => { setCityId(v); setUserCoords(null); }}
              placeholder="Ville"
              searchable
            />
          </div>
        )}

        {/* Sort */}
        {!isMobile && (
          <div style={{ width: 158, flexShrink: 0 }}>
            <NiceSelect options={SORT_OPTIONS} value={sortId} onChange={setSortId} placeholder="Trier par" />
          </div>
        )}

        {/* Spacer */}
        {!isMobile && <div style={{ flex: 1 }} />}

        {/* Mobile filters btn */}
        {isMobile && (
          <button
            onClick={() => setMobileFilterOpen(x => !x)}
            style={{
              flexShrink: 0, height: 36, paddingInline: 12,
              border: `1px solid ${hasFilters ? "var(--ink)" : "rgba(12,12,14,0.10)"}`,
              background: hasFilters ? "var(--ink)" : "transparent",
              borderRadius: 9, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 12, fontWeight: 600,
              color: hasFilters ? "#fff" : "var(--ink-secondary)",
              fontFamily: "var(--font)", transition: "all 160ms ease",
            }}
          >
            <SlidersHorizontal size={13} />
            Filtres
          </button>
        )}

        {/* Locate me */}
        <button
          onClick={handleLocateMe}
          disabled={geoLoading}
          title="Résultats près de moi"
          style={{
            flexShrink: 0, width: 36, height: 36,
            border: `1px solid ${userCoords ? "var(--ink)" : "rgba(12,12,14,0.10)"}`,
            borderRadius: 9, cursor: geoLoading ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: userCoords ? "var(--ink)" : "transparent",
            color: userCoords ? "#fff" : "var(--ink-tertiary)",
            transition: "all 160ms ease",
          }}
          onMouseEnter={e => { if (!userCoords) { e.currentTarget.style.borderColor = "var(--ink)"; } }}
          onMouseLeave={e => { if (!userCoords) { e.currentTarget.style.borderColor = "rgba(12,12,14,0.10)"; } }}
        >
          <LocateFixed size={14} />
        </button>

        {/* View toggle (desktop only) */}
        {!isMobile && (
          <div style={{
            display: "flex", gap: 2,
            background: "rgba(12,12,14,0.04)",
            borderRadius: 8, padding: 2, flexShrink: 0,
          }}>
            {([["list", List], ["grid", LayoutGrid]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: viewMode === mode ? "#fff" : "transparent",
                  color: viewMode === mode ? "var(--ink)" : "var(--ink-tertiary)",
                  transition: "all 140ms ease",
                  border: `1px solid ${viewMode === mode ? "rgba(12,12,14,0.10)" : "transparent"}`,
                }}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        )}

        {/* Reset */}
        {hasFilters && !isMobile && (
          <button
            onClick={resetFilters}
            style={{
              flexShrink: 0, height: 36, paddingInline: 10,
              border: "1px solid rgba(12,12,14,0.10)", borderRadius: 9,
              background: "transparent", cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)",
              fontFamily: "var(--font)", transition: "all 140ms ease",
              display: "flex", alignItems: "center", gap: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.borderColor = "rgba(12,12,14,0.24)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-tertiary)"; e.currentTarget.style.borderColor = "rgba(12,12,14,0.10)"; }}
          >
            <X size={10} />
            Réinit.
          </button>
        )}
      </div>

      {/* Row 2 — category tabs */}
      <div style={{ paddingInline: 24, paddingBottom: 10 }}>
        <CategoryTabs value={categoryId} onChange={v => { setCategoryId(v); setPage(1); }} />
      </div>

      {/* Row 3 — result count + active filter chips */}
      <div style={{
        paddingInline: 24, paddingBottom: 10,
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12, color: "var(--ink-tertiary)", letterSpacing: "-0.01em", flexShrink: 0 }}>
          {loading ? (
            <span className="skeleton" style={{ width: 80, height: 12, borderRadius: 4, display: "inline-block" }} />
          ) : (
            <>
              <strong style={{ color: "var(--ink-secondary)", fontWeight: 600 }}>{allResults.length}</strong>
              {" "}établissement{allResults.length !== 1 ? "s" : ""}
              {categoryLabel && <span> · {categoryLabel}</span>}
              {cityId && <span> à {cityId}</span>}
            </>
          )}
        </span>
        {categoryId && categoryLabel && (
          <button onClick={() => setCategoryId("")} style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            height: 20, paddingInline: "7px 5px", borderRadius: 9999,
            background: "var(--ink)", border: "none",
            fontSize: 10, fontWeight: 600, color: "#fff",
            fontFamily: "var(--font)", cursor: "pointer",
          }}>
            {categoryLabel} <X size={8} />
          </button>
        )}
        {cityId && (
          <button onClick={() => setCityId("")} style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            height: 20, paddingInline: "7px 5px", borderRadius: 9999,
            background: "var(--ink)", border: "none",
            fontSize: 10, fontWeight: 600, color: "#fff",
            fontFamily: "var(--font)", cursor: "pointer",
          }}>
            {cityId} <X size={8} />
          </button>
        )}
        {userCoords && (
          <button onClick={() => { setUserCoords(null); setSortId("relevance"); }} style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            height: 20, paddingInline: "7px 5px", borderRadius: 9999,
            background: "var(--ink)", border: "none",
            fontSize: 10, fontWeight: 600, color: "#fff",
            fontFamily: "var(--font)", cursor: "pointer",
          }}>
            Près de moi <X size={8} />
          </button>
        )}
      </div>

      {/* Mobile expanded filters */}
      <AnimatePresence>
        {isMobile && mobileFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(12,12,14,0.08)" }}
          >
            <div style={{ padding: "12px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <NiceSelect
                    options={CITY_OPTIONS}
                    value={cityId}
                    onChange={v => { setCityId(v); setUserCoords(null); setMobileFilterOpen(false); }}
                    placeholder="Ville"
                    searchable
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <NiceSelect
                    options={SORT_OPTIONS}
                    value={sortId}
                    onChange={v => { setSortId(v); setMobileFilterOpen(false); }}
                    placeholder="Trier"
                  />
                </div>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { resetFilters(); setMobileFilterOpen(false); }}
                  style={{
                    height: 36, width: "100%",
                    border: "1px solid rgba(12,12,14,0.10)", borderRadius: 9,
                    background: "transparent", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, color: "var(--ink-tertiary)",
                    fontFamily: "var(--font)", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 4,
                  }}
                >
                  <X size={11} />Réinitialiser tous les filtres
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ──────────────────────────────────────────────
     RESULTS content
  ────────────────────────────────────────────── */
  const resultsContent = (
    <>
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Array(6).fill(0).map((_, i) => <SkeletonGrid key={i} />)}
            </div>
          ) : (
            Array(4).fill(0).map((_, i) => <SkeletonList key={i} />)
          )}
        </div>
      )}

      {!loading && results.length > 0 && (
        <AnimatePresence mode="wait" custom={pageDir}>
          <motion.div
            key={`${page}-${viewMode}`}
            custom={pageDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={viewMode === "grid" ? {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 10,
            } : {
              display: "flex", flexDirection: "column", gap: 8,
            }}
          >
            {results.map((p, i) =>
              viewMode === "grid" ? (
                <ResultCardGrid key={p.id} provider={p} isSelected={selectedId === p.id}
                  onHover={() => setSelectedId(p.id)} onLeave={() => setSelectedId(null)} index={i} />
              ) : (
                <ResultCardList key={p.id} provider={p} isSelected={selectedId === p.id}
                  onHover={() => setSelectedId(p.id)} onLeave={() => setSelectedId(null)} index={i} />
              )
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {!loading && results.length === 0 && <EmptyState onReset={resetFilters} />}

      {!loading && totalPages > 1 && (
        <Pagination page={page} total={totalPages} onPage={goPage} />
      )}
    </>
  );

  /* ══════════════════════════════════════════════
     MOBILE LAYOUT
  ══════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
        <TopBar />
        {filterBar}

        {/* Results */}
        <div style={{ flex: 1, padding: "12px 20px 100px" }}>
          {resultsContent}
        </div>

        {/* Bottom sheet map */}
        <AnimatePresence>
          {mobileMapOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.48)" }}
              onClick={() => setMobileMapOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "75dvh", borderRadius: "20px 20px 0 0",
                  overflow: "hidden", background: "#fff",
                }}
              >
                <div style={{
                  position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
                  zIndex: 10, width: 36, height: 4, borderRadius: 9999,
                  background: "rgba(12,12,14,0.12)",
                }} />
                <button
                  onClick={() => setMobileMapOpen(false)}
                  style={{
                    position: "absolute", top: 12, right: 12, zIndex: 801,
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(255,255,255,0.96)",
                    border: "1px solid rgba(12,12,14,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={13} color="var(--ink)" />
                </button>
                <MapView
                  providers={mapProviders} selectedId={selectedId} setSelectedId={setSelectedId}
                  userCoords={userCoords} defaultCenter={defaultCenter}
                  navigate={navigate} instanceKey="mobile-map"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Voir la carte */}
        <motion.button
          onClick={() => setMobileMapOpen(true)}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            zIndex: 150, height: 44, paddingInline: 22,
            background: "var(--ink)", color: "#fff",
            border: "none", borderRadius: 9999,
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em",
            fontFamily: "var(--font)", cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          <Map size={14} />
          Voir la carte
          {mapProviders.length > 0 && (
            <span style={{
              background: "rgba(255,255,255,0.2)", borderRadius: 9999,
              paddingInline: 6, paddingBlock: 2, fontSize: 11, fontWeight: 700,
            }}>
              {mapProviders.length}
            </span>
          )}
        </motion.button>

        <Footer />
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     DESKTOP LAYOUT
     ─────────────────────────────────────────────
     Structure :
       TopBar (sticky, top: 0, full width)
       FilterBar (sticky, top: 56px, full width)   ← ref measured
       Two-column flex:
         Left — results (scrollable naturally)
         Right — map (sticky, top: 56 + filterBarH)
       Footer (full width)
  ══════════════════════════════════════════════ */
  const mapStickyTop = TOPBAR_H + filterBarH;
  const mapHeight = `calc(100vh - ${mapStickyTop}px)`;
  const listWidth = isLg ? 640 : 500;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--canvas)" }}>
      {/* ① TopBar */}
      <TopBar />

      {/* ② Filter bar — full width, sticky under TopBar */}
      {filterBar}

      {/* ③ Two-column content */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>

        {/* LEFT — Results list */}
        <div
          style={{
            width: listWidth,
            flexShrink: 0,
            padding: "16px 20px 48px",
            borderRight: "1px solid rgba(12,12,14,0.06)",
          }}
        >
          {resultsContent}
        </div>

        {/* RIGHT — Sticky map */}
        <div
          style={{
            flex: 1,
            position: "sticky",
            top: mapStickyTop,
            height: mapHeight,
            overflow: "hidden",
          }}
        >
          <MapView
            providers={mapProviders} selectedId={selectedId} setSelectedId={setSelectedId}
            userCoords={userCoords} defaultCenter={defaultCenter}
            navigate={navigate} instanceKey="desktop-map"
          />
        </div>
      </div>

      {/* ④ Footer */}
      <Footer />
    </div>
  );
}
