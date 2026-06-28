import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Plus, MoreHorizontal, Clock, Tag } from "lucide-react";

const MOCK_SERVICES = [
  { id: "s1", name: "Coupe + Brushing",        description: "Coupe personnalisée + mise en forme brushing",      durationMinutes: 60,  priceCents: 25000, isActive: true,  category: "Coiffure"    },
  { id: "s2", name: "Coupe femme simple",       description: "Coupe sans brushing, résultats nets et précis",    durationMinutes: 45,  priceCents: 18000, isActive: true,  category: "Coiffure"    },
  { id: "s3", name: "Soin kératine",            description: "Lissage kératine professionnelle, 4–6 semaines",   durationMinutes: 120, priceCents: 48000, isActive: true,  category: "Traitement"  },
  { id: "s4", name: "Coloration racines",       description: "Retouche couleur sur les racines, toutes teintes", durationMinutes: 90,  priceCents: 35000, isActive: true,  category: "Couleur"     },
  { id: "s5", name: "Mèches / Balayage",        description: "Technique balayage ou mèches, résultat naturel",   durationMinutes: 180, priceCents: 65000, isActive: true,  category: "Couleur"     },
  { id: "s6", name: "Manucure gel",             description: "Pose gel semi-permanent, large palette de teintes",durationMinutes: 60,  priceCents: 18000, isActive: false, category: "Ongles"      },
  { id: "s7", name: "Épilation sourcils",       description: "Épilation et mise en forme au fil",               durationMinutes: 15,  priceCents: 4500,  isActive: true,  category: "Épilation"   },
];

const CATEGORY_COLORS: Record<string, string> = {
  Coiffure:   "var(--ink)",
  Traitement: "#6B5E8B",
  Couleur:    "#D4466E",
  Ongles:     "#5B7B9E",
  Épilation:  "#7B8B55",
};

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");

  const { data: providerData, isLoading } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn: () => api.getDashboardProvider(),
    staleTime: 300_000,
    retry: false,
  });

  const raw: any[] = providerData?.services ?? [];
  const allServices = raw.length > 0 ? raw : MOCK_SERVICES;

  const services =
    activeTab === "all"
      ? allServices
      : activeTab === "active"
      ? allServices.filter((s) => s.isActive !== false)
      : allServices.filter((s) => s.isActive === false);

  const activeCount   = allServices.filter((s) => s.isActive !== false).length;
  const inactiveCount = allServices.filter((s) => s.isActive === false).length;
  const totalRevenue  = allServices.reduce((a, s) => a + (s.priceCents ?? 0), 0);

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
      {/* Summary strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Actives",            value: activeCount,                                        accent: false },
          { label: "Inactives",          value: inactiveCount,                                      accent: false },
          { label: "Panier moyen",       value: `${Math.round(totalRevenue / allServices.length / 100)} MAD`, accent: true  },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1, border: "1px solid var(--hairline)",
              borderRadius: 10, padding: "12px 16px", backgroundColor: "var(--surface-1)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.accent ? "#D4466E" : "var(--ink)", letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, backgroundColor: "rgba(12,12,14,0.04)", padding: 4, borderRadius: "var(--radius-control)", width: "fit-content" }}>
        {(["all", "active", "inactive"] as const).map((tab) => {
          const count = tab === "all" ? allServices.length : tab === "active" ? activeCount : inactiveCount;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                height: 30, paddingInline: 14, borderRadius: 6,
                border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 500, fontFamily: "var(--font)",
                backgroundColor: activeTab === tab ? "var(--surface-1)" : "transparent",
                color: activeTab === tab ? "var(--ink)" : "var(--ink-tertiary)",
                transition: "background-color var(--ease), color var(--ease)",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab === "all" ? "Toutes" : tab === "active" ? "Actives" : "Inactives"}
              <span style={{
                backgroundColor: activeTab === tab ? (tab === "inactive" ? "rgba(12,12,14,0.08)" : "rgba(12,12,14,0.08)") : "transparent",
                color: activeTab === tab ? "var(--ink-secondary)" : "var(--ink-disabled)",
                fontSize: 10, fontWeight: 600, borderRadius: 99, padding: "1px 5px",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="ds-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>Prestation</th>
                <th style={{ textAlign: "center" }}>Durée</th>
                <th style={{ textAlign: "right" }}>Prix</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[280, 80, 80, 60, 32].map((w, j) => (
                      <td key={j}>
                        <div style={{ height: 14, width: w, borderRadius: 6, backgroundColor: "var(--surface-2)", animation: "pulse 1.4s ease-in-out infinite" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-tertiary)", fontSize: 13 }}>
                    Aucune prestation pour ce filtre.
                  </td>
                </tr>
              ) : services.map((service, i) => {
                const catColor = CATEGORY_COLORS[service.category] ?? "var(--ink-secondary)";
                return (
                  <motion.tr
                    key={service.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.045, duration: 0.28, ease: [0.0, 0.0, 0.2, 1] }}
                    whileHover={{ backgroundColor: "rgba(12,12,14,0.025)" }}
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 3, height: 26, borderRadius: 2, backgroundColor: catColor, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                            {service.name}
                          </div>
                          {service.description && (
                            <div style={{ fontSize: 11, color: "var(--ink-tertiary)", marginTop: 1, maxWidth: 280 }}>
                              {String(service.description).substring(0, 55)}{String(service.description).length > 55 ? "…" : ""}
                            </div>
                          )}
                          {service.category && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4, fontSize: 10, color: catColor, opacity: 0.7, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              <Tag size={9} />
                              {service.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-secondary)" }}>
                        <Clock size={12} />
                        {service.durationMinutes} min
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em" }}>
                        {Math.round((service.priceCents ?? 0) / 100)} MAD
                      </span>
                    </td>
                    <td>
                      {service.isActive !== false ? (
                        <Badge variant="success" dot>Active</Badge>
                      ) : (
                        <Badge variant="neutral" dot>Inactive</Badge>
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
