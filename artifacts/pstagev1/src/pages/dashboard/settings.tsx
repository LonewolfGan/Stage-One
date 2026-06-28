import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Clock, Save, User, Bell, Shield, MapPin } from "lucide-react";

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

/* ── Section wrapper ── */
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Icon size={15} color="var(--ink-secondary)" />
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 99,
        backgroundColor: checked ? "#D4466E" : "rgba(12,12,14,0.12)",
        border: "none", cursor: "pointer", padding: 2,
        display: "flex", alignItems: "center",
        transition: "background-color 180ms ease",
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        backgroundColor: "#FFFFFF",
        transform: checked ? "translateX(16px)" : "translateX(0)",
        transition: "transform 180ms ease",
      }} />
    </button>
  );
}

/* ── Text field ── */
function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", letterSpacing: "0.01em" }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "9px 12px",
          border: "1px solid var(--hairline)",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--ink)",
          background: "var(--surface-1)",
          outline: "none",
          fontFamily: "var(--font)",
          transition: "border-color 140ms ease",
        }}
        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--hairline-strong)"; }}
        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--hairline)"; }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<DayHours[]>(defaultHours());

  /* Profil mock state */
  const [profile, setProfile] = useState({
    name: "Salon Atlas",
    phone: "+212 6 12 34 56 78",
    email: "contact@salon-atlas.ma",
    address: "12 Rue Ibn Sina, Guéliz, Marrakech",
  });

  /* Notifications mock state */
  const [notifs, setNotifs] = useState({
    newBooking:   true,
    cancelation:  true,
    reminder24h:  true,
    weeklyReport: false,
  });

  const { data, isLoading } = useQuery<DayHours[]>({
    queryKey: ["dashboard", "business-hours"],
    queryFn: () => api.get("/dashboard/business-hours"),
    staleTime: 60_000,
    retry: false,
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
    onError: () => toast.error("Sauvegarde non disponible en mode démo"),
  });

  function setDay(i: number, patch: Partial<DayHours>) {
    setHours((prev) => prev.map((d) => (d.dayOfWeek === i ? { ...d, ...patch } : d)));
  }

  return (
    <DashboardLayout title="Paramètres" breadcrumb="Paramètres">
      <div style={{ maxWidth: 680 }}>

        {/* ── Profil ── */}
        <Section title="Profil du salon" icon={User}>
          <div className="ds-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Nom du salon" value={profile.name} onChange={(v) => setProfile((p) => ({ ...p, name: v }))} placeholder="Nom du salon" />
              <Field label="Téléphone" value={profile.phone} onChange={(v) => setProfile((p) => ({ ...p, phone: v }))} type="tel" placeholder="+212 6 XX XX XX XX" />
            </div>
            <Field label="Email de contact" value={profile.email} onChange={(v) => setProfile((p) => ({ ...p, email: v }))} type="email" placeholder="contact@salon.ma" />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={11} />
                Adresse
              </label>
              <input
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                placeholder="Numéro, rue, quartier, ville"
                style={{
                  padding: "9px 12px", border: "1px solid var(--hairline)", borderRadius: 8,
                  fontSize: 13, color: "var(--ink)", background: "var(--surface-1)", outline: "none",
                  fontFamily: "var(--font)", transition: "border-color 140ms ease",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => toast.success("Profil enregistré")}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
                  background: "var(--accent)", color: "#fff", border: "none",
                  borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "opacity 140ms ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                <Save size={13} /> Sauvegarder le profil
              </button>
            </div>
          </div>
        </Section>

        {/* ── Business hours ── */}
        <Section title="Horaires d'ouverture" icon={Clock}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DAYS.map((d) => (
                <div key={d} style={{ height: 48, borderRadius: 8, background: "var(--surface-2)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : (
            <div
              style={{
                border: "1px solid var(--hairline)", borderRadius: 12,
                overflow: "hidden", background: "var(--surface-1)",
              }}
            >
              {hours.map((day, idx) => (
                <div
                  key={day.dayOfWeek}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "13px 20px",
                    borderBottom: idx < hours.length - 1 ? "1px solid var(--hairline)" : "none",
                    opacity: day.isClosed ? 0.45 : 1, transition: "opacity 150ms ease",
                  }}
                >
                  <span style={{ width: 90, fontSize: 13, fontWeight: 500, color: "var(--ink)", flexShrink: 0 }}>
                    {DAYS[day.dayOfWeek]}
                  </span>

                  <label style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={day.isClosed}
                      onChange={(e) => setDay(day.dayOfWeek, { isClosed: e.target.checked })}
                      style={{ accentColor: "#D4466E", width: 13, height: 13 }}
                    />
                    <span style={{ fontSize: 11, color: "var(--ink-tertiary)", userSelect: "none" }}>Fermé</span>
                  </label>

                  {!day.isClosed && (
                    <>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => setDay(day.dayOfWeek, { openTime: e.target.value })}
                        style={{ padding: "5px 10px", border: "1px solid var(--hairline)", borderRadius: 6, fontSize: 13, color: "var(--ink)", background: "var(--canvas)", outline: "none", fontFamily: "var(--font)" }}
                      />
                      <span style={{ fontSize: 12, color: "var(--ink-disabled)" }}>–</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => setDay(day.dayOfWeek, { closeTime: e.target.value })}
                        style={{ padding: "5px 10px", border: "1px solid var(--hairline)", borderRadius: 6, fontSize: 13, color: "var(--ink)", background: "var(--canvas)", outline: "none", fontFamily: "var(--font)" }}
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
              marginTop: 12, display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500,
              cursor: mutation.isPending ? "not-allowed" : "pointer",
              opacity: mutation.isPending ? 0.7 : 1, transition: "opacity 140ms ease",
            }}
          >
            <Save size={13} />
            {mutation.isPending ? "Sauvegarde…" : "Sauvegarder les horaires"}
          </button>
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications" icon={Bell}>
          <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
            {(
              [
                { key: "newBooking"   as const, label: "Nouvelle réservation",          desc: "Alerte à chaque nouvelle réservation reçue"           },
                { key: "cancelation"  as const, label: "Annulation",                    desc: "Prévenu lorsqu'un client annule son rendez-vous"       },
                { key: "reminder24h"  as const, label: "Rappel 24 h avant",             desc: "Rappel automatique pour les RDV du lendemain"          },
                { key: "weeklyReport" as const, label: "Rapport hebdomadaire",          desc: "Synthèse de l'activité envoyée le lundi matin"         },
              ] as const
            ).map(({ key, label, desc }, i, arr) => (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--hairline)" : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{desc}</div>
                </div>
                <Toggle checked={notifs[key]} onChange={(v) => setNotifs((p) => ({ ...p, [key]: v }))} />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Sécurité ── */}
        <Section title="Sécurité" icon={Shield}>
          <div className="ds-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Mot de passe actuel" value="" onChange={() => {}} type="password" placeholder="••••••••" />
              <Field label="Nouveau mot de passe" value="" onChange={() => {}} type="password" placeholder="••••••••" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => toast.success("Mot de passe modifié")}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
                  background: "var(--accent)", color: "#fff", border: "none",
                  borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "opacity 140ms ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                <Save size={13} /> Changer le mot de passe
              </button>
            </div>
            <div style={{ padding: "12px 14px", backgroundColor: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--hairline)" }}>
              <p style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Mode démo —</strong>{" "}
                L'authentification complète sera activée en Phase 2.
              </p>
            </div>
          </div>
        </Section>

      </div>
    </DashboardLayout>
  );
}
