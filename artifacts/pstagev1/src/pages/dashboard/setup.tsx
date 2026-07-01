import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import { ds } from "@/lib/design-system";
import { Building2 } from "lucide-react";
import { UserIcon } from "@/components/ui/user";
import { CheckIcon } from "@/components/ui/check";

const CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir",
  "Meknès", "Oujda", "Kenitra", "Tétouan", "Safi", "El Jadida",
];

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  fontSize: 14,
  color: "var(--ink)",
  backgroundColor: "#FFFFFF",
  border: "1px solid var(--hairline-strong)",
  borderRadius: 8,
  outline: "none",
  transition: "border-color 150ms ease",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const selectBase: React.CSSProperties = {
  ...inputBase,
  appearance: "none",
  cursor: "pointer",
  paddingRight: 36,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%238A8D93' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
};

export default function ProviderSetupPage() {
  const [, setLocation] = useLocation();

  const [type, setType] = useState<"ESTABLISHMENT" | "INDIVIDUAL">("ESTABLISHMENT");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !city || !phone.trim() || !email.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.registerProvider({ type, name: name.trim(), city, phone: phone.trim(), email: email.trim(), description: description.trim() || undefined });
      setSuccess(true);
      setTimeout(() => setLocation("/dashboard/agenda"), 1200);
    } catch (err: any) {
      setError(err?.data?.message ?? err?.message ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Logo />
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", padding: "48px 32px" }}
            >
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: ds.colors.successBg, border: `1px solid ${ds.colors.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckIcon size={22} style={{ color: ds.colors.success }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em", marginBottom: 8 }}>Espace créé !</h2>
              <p style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>Redirection vers votre dashboard…</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="ds-card" style={{ padding: "32px 36px" }}>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.018em", marginBottom: 6 }}>
                  Configurez votre espace
                </h1>
                <p style={{ fontSize: 14, color: "var(--ink-tertiary)", lineHeight: 1.6, marginBottom: 28 }}>
                  Ces informations seront visibles sur votre fiche publique.
                </p>

                <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Type */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 8 }}>
                      Type d'activité <span style={{ color: "var(--accent)" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {([
                        { value: "ESTABLISHMENT", label: "Établissement", Icon: Building2 },
                        { value: "INDIVIDUAL",    label: "Indépendant",   Icon: UserIcon  },
                      ] as const).map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setType(value)}
                          style={{
                            flex: 1, height: 44,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                            fontSize: 13, fontWeight: 500,
                            color: type === value ? "var(--ink)" : "var(--ink-secondary)",
                            backgroundColor: type === value ? "var(--surface-2)" : "#FFFFFF",
                            border: `1.5px solid ${type === value ? "var(--ink)" : "var(--hairline-strong)"}`,
                            borderRadius: 8, cursor: "pointer", transition: "all 150ms ease",
                          }}
                        >
                          <Icon size={15} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}>
                      Nom {type === "ESTABLISHMENT" ? "du salon / institut" : "complet"} <span style={{ color: "var(--accent)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={type === "ESTABLISHMENT" ? "Salon Élégance" : "Sara Ben Ali"}
                      style={inputBase}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}>
                      Ville <span style={{ color: "var(--accent)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        style={{ ...selectBase, color: city ? "var(--ink)" : "var(--ink-tertiary)" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                      >
                        <option value="" disabled>Sélectionner une ville</option>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Phone + Email */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}>
                        Téléphone pro <span style={{ color: "var(--accent)" }}>*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0612345678"
                        style={inputBase}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}>
                        Email pro <span style={{ color: "var(--accent)" }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@salon.ma"
                        style={inputBase}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}>
                      Description <span style={{ fontSize: 12, color: "var(--ink-tertiary)", fontWeight: 400 }}>(optionnel)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez votre salon, vos spécialités, votre ambiance…"
                      rows={3}
                      style={{ ...inputBase, height: "auto", padding: "12px 14px", resize: "vertical", lineHeight: 1.5 }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                    />
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ fontSize: 13, color: ds.colors.error, padding: "10px 12px", backgroundColor: ds.colors.errorBg, borderRadius: 6, border: `1px solid ${ds.colors.errorBorder}`, margin: 0 }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      height: 44, backgroundColor: loading ? "rgba(212,70,110,0.4)" : "var(--accent)",
                      color: "#fff", fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
                      borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer",
                      transition: "background-color 150ms ease", marginTop: 4,
                    }}
                  >
                    {loading ? "Création…" : "Créer mon espace prestataire"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
