import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { api } from "@/lib/api";
import { Plus, MoreHorizontal, Clock, Search, X, ChevronUp, ChevronDown } from "lucide-react";

/* ── Types ── */
interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
}

/* ── Sort helpers ── */
type SortKey = "name" | "durationMinutes" | "priceCents";
type SortDir = "asc" | "desc";

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: SortDir }) {
  if (active !== col) return <ChevronUp size={11} style={{ opacity: 0.25 }} />;
  return dir === "asc"
    ? <ChevronUp size={11} style={{ color: "var(--ink)" }} />
    : <ChevronDown size={11} style={{ color: "var(--ink)" }} />;
}

export default function ServicesPage() {
  const [search,  setSearch]  = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: providerData, isLoading } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn:  () => api.getDashboardProvider(),
    staleTime: 300_000,
    retry: false,
  });

  const raw: any[] = providerData?.services ?? [];
  const allServices: Service[] = raw.map((s) => ({
    id:              s.id,
    name:            s.name,
    description:     s.description ?? "",
    durationMinutes: s.durationMinutes ?? 0,
    priceCents:      s.priceCents ?? 0,
  }));

  /* ── Stats ── */
  const totalCount   = allServices.length;
  const avgDuration  = totalCount > 0
    ? Math.round(allServices.reduce((a, s) => a + s.durationMinutes, 0) / totalCount)
    : 0;
  const avgPrice     = totalCount > 0
    ? Math.round(allServices.reduce((a, s) => a + s.priceCents, 0) / totalCount / 100)
    : 0;

  /* ── Filter + sort ── */
  const filtered = allServices
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const v = sortKey === "name"
        ? a.name.localeCompare(b.name)
        : a[sortKey] - b[sortKey];
      return sortDir === "asc" ? v : -v;
    });

  function toggleSort(col: SortKey) {
    if (sortKey === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(col); setSortDir("asc"); }
  }

  const thStyle = (col: SortKey): React.CSSProperties => ({
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  });

  return (
    <DashboardLayout
      title="Prestations"
      breadcrumb="Prestations"
      actions={
        <Button variant="primary" size="sm" icon={<Plus size={13} />}>
          Ajouter une prestation
        </Button>
      }
    >
      {/* ── Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Prestations",   value: isLoading ? "…" : String(totalCount) },
          { label: "Durée moyenne", value: isLoading ? "…" : `${avgDuration} min` },
          { label: "Prix moyen",    value: isLoading ? "…" : `${avgPrice} MAD` },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              border: "1px solid var(--hairline)",
              borderRadius: 10,
              padding: "12px 16px",
              backgroundColor: "var(--surface-1)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="Rechercher une prestation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            height: 34,
            paddingLeft: 32,
            paddingRight: search ? 32 : 12,
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            backgroundColor: "var(--surface-1)",
            fontSize: 13,
            color: "var(--ink)",
            outline: "none",
            fontFamily: "var(--font)",
            boxSizing: "border-box",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", padding: 2, display: "flex" }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="ds-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th onClick={() => toggleSort("name")} style={thStyle("name")}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    Prestation <SortIcon col="name" active={sortKey} dir={sortDir} />
                  </span>
                </th>
                <th style={{ textAlign: "center" }} onClick={() => toggleSort("durationMinutes")} >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", userSelect: "none" }}>
                    Durée <SortIcon col="durationMinutes" active={sortKey} dir={sortDir} />
                  </span>
                </th>
                <th style={{ textAlign: "right" }} onClick={() => toggleSort("priceCents")}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", userSelect: "none" }}>
                    Prix <SortIcon col="priceCents" active={sortKey} dir={sortDir} />
                  </span>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {[260, 80, 80, 32].map((w, j) => (
                      <td key={j}>
                        <div style={{ height: 13, width: w, borderRadius: 6, backgroundColor: "var(--surface-2)", animation: "pulse 1.4s ease-in-out infinite" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div style={{ textAlign: "center", padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Search size={18} color="var(--ink-tertiary)" strokeWidth={1.5} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>Aucune prestation trouvée</p>
                      <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>
                        {search ? `Aucun résultat pour « ${search} »` : "Ajoutez votre première prestation"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((service, i) => (
                    <motion.tr
                      key={service.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.22 }}
                      whileHover={{ backgroundColor: "rgba(12,12,14,0.02)" }}
                    >
                      <td>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                            {service.name}
                          </div>
                          {service.description && (
                            <div style={{ fontSize: 11, color: "var(--ink-tertiary)", marginTop: 2, maxWidth: 320 }}>
                              {service.description.length > 60 ? service.description.slice(0, 60) + "…" : service.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-secondary)" }}>
                          <Clock size={12} strokeWidth={1.8} />
                          {service.durationMinutes} min
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em" }}>
                          {Math.round(service.priceCents / 100)} MAD
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)"; }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
