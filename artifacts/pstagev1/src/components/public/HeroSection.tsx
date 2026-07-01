import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, ChevronDown, Tag } from "lucide-react";
import { MOROCCO_CITIES, SERVICE_CATEGORIES } from "@/lib/cities";
import { useIsMobile } from "@/hooks/use-mobile";

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

export function HeroSection() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [cityId, setCityId] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const isMobile = useIsMobile();

  const catRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useClickOutside(catRef, () => setCatOpen(false));
  useClickOutside(cityRef, () => { setCityOpen(false); setCityQuery(""); });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (categoryId !== "all") params.set("category", categoryId);
    if (cityId) params.set("city", cityId);
    setLocation(`/search?${params.toString()}`);
  };

  const selectedCat = SERVICE_CATEGORIES.find(c => c.id === categoryId)!;
  const filteredCities = cityQuery
    ? MOROCCO_CITIES.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()))
    : MOROCCO_CITIES;

  return (
    <section
      style={{
        backgroundColor: "var(--canvas)",
        paddingTop: isMobile ? 72 : 96,
        paddingBottom: isMobile ? 80 : 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* ── Headline ── */}
      <h1
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontSize: isMobile ? "clamp(36px, 10vw, 52px)" : "clamp(52px, 6.5vw, 84px)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          color: "var(--ink)",
          maxWidth: 900,
          margin: "0 auto 32px",
          paddingInline: 20,
          wordBreak: "keep-all",
          hyphens: "none",
        }}
      >
        {"Votre prochain rendez\u2011vous beauté sans attendre"}
      </h1>

      {/* ── Search console ── */}
      <div
        style={{
          width: "100%",
          maxWidth: isMobile ? "calc(100% - 32px)" : 760,
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--radius-panel)",
          marginBottom: isMobile ? 40 : 80,
          marginInline: "auto",
        }}
      >
        {isMobile ? (
          /* ── Mobile: stacked layout ── */
          <div style={{ display: "flex", flexDirection: "column" }}>

            {/* Category row */}
            <div ref={catRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => { setCatOpen(v => !v); setCityOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  height: 52,
                  paddingInline: 16,
                  fontSize: 14,
                  fontWeight: 500,
                  color: categoryId === "all" ? "var(--ink-tertiary)" : "var(--ink)",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--hairline)",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  textAlign: "left",
                }}
              >
                <Tag size={14} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>
                  {categoryId === "all" ? "Catégorie" : selectedCat.label}
                </span>
                <ChevronDown
                  size={14}
                  color="var(--ink-tertiary)"
                  style={{ transition: "transform var(--ease)", transform: catOpen ? "rotate(180deg)" : "none" }}
                />
              </button>
              {catOpen && (
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
                  }}
                >
                  {SERVICE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setCategoryId(cat.id); setCatOpen(false); }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 16px",
                        fontSize: 14,
                        fontWeight: categoryId === cat.id ? 600 : 400,
                        color: categoryId === cat.id ? "var(--accent)" : "var(--ink-secondary)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font)",
                        transition: "background-color var(--ease-fast)",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,12,14,0.04)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City row */}
            <div ref={cityRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => { setCityOpen(v => !v); setCatOpen(false); }}
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

            {/* Input + search button row */}
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
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* ── Desktop: inline row layout ── */
          <div style={{ display: "flex", alignItems: "center", height: 54, gap: 0 }}>

            {/* ── Category dropdown ── */}
            <div ref={catRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { setCatOpen(v => !v); setCityOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 54,
                  paddingInline: "14px 10px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: categoryId === "all" ? "var(--ink-tertiary)" : "var(--ink)",
                  background: "transparent",
                  border: "none",
                  borderRight: "1px solid var(--hairline)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font)",
                  minWidth: 140,
                }}
              >
                <Tag size={13} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: "left" }}>
                  {categoryId === "all" ? "Catégorie" : selectedCat.label}
                </span>
                <ChevronDown
                  size={13}
                  color="var(--ink-tertiary)"
                  style={{
                    transition: "transform var(--ease)",
                    transform: catOpen ? "rotate(180deg)" : "none",
                    flexShrink: 0,
                  }}
                />
              </button>

              {catOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    minWidth: 220,
                    zIndex: 200,
                    backgroundColor: "var(--surface-1)",
                    border: "1px solid var(--hairline-strong)",
                    borderRadius: "var(--radius-card)",
                    overflow: "hidden",
                  }}
                >
                  {SERVICE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setCategoryId(cat.id); setCatOpen(false); }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: categoryId === cat.id ? 600 : 400,
                        color: categoryId === cat.id ? "var(--accent)" : "var(--ink-secondary)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font)",
                        transition: "background-color var(--ease-fast)",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,12,14,0.04)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── City dropdown ── */}
            <div ref={cityRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { setCityOpen(v => !v); setCatOpen(false); }}
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
                <span style={{ flex: 1, textAlign: "left" }}>
                  {cityId || "Ville"}
                </span>
                <ChevronDown
                  size={13}
                  color="var(--ink-tertiary)"
                  style={{
                    transition: "transform var(--ease)",
                    transform: cityOpen ? "rotate(180deg)" : "none",
                    flexShrink: 0,
                  }}
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
                      style={{
                        display: "block", width: "100%", textAlign: "left", padding: "9px 16px",
                        fontSize: 13, fontWeight: !cityId ? 600 : 400,
                        color: !cityId ? "var(--accent)" : "var(--ink-secondary)",
                        background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font)",
                        transition: "background-color var(--ease-fast)",
                      }}
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
                          style={{
                            display: "block", width: "100%", textAlign: "left", padding: "9px 16px",
                            fontSize: 13, fontWeight: cityId === city ? 600 : 400,
                            color: cityId === city ? "var(--accent)" : "var(--ink-secondary)",
                            background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font)",
                            transition: "background-color var(--ease-fast)",
                          }}
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

            {/* ── Text input ── */}
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

            {/* ── Search button ── */}
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
                transition: "opacity var(--ease)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              <Search size={14} />
              Rechercher
            </button>
          </div>
        )}
      </div>

      {/* ── Large hero image — hidden on mobile ── */}
      {!isMobile && (
        <div
          style={{
            width: "100%",
            maxWidth: 1400,
            paddingInline: 20,
            marginInline: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "clamp(400px, 55vw, 780px)",
              borderRadius: 40,
              overflow: "hidden",
              backgroundColor: "rgba(12,12,14,0.04)",
              position: "relative",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2574&auto=format&fit=crop"
              alt="Salon de beauté"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(12,12,14,0.15) 0%, transparent 50%)",
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
