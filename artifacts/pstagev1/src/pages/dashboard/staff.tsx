import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Plus, Phone, Mail, User } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

export default function StaffPage() {
  const { data: providerData, isLoading } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn: () => api.getDashboardProvider(),
    staleTime: 300_000,
  });

  const staffList: any[] = providerData?.staff ?? [];

  return (
    <DashboardLayout
      title="Équipe"
      breadcrumb="Équipe"
      actions={
        <Button variant="primary" size="sm" icon={<Plus size={13} />}>
          Ajouter un membre
        </Button>
      }
    >
      {isLoading ? (
        <div className="dash-staff-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="ds-card animate-pulse" style={{ height: 200, backgroundColor: "var(--surface-2)" }} />
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--ink-tertiary)" }}>
          <User size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>Aucun membre d'équipe</p>
          <p style={{ fontSize: 13, margin: 0 }}>Ajoutez vos collaborateurs pour gérer l'agenda.</p>
        </div>
      ) : (
        <motion.div
          className="dash-staff-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {staffList.map((member: any) => (
            <motion.div
              key={member.id}
              className="ds-card"
              variants={fadeUp}
              whileHover={{ scale: 1.015, borderColor: "var(--hairline-strong)" }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                cursor: "default",
              }}
            >
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "var(--radius-full)",
                    objectFit: "cover",
                    marginBottom: 14,
                  }}
                />
              ) : (
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(12,12,14,0.06)",
                  color: "var(--ink-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 600,
                  marginBottom: 14,
                }}>
                  {member.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 4px" }}>
                {member.name}
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: "0 0 12px" }}>
                {member.bio ?? "Professionnel"}
              </p>

              <Badge variant="success" dot>Actif</Badge>

              <div className="ds-divider" style={{ width: "100%", margin: "16px 0 12px" }} />

              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <Button variant="ghost" size="sm" style={{ flex: 1 }} icon={<Phone size={12} />}>
                  Appeler
                </Button>
                <Button variant="ghost" size="sm" style={{ flex: 1 }} icon={<Mail size={12} />}>
                  Email
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
