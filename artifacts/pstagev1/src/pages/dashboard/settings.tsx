import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Settings, Bell, Lock, Globe, CreditCard } from "lucide-react";

const SECTIONS = [
  {
    icon: Globe,
    title: "Informations de l'établissement",
    desc: "Nom, adresse, téléphone, description publique.",
    badge: null,
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Rappels de RDV, alertes d'annulation, résumé hebdomadaire.",
    badge: null,
  },
  {
    icon: Lock,
    title: "Sécurité",
    desc: "Mot de passe, sessions actives, authentification à deux facteurs.",
    badge: null,
  },
  {
    icon: CreditCard,
    title: "Abonnement",
    desc: "Plan actuel, facturation, historique des paiements.",
    badge: "Pro",
  },
];

export default function SettingsPage() {
  return (
    <DashboardLayout title="Paramètres" breadcrumb="Paramètres">
      <div style={{ padding: "32px 40px", maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.015em",
              marginBottom: 4,
            }}
          >
            Paramètres
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>
            Gérez les préférences de votre espace prestataire.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SECTIONS.map(({ icon: Icon, title, desc, badge }) => (
            <div
              key={title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "18px 20px",
                backgroundColor: "var(--surface-1)",
                border: "1px solid var(--hairline)",
                borderRadius: 12,
                cursor: "default",
                transition: "border-color 140ms ease, background-color 140ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hairline-strong)";
                (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(12,12,14,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hairline)";
                (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface-1)";
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: "rgba(12,12,14,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color="var(--ink-secondary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--ink)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {title}
                  </span>
                  {badge && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        backgroundColor: "var(--accent-tint)",
                        padding: "2px 7px",
                        borderRadius: 99,
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-tertiary)", lineHeight: 1.5 }}>
                  {desc}
                </p>
              </div>
              <div style={{ color: "var(--ink-tertiary)", flexShrink: 0 }}>
                <Settings size={15} />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            padding: "16px 20px",
            backgroundColor: "var(--accent-tint)",
            border: "1px solid rgba(212,70,110,0.18)",
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--accent)", fontWeight: 600 }}>Phase 2 en cours —</strong>{" "}
            Les paramètres seront entièrement configurables dans la prochaine version.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
