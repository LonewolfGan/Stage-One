import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Plus, Phone, Mail, Scissors, Palette, Sparkles } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

const MOCK_STAFF = [
  {
    id: "m1",
    name: "Nadia Bensali",
    bio: "Coiffeuse senior — 8 ans d'expérience",
    speciality: "Coiffure",
    icon: Scissors,
    color: "#D4466E",
    bookingsThisWeek: 24,
    rating: 4.9,
  },
  {
    id: "m2",
    name: "Sara El Amrani",
    bio: "Coloriste — Spécialiste balayage & mèches",
    speciality: "Couleur",
    icon: Palette,
    color: "#0C0C0E",
    bookingsThisWeek: 18,
    rating: 4.8,
  },
  {
    id: "m3",
    name: "Kenza Alaoui",
    bio: "Esthéticienne — Soins visage & épilation",
    speciality: "Beauté",
    icon: Sparkles,
    color: "#6B5E8B",
    bookingsThisWeek: 21,
    rating: 5.0,
  },
];

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  speciality?: string;
  photoUrl?: string;
  bookingsThisWeek?: number;
  rating?: number;
  icon?: React.ElementType;
  color?: string;
}

export default function StaffPage() {
  const { data: providerData, isLoading } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn: () => api.getDashboardProvider(),
    staleTime: 300_000,
    retry: false,
  });

  const rawStaff: StaffMember[] = providerData?.staff ?? [];
  const staffList: StaffMember[] = rawStaff.length > 0 ? rawStaff : MOCK_STAFF;

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
      {/* Summary row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Membres actifs",    value: staffList.length,   accent: false },
          { label: "RDV cette semaine", value: staffList.reduce((a, s) => a + (s.bookingsThisWeek ?? 0), 0), accent: true },
          { label: "Note moyenne",      value: (staffList.reduce((a, s) => a + (s.rating ?? 0), 0) / staffList.length).toFixed(1) + " / 5", accent: false },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              border: "1px solid var(--hairline)",
              borderRadius: 10,
              padding: "14px 18px",
              backgroundColor: "var(--surface-1)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: stat.accent ? "#D4466E" : "var(--ink)", letterSpacing: "-0.02em" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="dash-staff-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ds-card animate-pulse" style={{ height: 240, backgroundColor: "var(--surface-2)" }} />
          ))}
        </div>
      ) : (
        <motion.div
          className="dash-staff-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {staffList.map((member) => {
            const initials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const IconComp = (member as any).icon as React.ElementType | undefined;
            const accentColor = (member as any).color ?? "#0C0C0E";

            return (
              <motion.div
                key={member.id}
                className="ds-card"
                variants={fadeUp}
                whileHover={{ borderColor: "var(--hairline-strong)" }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  cursor: "default",
                  padding: "24px 20px 20px",
                }}
              >
                {/* Avatar */}
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", marginBottom: 14, border: "2px solid var(--hairline)" }}
                  />
                ) : (
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    backgroundColor: `${accentColor}10`,
                    border: `2px solid ${accentColor}25`,
                    color: accentColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 600, marginBottom: 14, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                )}

                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 4px" }}>
                  {member.name}
                </p>
                <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 12px", lineHeight: 1.4 }}>
                  {member.bio ?? "Professionnel(le)"}
                </p>

                <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Badge variant="success" dot>Actif</Badge>
                  {member.speciality && (
                    <span style={{ fontSize: 11, color: "var(--ink-tertiary)", padding: "3px 8px", border: "1px solid var(--hairline)", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      {IconComp && <IconComp size={11} />}
                      {member.speciality}
                    </span>
                  )}
                </div>

                {/* Stat row */}
                {member.bookingsThisWeek !== undefined && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 16, width: "100%" }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#D4466E", letterSpacing: "-0.02em" }}>
                        {member.bookingsThisWeek}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        RDV / semaine
                      </div>
                    </div>
                    <div style={{ width: 1, backgroundColor: "var(--hairline)" }} />
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                        {member.rating?.toFixed(1) ?? "—"}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Note
                      </div>
                    </div>
                  </div>
                )}

                <div className="ds-divider" style={{ width: "100%", margin: "0 0 12px" }} />

                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <Button variant="ghost" size="sm" style={{ flex: 1 }} icon={<Phone size={12} />}>
                    Appeler
                  </Button>
                  <Button variant="ghost" size="sm" style={{ flex: 1 }} icon={<Mail size={12} />}>
                    Email
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
