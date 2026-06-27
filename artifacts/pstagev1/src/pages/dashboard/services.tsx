import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Plus, MoreHorizontal } from "lucide-react";

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");

  const { data: providerData, isLoading } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn: () => api.getDashboardProvider(),
    staleTime: 300_000,
  });

  const allServices: any[] = providerData?.services ?? [];
  const services = activeTab === "all"
    ? allServices
    : activeTab === "active"
    ? allServices.filter((s: any) => s.isActive !== false)
    : allServices.filter((s: any) => s.isActive === false);

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
      <div style={{ display: "flex", gap: 2, marginBottom: 20, backgroundColor: "rgba(12,12,14,0.04)", padding: 4, borderRadius: "var(--radius-control)", width: "fit-content" }}>
        {(["all", "active", "inactive"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              height: 30,
              paddingInline: 14,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "var(--font)",
              backgroundColor: activeTab === tab ? "var(--surface-1)" : "transparent",
              color: activeTab === tab ? "var(--ink)" : "var(--ink-tertiary)",
              transition: "background-color var(--ease), color var(--ease)",
            }}
          >
            {tab === "all" ? "Toutes" : tab === "active" ? "Actives" : "Inactives"}
          </button>
        ))}
      </div>

      <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="ds-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                {["Prestation", "Durée", "Prix", "Statut", ""].map(h => (
                  <th key={h} style={{ textAlign: h === "" ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-tertiary)", fontSize: 13 }}>
                    Chargement…
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-tertiary)", fontSize: 13 }}>
                    Aucune prestation pour ce filtre.
                  </td>
                </tr>
              ) : services.map((service: any, i: number) => (
                <motion.tr
                  key={service.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.055, duration: 0.32, ease: [0.0, 0.0, 0.2, 1] }}
                  whileHover={{ backgroundColor: "rgba(12,12,14,0.04)" }}
                >
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                      {service.name}
                    </div>
                    {service.description && (
                      <div style={{ fontSize: 12, color: "var(--ink-tertiary)", marginTop: 2, maxWidth: 280 }}>
                        {String(service.description).substring(0, 60)}{String(service.description).length > 60 ? "…" : ""}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>{service.durationMinutes} min</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      {Math.round((service.priceCents ?? 0) / 100)} MAD
                    </span>
                  </td>
                  <td>
                    <Badge variant="success" dot>Active</Badge>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)"; }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
