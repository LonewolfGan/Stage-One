import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface DayHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

function defaultHours(): DayHours[] {
  return DAYS.map((_, i) => ({
    dayOfWeek: i,
    openTime: "09:00",
    closeTime: "19:00",
    isClosed: i === 0,
  }));
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<DayHours[]>(defaultHours());

  const { data, isLoading } = useQuery<DayHours[]>({
    queryKey: ["dashboard", "business-hours"],
    queryFn: () => api.get("/dashboard/business-hours"),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      const filled = defaultHours().map((def) => {
        const found = data.find((d) => d.dayOfWeek === def.dayOfWeek);
        return found ?? def;
      });
      setHours(filled);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (h: DayHours[]) => api.put("/dashboard/business-hours", { hours: h }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "business-hours"] });
      toast.success("Horaires mis à jour");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  function setDay(i: number, patch: Partial<DayHours>) {
    setHours((prev) => prev.map((d) => (d.dayOfWeek === i ? { ...d, ...patch } : d)));
  }

  return (
    <DashboardLayout title="Paramètres" breadcrumb="Paramètres">
      <div style={{ padding: "32px 40px", maxWidth: 680 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em", marginBottom: 4 }}>
            Paramètres
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>
            Configurez les horaires d'ouverture de votre établissement.
          </p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Clock size={16} color="var(--ink-secondary)" />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              Horaires d'ouverture
            </h2>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DAYS.map((d) => (
                <div key={d} style={{ height: 48, borderRadius: 8, background: "var(--surface-2)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : (
            <div
              style={{
                border: "1px solid var(--hairline)",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--surface-1)",
              }}
            >
              {hours.map((day, idx) => (
                <div
                  key={day.dayOfWeek}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 20px",
                    borderBottom: idx < hours.length - 1 ? "1px solid var(--hairline)" : "none",
                    opacity: day.isClosed ? 0.5 : 1,
                    transition: "opacity 150ms ease",
                  }}
                >
                  <span style={{ width: 90, fontSize: 13, fontWeight: 500, color: "var(--ink)", flexShrink: 0 }}>
                    {DAYS[day.dayOfWeek]}
                  </span>

                  <label style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={day.isClosed}
                      onChange={(e) => setDay(day.dayOfWeek, { isClosed: e.target.checked })}
                      style={{ accentColor: "var(--accent)", width: 14, height: 14 }}
                    />
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>Fermé</span>
                  </label>

                  {!day.isClosed && (
                    <>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => setDay(day.dayOfWeek, { openTime: e.target.value })}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid var(--hairline)",
                          borderRadius: 6,
                          fontSize: 13,
                          color: "var(--ink)",
                          background: "var(--canvas)",
                          outline: "none",
                        }}
                      />
                      <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>→</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => setDay(day.dayOfWeek, { closeTime: e.target.value })}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid var(--hairline)",
                          borderRadius: 6,
                          fontSize: 13,
                          color: "var(--ink)",
                          background: "var(--canvas)",
                          outline: "none",
                        }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => mutation.mutate(hours)}
            disabled={mutation.isPending || isLoading}
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "var(--ink)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: mutation.isPending ? "not-allowed" : "pointer",
              opacity: mutation.isPending ? 0.7 : 1,
              transition: "opacity 140ms ease",
            }}
          >
            <Save size={14} />
            {mutation.isPending ? "Sauvegarde…" : "Sauvegarder les horaires"}
          </button>
        </div>

        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "var(--surface-2)",
            border: "1px solid var(--hairline)",
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--ink)", fontWeight: 600 }}>À venir —</strong>{" "}
            La configuration du profil, des notifications et de la sécurité sera disponible dans la prochaine version.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
