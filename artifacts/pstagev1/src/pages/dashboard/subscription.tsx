import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check, Zap, Building2, Sparkles, ArrowRight } from "lucide-react";

type Plan = "FREE" | "PRO" | "BUSINESS";

interface Subscription {
  plan: Plan;
  status: string;
}

const PLANS: {
  key: Plan;
  label: string;
  price: string;
  priceNote: string;
  icon: React.ElementType;
  features: string[];
  highlighted?: boolean;
}[] = [
  {
    key: "FREE",
    label: "Free",
    price: "0 MAD",
    priceNote: "Toujours gratuit",
    icon: Sparkles,
    features: [
      "Fiche publique visible",
      "Photos et services",
      "Gestion du catalogue",
      "Agenda basique",
    ],
  },
  {
    key: "PRO",
    label: "Pro",
    price: "299 MAD",
    priceNote: "par mois",
    icon: Zap,
    highlighted: true,
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
    price: "699 MAD",
    priceNote: "par mois",
    icon: Building2,
    features: [
      "Tout le plan Pro",
      "Multi-établissements",
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

  const { data: sub } = useQuery<Subscription>({
    queryKey: ["dashboard", "subscription"],
    queryFn: () => api.get("/dashboard/subscription"),
    retry: false,
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
      <div style={{ maxWidth: 880 }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: "var(--ink-tertiary)", marginTop: 4 }}>
            Choisissez le plan adapté à votre activité.
          </p>

          {/* Current plan banner */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10, marginTop: 12,
            padding: "10px 16px", backgroundColor: "var(--surface-2)",
            border: "1px solid var(--hairline)", borderRadius: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#D4466E" }} />
            <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
              Plan actuel : <strong>{currentPlan}</strong>
            </span>
            <ArrowRight size={13} color="var(--ink-tertiary)" />
            <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
              {currentPlan === "FREE" ? "Passez au Pro pour débloquer les réservations en ligne" :
               currentPlan === "PRO"  ? "Passez au Business pour le multi-établissements" :
               "Vous bénéficiez de toutes les fonctionnalités"}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {PLANS.map(({ key, label, price, priceNote, icon: Icon, features, highlighted }) => {
            const isActive = currentPlan === key;
            return (
              <div
                key={key}
                style={{
                  border: isActive ? "2px solid #D4466E" : highlighted ? "2px solid var(--hairline-strong)" : "1px solid var(--hairline)",
                  borderRadius: 14,
                  padding: "24px 20px",
                  background: isActive ? "rgba(212,70,110,0.03)" : "var(--surface-1)",
                  display: "flex", flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Badge */}
                {isActive && (
                  <span style={{
                    position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                    background: "#D4466E", color: "#fff",
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                    padding: "3px 12px", borderRadius: 99, whiteSpace: "nowrap",
                  }}>
                    PLAN ACTUEL
                  </span>
                )}
                {highlighted && !isActive && (
                  <span style={{
                    position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                    background: "var(--ink)", color: "#fff",
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                    padding: "3px 12px", borderRadius: 99, whiteSpace: "nowrap",
                  }}>
                    RECOMMANDÉ
                  </span>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: isActive ? "#D4466E" : "rgba(12,12,14,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={19} color={isActive ? "#fff" : "var(--ink-secondary)"} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: isActive ? "#D4466E" : "var(--ink)", letterSpacing: "-0.02em" }}>{price}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{priceNote}</span>
                    </div>
                  </div>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                  {features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Check size={13} style={{ color: isActive ? "#D4466E" : "#16A34A", marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.45 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {!isActive && (
                  <button
                    onClick={() => mutation.mutate(key)}
                    disabled={changing !== null}
                    style={{
                      width: "100%", padding: "10px 0", borderRadius: 8,
                      border: highlighted ? "none" : "1px solid var(--hairline-strong)",
                      background: highlighted ? "var(--ink)" : "#fff",
                      color: highlighted ? "#fff" : "var(--ink)",
                      fontSize: 13, fontWeight: 500,
                      cursor: changing !== null ? "not-allowed" : "pointer",
                      opacity: changing !== null ? 0.6 : 1,
                      transition: "all 140ms ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                    onMouseEnter={(e) => { if (!highlighted) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hairline)"; }}
                    onMouseLeave={(e) => { if (!highlighted) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hairline-strong)"; }}
                  >
                    {changing === key ? "En cours…" : `Passer au plan ${label}`}
                    {changing !== key && <ArrowRight size={13} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </DashboardLayout>
  );
}
