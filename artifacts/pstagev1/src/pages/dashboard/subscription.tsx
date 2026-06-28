import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check, Zap, Building2, Sparkles } from "lucide-react";

type Plan = "FREE" | "PRO" | "BUSINESS";

interface Subscription {
  plan: Plan;
  status: string;
}

const PLANS: {
  key: Plan;
  label: string;
  price: string;
  icon: React.ElementType;
  features: string[];
}[] = [
  {
    key: "FREE",
    label: "Free",
    price: "0 MAD/mois",
    icon: Sparkles,
    features: [
      "Fiche publique visible",
      "Profil avec photos et services",
      "Gestion du catalogue",
      "Agenda basique",
    ],
  },
  {
    key: "PRO",
    label: "Pro",
    price: "299 MAD/mois",
    icon: Zap,
    features: [
      "Tout le plan Free",
      "Réservation en ligne activée",
      "Analytics et statistiques",
      "Mise en avant dans la recherche",
      "Notifications temps réel",
      "Rappels email automatiques",
    ],
  },
  {
    key: "BUSINESS",
    label: "Business",
    price: "699 MAD/mois",
    icon: Building2,
    features: [
      "Tout le plan Pro",
      "Gestion multi-établissements",
      "Accès API complet",
      "Support prioritaire",
      "Rapports avancés",
      "Intégration comptabilité",
    ],
  },
];

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [changing, setChanging] = useState<Plan | null>(null);

  const { data: sub, isLoading } = useQuery<Subscription>({
    queryKey: ["dashboard", "subscription"],
    queryFn: () => api.get("/dashboard/subscription"),
  });

  const mutation = useMutation({
    mutationFn: (plan: Plan) => api.put("/dashboard/subscription/plan", { plan }),
    onMutate: (plan) => setChanging(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "subscription"] });
      toast.success("Plan mis à jour avec succès");
    },
    onError: () => toast.error("Erreur lors du changement de plan"),
    onSettled: () => setChanging(null),
  });

  const currentPlan = sub?.plan ?? "FREE";

  return (
    <DashboardLayout title="Abonnement" breadcrumb="Abonnement">
      <div style={{ padding: "32px 40px", maxWidth: 900 }}>
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
            Abonnement
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>
            Choisissez le plan adapté à votre activité.
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 320,
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {PLANS.map(({ key, label, price, icon: Icon, features }) => {
              const isActive = currentPlan === key;
              return (
                <div
                  key={key}
                  style={{
                    border: isActive
                      ? "2px solid var(--accent)"
                      : "1px solid var(--hairline)",
                    borderRadius: 12,
                    padding: "24px 20px",
                    background: isActive ? "var(--accent-tint)" : "var(--surface-1)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    position: "relative",
                  }}
                >
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--accent)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        padding: "3px 12px",
                        borderRadius: 99,
                        whiteSpace: "nowrap",
                      }}
                    >
                      PLAN ACTUEL
                    </span>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: isActive ? "var(--accent)" : "rgba(12,12,14,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={18} color={isActive ? "#fff" : "var(--ink-secondary)"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{price}</div>
                    </div>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Check size={14} style={{ color: isActive ? "var(--accent)" : "#16A34A", marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.4 }}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {!isActive && (
                    <button
                      onClick={() => mutation.mutate(key)}
                      disabled={changing !== null}
                      style={{
                        marginTop: "auto",
                        width: "100%",
                        padding: "10px 0",
                        borderRadius: 8,
                        border: "1px solid var(--hairline-strong)",
                        background: "#fff",
                        color: "var(--ink)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: changing !== null ? "not-allowed" : "pointer",
                        opacity: changing !== null ? 0.6 : 1,
                        transition: "all 140ms ease",
                      }}
                    >
                      {changing === key ? "En cours…" : `Passer au plan ${label}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p style={{ marginTop: 24, fontSize: 13, color: "var(--ink-tertiary)" }}>
          En mode démo — les changements de plan sont immédiats sans paiement.
          L'intégration Stripe pour la facturation sera activée en Phase 3.
        </p>
      </div>
    </DashboardLayout>
  );
}
