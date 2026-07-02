import { useState, FormEvent, useEffect, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Building2, User, ShieldCheck, RotateCcw, AlertTriangle, ArrowRight } from "lucide-react";
import { EyeIcon } from "@/components/ui/eye";
import { EyeOffIcon } from "@/components/ui/eye-off";
import { ArrowLeftIcon } from "@/components/ui/arrow-left";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import { setTokens } from "@/lib/auth-store";
import heroImage from "@assets/ChatGPT_Image_Jun_27,_2026,_07_43_37_PM_(1)_1782586261262.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

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
  const [otp, setOtp] = useState("");
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
    if (otp.length < 6) { setOtpError("Entrez les 6 chiffres du code."); return; }
    setOtpError(undefined);
    setOtpLoading(true);
    try {
      await api.verifyPhone(otp);
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
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.018em", marginBottom: 6, lineHeight: 1.2 }}>
                  Code de vérification
                </h1>
                <p style={{ fontSize: 14, color: "var(--ink-tertiary)", lineHeight: 1.65, marginBottom: 32 }}>
                  Nous avons envoyé un code à 6 chiffres au{" "}
                  <span style={{ color: "var(--ink)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    {displayPhone}
                  </span>
                </p>

                {/* Service unavailable banner */}
                <AnimatePresence>
                  {otpServiceUnavailable && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden", marginBottom: 24 }}
                    >
                      <div style={{
                        padding: "14px 16px",
                        backgroundColor: "var(--accent-tint)",
                        border: "1px solid rgba(212,70,110,0.2)",
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <AlertTriangle size={14} color="var(--accent)" />
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)" }}>
                            Vérification SMS non disponible
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--ink-secondary)", margin: 0, lineHeight: 1.6 }}>
                          Le service SMS n'est pas configuré. Votre compte est créé — vous pourrez vérifier votre numéro depuis votre profil.
                        </p>
                        <button
                          type="button"
                          onClick={() => setLocation(isPro ? "/dashboard/setup" : "/")}
                          style={{
                            marginTop: 2, alignSelf: "flex-start",
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 12, fontWeight: 500, color: "var(--accent)",
                            background: "transparent", border: "none", cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Continuer sans vérification
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleOtpSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {/* OTP input */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(val) => { setOtp(val); setOtpError(undefined); }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>

                    <AnimatePresence>
                      {otpError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          style={{ fontSize: 12, color: "#E53E3E", margin: 0 }}
                        >
                          {otpError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={otpLoading || otp.length < 6}
                    whileTap={otpLoading ? {} : { scale: 0.98 }}
                    style={{
                      width: "100%", height: 46,
                      backgroundColor: (otpLoading || otp.length < 6) ? "rgba(212,70,110,0.4)" : "var(--accent)",
                      color: "#FFFFFF", fontSize: 14, fontWeight: 600,
                      letterSpacing: "-0.01em", borderRadius: 9999, border: "none",
                      cursor: (otpLoading || otp.length < 6) ? "not-allowed" : "pointer",
                      transition: "background-color 180ms ease",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {otpLoading ? (
                      <>
                        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Vérification…
                      </>
                    ) : "Valider le code"}
                  </motion.button>
                </form>

                {/* Resend */}
                <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Pas reçu le code ?</span>
                  {resendCooldown > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <RotateCcw size={12} color="var(--ink-tertiary)" />
                      <span style={{ fontSize: 13, color: "var(--ink-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                        Renvoyer dans {resendCooldown}s
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 13, fontWeight: 500, color: "var(--ink)",
                        background: "transparent", border: "none", cursor: "pointer", padding: 0,
                      }}
                    >
                      <RotateCcw size={12} />
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
                          { value: "INDIVIDUAL", label: "Indépendant", icon: User },
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email" autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldError((p) => ({ ...p, email: undefined })); }}
                      placeholder="yasmine@exemple.ma"
                      className={`h-11 ${fieldError.email ? "border-red-400" : ""}`}
                    />
                    {fieldError.email && <p style={{ fontSize: 12, color: "#E53E3E", margin: 0 }}>{fieldError.email}</p>}
                  </div>

                  {/* Phone */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Label htmlFor="reg-phone">Téléphone</Label>
                    <Input
                      id="reg-phone"
                      type="tel" autoComplete="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setFieldError((p) => ({ ...p, phone: undefined })); }}
                      placeholder="0612345678"
                      className={`h-11 ${fieldError.phone ? "border-red-400" : ""}`}
                    />
                    {fieldError.phone && <p style={{ fontSize: 12, color: "#E53E3E", margin: 0 }}>{fieldError.phone}</p>}
                  </div>

                  {/* Password */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Label htmlFor="reg-password">Mot de passe</Label>
                    <div style={{ position: "relative" }}>
                      <Input
                        id="reg-password"
                        type={showPwd ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldError((p) => ({ ...p, password: undefined })); }}
                        placeholder="Créez un mot de passe"
                        className={`h-11 pr-11 ${fieldError.password ? "border-red-400" : ""}`}
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
                    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
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
                      width: "100%", height: 46,
                      backgroundColor: loading ? "rgba(212,70,110,0.35)" : "var(--accent)",
                      color: "#FFFFFF", fontSize: 14, fontWeight: 600,
                      letterSpacing: "-0.01em", borderRadius: 9999, border: "none",
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
        </div>
      </div>
    </div>
  );
}
