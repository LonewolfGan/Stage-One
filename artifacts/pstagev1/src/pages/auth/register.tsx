import { useState, FormEvent, useEffect, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { useSearch, useLocation } from "wouter";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Building2 } from "lucide-react";
import { EyeIcon } from "@/components/ui/eye";
import { EyeOffIcon } from "@/components/ui/eye-off";
import { ArrowLeftIcon } from "@/components/ui/arrow-left";
import { UserIcon } from "@/components/ui/user";
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
          width: 16, height: 16, borderRadius: "50%",
          border: met ? "none" : "1.5px solid var(--hairline-strong)",
          backgroundColor: met ? "var(--accent)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background-color 200ms ease, border-color 200ms ease",
        }}
      >
        {met && <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
      <span style={{ fontSize: 12, color: met ? "var(--ink-secondary)" : "var(--ink-tertiary)", transition: "color 200ms ease" }}>
        {label}
      </span>
    </div>
  );
}

function OtpInput({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handleChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    text.split("").forEach((c, i) => { next[i] = c; });
    onChange(next);
    const focusIdx = Math.min(text.length, 5);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            style={{
              flex: 1,
              height: 52,
              textAlign: "center",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              backgroundColor: "#FFFFFF",
              border: `1.5px solid ${error ? "#E53E3E" : value[i] ? "var(--ink)" : "var(--hairline-strong)"}`,
              borderRadius: 10,
              outline: "none",
              transition: "border-color 150ms ease",
              fontFamily: "inherit",
            }}
          />
        ))}
      </div>
      {error && <p style={{ fontSize: 12, color: "#E53E3E" }}>{error}</p>}
    </div>
  );
}

type Step = "form" | "otp" | "done";

export default function RegisterPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { isLg } = useBreakpoint();
  const isPro = new URLSearchParams(search).get("role") === "pro";

  // Step 1 state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [providerType, setProviderType] = useState<"ESTABLISHMENT" | "INDIVIDUAL">("ESTABLISHMENT");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<{ email?: string; phone?: string; password?: string; general?: string }>({});

  // Step 2 state
  const [step, setStep] = useState<Step>("form");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState<string | undefined>();
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpServiceUnavailable, setOtpServiceUnavailable] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pwd8 = password.length >= 8;
  const pwdAlpha = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  function validate() {
    const e: typeof fieldError = {};
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Adresse email invalide.";
    if (!phone.match(/^(\+212|0)[0-9]{9}$/)) e.phone = "Format invalide (ex : 0612345678).";
    if (!pwd8 || !pwdAlpha) e.password = "Le mot de passe ne respecte pas les règles.";
    return e;
  }

  async function sendOtp() {
    try {
      await api.sendPhoneOtp();
      setOtpServiceUnavailable(false);
      startCooldown(60);
    } catch (err: any) {
      const status = err?.status;
      const code = err?.data?.code;
      if (status === 503 || code === "ERR-SERVICE") {
        setOtpServiceUnavailable(true);
      } else if (status === 429) {
        setOtpError("Trop de demandes d'envoi. Réessayez dans une heure.");
      }
    }
  }

  function startCooldown(seconds: number) {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

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
      setStep("otp");
      sendOtp();
    } catch (err: any) {
      const msg: string = err?.data?.message ?? err?.message ?? "";
      if (msg.toLowerCase().includes("email")) setFieldError({ email: "Cette adresse est déjà utilisée." });
      else if (msg.toLowerCase().includes("phone")) setFieldError({ phone: "Ce numéro est déjà utilisé." });
      else setFieldError({ general: msg || "Une erreur est survenue." });
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Entrez les 6 chiffres du code."); return; }
    setOtpError(undefined);
    setOtpLoading(true);
    try {
      await api.verifyPhone(code);
      setStep("done");
      setTimeout(() => setLocation(isPro ? "/dashboard/setup" : "/"), 900);
    } catch (err: any) {
      const msg: string = err?.data?.message ?? err?.message ?? "";
      setOtpError(msg || "Code incorrect ou expiré.");
    } finally {
      setOtpLoading(false);
    }
  }

  const displayPhone = phone.startsWith("0") ? "+212 " + phone.slice(1) : phone;

  return (
    <div className="flex overflow-hidden" style={{ height: "100vh", backgroundColor: "var(--canvas)" }}>
      {/* ── Left column (form) ── */}
      <div
        style={{
          flex: isLg ? "0 0 50%" : "1 1 100%",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: isLg ? "36px 64px 32px" : "32px 24px 24px",
          minWidth: 0,
        }}
      >
        {/* Back link */}
        <div>
          <button
            onClick={() => step === "otp" ? setStep("form") : setLocation("/")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)",
              background: "transparent", border: "none", cursor: "pointer", padding: 0,
              transition: "color 140ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)"; }}
          >
            <ArrowLeftIcon size={14} />
            {step === "otp" ? "Modifier mes infos" : "Accueil"}
          </button>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, maxWidth: 480, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <AnimatePresence mode="wait">

            {/* ── Step done ── */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 40 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(51,202,127,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#33CA7F" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em", marginBottom: 8 }}>
                  Téléphone vérifié !
                </h1>
                <p style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>Redirection en cours…</p>
              </motion.div>
            )}

            {/* ── Step OTP ── */}
            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {/* Icon */}
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "var(--accent-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.81a19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.62a16 16 0 0 0 5.47 5.47l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92"/>
                  </svg>
                </div>

                <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em", marginBottom: 8 }}>
                  Vérifiez votre numéro
                </h1>
                <p style={{ fontSize: 14, color: "var(--ink-tertiary)", lineHeight: 1.6, marginBottom: 28 }}>
                  Un code à 6 chiffres a été envoyé au{" "}
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>{displayPhone}</span>
                </p>

                {/* Service unavailable banner */}
                {otpServiceUnavailable && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: "14px 16px",
                      backgroundColor: "#FFF5F5",
                      border: "1px solid #FED7D7",
                      borderRadius: 10,
                      marginBottom: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#C53030" }}>
                        Vérification SMS non disponible
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#742A2A", margin: 0, lineHeight: 1.5 }}>
                      Le service d'envoi de SMS n'est pas configuré sur cette instance. Votre compte est créé — vous pourrez vérifier votre numéro ultérieurement depuis votre profil.
                    </p>
                    <button
                      type="button"
                      onClick={() => setLocation(isPro ? "/dashboard/setup" : "/")}
                      style={{
                        marginTop: 4, alignSelf: "flex-start",
                        fontSize: 12, fontWeight: 500, color: "#E53E3E",
                        background: "transparent", border: "none", cursor: "pointer",
                        padding: 0, textDecoration: "underline",
                      }}
                    >
                      Continuer sans vérification →
                    </button>
                  </motion.div>
                )}

                <form onSubmit={handleOtpSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <OtpInput value={otp} onChange={setOtp} error={otpError} />

                  <motion.button
                    type="submit"
                    disabled={otpLoading}
                    whileTap={otpLoading ? {} : { scale: 0.98 }}
                    style={{
                      width: "100%", height: 44,
                      backgroundColor: otpLoading ? "rgba(212,70,110,0.35)" : "var(--accent)",
                      color: "#FFFFFF", fontSize: 14, fontWeight: 600,
                      letterSpacing: "-0.01em", borderRadius: 8, border: "none",
                      cursor: otpLoading ? "not-allowed" : "pointer",
                      transition: "background-color 160ms ease",
                    }}
                  >
                    {otpLoading ? "Vérification…" : "Valider le code"}
                  </motion.button>
                </form>

                <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>
                    Pas reçu le code ?
                  </span>
                  {resendCooldown > 0 ? (
                    <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>
                      Renvoyer dans {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      onClick={sendOtp}
                      style={{
                        fontSize: 13, fontWeight: 500, color: "var(--ink)",
                        background: "transparent", border: "none", cursor: "pointer", padding: 0,
                        textDecoration: "underline", textDecorationColor: "var(--hairline-strong)",
                      }}
                    >
                      Renvoyer
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Step form ── */}
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Logo mobile only */}
                <div className="flex lg:hidden" style={{ marginBottom: 28 }}>
                  <Logo size="md" />
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.018em", marginBottom: 8, lineHeight: 1.2 }}>
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
                          { value: "INDIVIDUAL", label: "Indépendant", icon: UserIcon },
                        ] as const).map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setProviderType(value)}
                            style={{
                              flex: 1, height: 44,
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                              fontSize: 13, fontWeight: 500,
                              color: providerType === value ? "var(--ink)" : "var(--ink-secondary)",
                              backgroundColor: providerType === value ? "var(--surface-2)" : "#FFFFFF",
                              border: `1.5px solid ${providerType === value ? "var(--ink)" : "var(--hairline-strong)"}`,
                              borderRadius: 8, cursor: "pointer", transition: "all 150ms ease",
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
                      type="email" autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldError((p) => ({ ...p, email: undefined })); }}
                      placeholder="yasmine@exemple.ma"
                      style={{ ...inputBase, borderColor: fieldError.email ? "#E53E3E" : "var(--hairline-strong)" }}
                      onFocus={(e) => { if (!fieldError.email) e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                      onBlur={(e) => { if (!fieldError.email) e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                    />
                    {fieldError.email && <p style={{ fontSize: 12, color: "#E53E3E", marginTop: 5 }}>{fieldError.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}>
                      Téléphone
                    </label>
                    <input
                      type="tel" autoComplete="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setFieldError((p) => ({ ...p, phone: undefined })); }}
                      placeholder="0612345678"
                      style={{ ...inputBase, borderColor: fieldError.phone ? "#E53E3E" : "var(--hairline-strong)" }}
                      onFocus={(e) => { if (!fieldError.phone) e.currentTarget.style.borderColor = "var(--ink-secondary)"; }}
                      onBlur={(e) => { if (!fieldError.phone) e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                    />
                    {fieldError.phone && <p style={{ fontSize: 12, color: "#E53E3E", marginTop: 5 }}>{fieldError.phone}</p>}
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
                        style={{ ...inputBase, paddingRight: 42, borderColor: fieldError.password ? "#E53E3E" : "var(--hairline-strong)" }}
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
                        {showPwd ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                      </button>
                    </div>
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
                          padding: "10px 12px", backgroundColor: "#FFF5F5",
                          borderRadius: 6, border: "1px solid #FED7D7",
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
                      width: "100%", height: 44,
                      backgroundColor: loading ? "rgba(212,70,110,0.35)" : "var(--accent)",
                      color: "#FFFFFF", fontSize: 14, fontWeight: 600,
                      letterSpacing: "-0.01em", borderRadius: 8, border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "background-color 160ms ease", marginTop: 4,
                    }}
                  >
                    {loading ? "Création…" : isPro ? "Créer mon espace prestataire" : "Créer mon compte"}
                  </motion.button>
                </form>

                <p style={{ marginTop: 20, fontSize: 13, color: "var(--ink-tertiary)" }}>
                  Déjà un compte ?{" "}
                  <button
                    onClick={() => setLocation("/auth/login")}
                    style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Se connecter
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        {step !== "done" && (
          <div style={{ paddingTop: 24, display: "flex", gap: 6, maxWidth: 480 }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: 2,
                  backgroundColor: (step === "form" ? i === 0 : i <= 1) ? "var(--ink)" : "var(--hairline-strong)",
                  transition: "background-color 300ms ease",
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom terms */}
        {step === "form" && (
          <p style={{ paddingTop: 16, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: 1.6, maxWidth: 480 }}>
            En créant un compte, vous acceptez nos{" "}
            <span style={{ color: "var(--ink-secondary)", cursor: "pointer", textDecoration: "underline", textDecorationColor: "var(--hairline-strong)" }}>
              conditions d'utilisation
            </span>{" "}
            et notre{" "}
            <span style={{ color: "var(--ink-secondary)", cursor: "pointer", textDecoration: "underline", textDecorationColor: "var(--hairline-strong)" }}>
              politique de confidentialité
            </span>
            .
          </p>
        )}
      </div>

      {/* ── Right column — image panel ── */}
      <div className="hidden lg:flex" style={{ flex: "0 0 50%", padding: 16 }}>
        <div style={{ flex: 1, borderRadius: 20, overflow: "hidden", position: "relative" }}>
          <img
            src={heroImage}
            alt="Beauté"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
          />
          {/* Step overlay */}
          <AnimatePresence>
            {step === "otp" && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                style={{
                  position: "absolute", bottom: 32, left: 32, right: 32,
                  backgroundColor: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(12px)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "var(--accent-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>Vérification en 2 étapes</p>
                  <p style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Votre numéro est sécurisé par un code unique à usage unique.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
