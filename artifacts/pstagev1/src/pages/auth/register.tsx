import { useState, FormEvent } from "react";
import { useSearch, useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft, Check, Building2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import { setTokens } from "@/lib/auth-store";
import heroImage from "@assets/ChatGPT_Image_Jun_27,_2026,_07_43_37_PM_(1)_1782586261262.png";

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

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: met ? "none" : "1.5px solid var(--hairline-strong)",
          backgroundColor: met ? "var(--accent)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background-color 200ms ease, border-color 200ms ease",
        }}
      >
        {met && <Check size={9} color="#fff" strokeWidth={3} />}
      </div>
      <span
        style={{
          fontSize: 12,
          color: met ? "var(--ink-secondary)" : "var(--ink-tertiary)",
          transition: "color 200ms ease",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const isPro = new URLSearchParams(search).get("role") === "pro";

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [providerType, setProviderType] = useState<"ESTABLISHMENT" | "INDIVIDUAL">("ESTABLISHMENT");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<{ email?: string; phone?: string; password?: string; general?: string }>({});
  const [success, setSuccess] = useState(false);

  const pwd8 = password.length >= 8;
  const pwdAlpha = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  function validate() {
    const e: typeof fieldError = {};
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Adresse email invalide.";
    if (!phone.match(/^(\+212|0)[0-9]{9}$/)) e.phone = "Format invalide (ex : 0612345678).";
    if (!pwd8 || !pwdAlpha) e.password = "Le mot de passe ne respecte pas les règles.";
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) { setFieldError(v); return; }
    setFieldError({});
    setLoading(true);
    try {
      const name = email.split("@")[0].replace(/[._-]/g, " ");
      const res = await api.register({
        name,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: isPro ? "OWNER" : "CLIENT",
      });
      setTokens(res.token, res.refreshToken, res.user);
      setSuccess(true);
      setTimeout(() => setLocation(isPro ? "/dashboard/agenda" : "/"), 900);
    } catch (err: any) {
      const msg: string = err?.data?.message ?? err?.message ?? "";
      if (msg.toLowerCase().includes("email")) setFieldError({ email: "Cette adresse est déjà utilisée." });
      else if (msg.toLowerCase().includes("phone")) setFieldError({ phone: "Ce numéro est déjà utilisé." });
      else setFieldError({ general: msg || "Une erreur est survenue." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: "100vh", backgroundColor: "var(--canvas)" }}
    >
      {/* ── Left column (form, 50%) ── */}
      <div
        style={{
          flex: "0 0 50%",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: "36px 64px 32px",
          minWidth: 0,
        }}
      >
        {/* Back link */}
        <div>
          <button
            onClick={() => setLocation("/")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-tertiary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "color 140ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)"; }}
          >
            <ArrowLeft size={14} />
            Accueil
          </button>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, maxWidth: 480, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ paddingTop: 40 }}
              >
                <div
                  style={{
                    width: 48, height: 48, borderRadius: "50%",
                    backgroundColor: "rgba(12,12,14,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Check size={22} color="var(--ink)" strokeWidth={2.5} />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em", marginBottom: 8 }}>
                  Compte créé !
                </h1>
                <p style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>Redirection en cours…</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: "var(--ink)",
                    letterSpacing: "-0.018em",
                    marginBottom: 8,
                    lineHeight: 1.2,
                  }}
                >
                  {isPro ? "Créez votre espace prestataire" : "Créez votre compte"}
                </h1>
                <p style={{ fontSize: 14, color: "var(--ink-tertiary)", lineHeight: 1.6, marginBottom: 32 }}>
                  {isPro
                    ? "Gérez vos réservations et fidélisez vos clients."
                    : "Réservez vos prestations beauté en quelques secondes."}
                </p>

                <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Provider type (pro only) */}
                  {isPro && (
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 8 }}>
                        Type d'établissement
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {([
                          { value: "ESTABLISHMENT", label: "Établissement", icon: Building2 },
                          { value: "INDIVIDUAL", label: "Indépendant", icon: User },
                        ] as const).map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setProviderType(value)}
                            style={{
                              flex: 1,
                              height: 44,
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                              fontSize: 13,
                              fontWeight: 500,
                              color: providerType === value ? "var(--ink)" : "var(--ink-secondary)",
                              backgroundColor: providerType === value ? "var(--surface-2)" : "#FFFFFF",
                              border: `1.5px solid ${providerType === value ? "var(--ink)" : "var(--hairline-strong)"}`,
                              borderRadius: 8,
                              cursor: "pointer",
                              transition: "all 150ms ease",
                            }}
                          >
                            <Icon size={15} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldError((p) => ({ ...p, email: undefined })); }}
                      placeholder="yasmine@exemple.ma"
                      style={{ ...inputBase, borderColor: fieldError.email ? "#E53E3E" : "var(--hairline-strong)" }}
                      onFocus={(e) => { if (!fieldError.email) e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                      onBlur={(e) => { if (!fieldError.email) e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                    />
                    {fieldError.email && (
                      <p style={{ fontSize: 12, color: "#E53E3E", marginTop: 5 }}>{fieldError.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setFieldError((p) => ({ ...p, phone: undefined })); }}
                      placeholder="0612345678"
                      style={{ ...inputBase, borderColor: fieldError.phone ? "#E53E3E" : "var(--hairline-strong)" }}
                      onFocus={(e) => { if (!fieldError.phone) e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                      onBlur={(e) => { if (!fieldError.phone) e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                    />
                    {fieldError.phone && (
                      <p style={{ fontSize: 12, color: "#E53E3E", marginTop: 5 }}>{fieldError.phone}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}>
                      Mot de passe
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPwd ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldError((p) => ({ ...p, password: undefined })); }}
                        placeholder="Créez un mot de passe"
                        style={{
                          ...inputBase,
                          paddingRight: 42,
                          borderColor: fieldError.password ? "#E53E3E" : "var(--hairline-strong)",
                        }}
                        onFocus={(e) => { if (!fieldError.password) e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                        onBlur={(e) => { if (!fieldError.password) e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        style={{
                          position: "absolute", right: 12, top: "50%",
                          transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--ink-tertiary)", display: "flex", alignItems: "center", padding: 0,
                        }}
                      >
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {/* Validation rules */}
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                      <PasswordRule met={pwd8} label="Au moins 8 caractères" />
                      <PasswordRule met={pwdAlpha} label="Au moins une lettre et un chiffre" />
                    </div>
                  </div>

                  {/* API error */}
                  <AnimatePresence>
                    {fieldError.general && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                          fontSize: 13, color: "#E53E3E",
                          padding: "10px 12px",
                          backgroundColor: "#FFF5F5",
                          borderRadius: 6,
                          border: "1px solid #FED7D7",
                        }}
                      >
                        {fieldError.general}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={loading ? {} : { scale: 0.98 }}
                    style={{
                      width: "100%",
                      height: 44,
                      backgroundColor: loading ? "rgba(12,12,14,0.12)" : "var(--ink)",
                      color: loading ? "var(--ink-tertiary)" : "#FFFFFF",
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      borderRadius: 8,
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "background-color 160ms ease",
                      marginTop: 4,
                    }}
                  >
                    {loading
                      ? "Création…"
                      : isPro
                      ? "Créer mon espace prestataire"
                      : "Créer mon compte"}
                  </motion.button>
                </form>

                <p style={{ marginTop: 20, fontSize: 13, color: "var(--ink-tertiary)" }}>
                  Déjà un compte ?{" "}
                  <button
                    onClick={() => setLocation("/auth/login")}
                    style={{
                      fontSize: 13, fontWeight: 500, color: "var(--ink)",
                      background: "transparent", border: "none", cursor: "pointer", padding: 0,
                    }}
                  >
                    Se connecter
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom terms */}
        <p style={{ paddingTop: 32, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: 1.6, maxWidth: 480 }}>
          En créant un compte, vous acceptez nos{" "}
          <span
            style={{ color: "var(--ink-secondary)", cursor: "pointer", textDecoration: "underline", textDecorationColor: "var(--hairline-strong)" }}
          >
            conditions d'utilisation
          </span>{" "}
          et notre{" "}
          <span
            style={{ color: "var(--ink-secondary)", cursor: "pointer", textDecoration: "underline", textDecorationColor: "var(--hairline-strong)" }}
          >
            politique de confidentialité
          </span>
          .
        </p>
      </div>

      {/* ── Right column — image panel (50%) ── */}
      <div
        className="hidden lg:flex"
        style={{ flex: "0 0 50%", padding: 16 }}
      >
        <div
          style={{
            flex: 1,
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <img
            src={heroImage}
            alt="Beauté"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              display: "block",
            }}
          />
        </div>
      </div>
    </div>
  );
}
