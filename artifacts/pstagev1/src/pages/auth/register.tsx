import { useState, FormEvent, useEffect, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Building2, User, RotateCcw, ArrowRight } from "lucide-react";
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

  // Form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [providerType, setProviderType] = useState<"ESTABLISHMENT" | "INDIVIDUAL">("ESTABLISHMENT");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<{ email?: string; phone?: string; password?: string; general?: string }>({});

  // OTP state
  const [step, setStep] = useState<Step>("form");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();
  const [otpLoading, setOtpLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
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

  async function sendOtp(targetPhone: string) {
    try {
      const res = await api.preRegisterSendOtp(targetPhone);
      setDevCode(res.devCode);
      startCooldown(60);
    } catch (err: any) {
      const status = err?.status;
      if (status === 429) {
        setFieldError({ general: "Trop de tentatives d'envoi. Réessayez dans une heure." });
      } else {
        setFieldError({ general: err?.data?.message ?? "Erreur lors de l'envoi du code." });
      }
    }
  }

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) { setFieldError(v); return; }
    setFieldError({});
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch {
      // error already set inside sendOtp
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
      // 1. Verify OTP → get phoneToken
      const { phoneToken } = await api.preRegisterVerifyOtp(phone, otp);

      // 2. Create account with verified phone
      const name = email.split("@")[0].replace(/[._-]/g, " ");
      const res = await api.register({
        name,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: isPro ? "OWNER" : "CLIENT",
        phoneToken,
      });
      setTokens(res.token, res.refreshToken, res.user);
      setStep("done");
      setTimeout(() => setLocation(isPro ? "/dashboard/agenda" : "/"), 900);
    } catch (err: any) {
      const msg: string = err?.data?.message ?? err?.message ?? "";
      if (msg.toLowerCase().includes("email")) {
        // Email conflict → back to form
        setStep("form");
        setFieldError({ email: "Cette adresse est déjà utilisée." });
      } else if (msg.toLowerCase().includes("téléphone") || msg.toLowerCase().includes("numéro")) {
        setStep("form");
        setFieldError({ phone: "Ce numéro est déjà utilisé." });
      } else if (msg.includes("token") || msg.includes("Token")) {
        // phoneToken expired → restart from OTP
        setOtp("");
        setOtpError("Code expiré. Renvoyez un nouveau code.");
      } else {
        setOtpError(msg || "Une erreur est survenue.");
      }
    } finally {
      setOtpLoading(false);
    }
  }

  const displayPhone = phone.startsWith("0") ? "+212 " + phone.slice(1) : phone;

  return (
    <div className="flex overflow-hidden" style={{ height: "100vh", backgroundColor: "var(--canvas)" }}>
      {/* ── Left column ── */}
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
        {/* Back */}
        <div>
          <button
            onClick={() => step === "otp" ? (setStep("form"), setOtp(""), setOtpError(undefined)) : setLocation("/")}
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
                  Compte créé !
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
                  Vérifiez votre numéro
                </h1>
                <p style={{ fontSize: 14, color: "var(--ink-tertiary)", lineHeight: 1.65, marginBottom: 28 }}>
                  Code envoyé au{" "}
                  <span style={{ color: "var(--ink)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    {displayPhone}
                  </span>
                </p>

                {/* Dev banner */}
                <AnimatePresence>
                  {devCode && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden", marginBottom: 20 }}
                    >
                      <div style={{
                        padding: "12px 14px",
                        backgroundColor: "#FEFCE8",
                        border: "1px solid #FDE68A",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#92400E", display: "block", marginBottom: 2 }}>
                            Mode développement — SMS simulé
                          </span>
                          <span style={{ fontSize: 13, color: "#78350F" }}>
                            Code :{" "}
                            <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "0.1em" }}>
                              {devCode}
                            </span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtp(devCode)}
                          style={{
                            fontSize: 11, fontWeight: 500, color: "#92400E",
                            background: "rgba(146,64,14,0.08)", border: "none",
                            borderRadius: 4, padding: "4px 8px", cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Remplir auto
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleOtpSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
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
                    ) : "Vérifier et créer mon compte"}
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
                      onClick={() => sendOtp(phone)}
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

                <form onSubmit={handleFormSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Envoi du code…
                      </>
                    ) : (
                      <>
                        {isPro ? "Créer mon espace prestataire" : "Continuer"}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </motion.button>

                  <p style={{ fontSize: 13, color: "var(--ink-tertiary)", textAlign: "center", marginTop: 2 }}>
                    Un code SMS sera envoyé pour vérifier votre numéro.
                  </p>
                </form>

                {/* Login link */}
                <p style={{ marginTop: 24, fontSize: 13, color: "var(--ink-tertiary)" }}>
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setLocation("/auth/login")}
                    style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Se connecter
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots */}
          {step !== "done" && (
            <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 6 }}>
              {(["form", "otp"] as const).map((s) => (
                <div
                  key={s}
                  style={{
                    height: 3, borderRadius: 2,
                    flex: step === s ? "2" : "1",
                    backgroundColor: step === s ? "var(--ink)" : "var(--hairline-strong)",
                    transition: "all 300ms ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Legal */}
          {step === "form" && (
            <p style={{ marginTop: 20, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: 1.6 }}>
              En créant un compte, vous acceptez nos{" "}
              <button type="button" onClick={() => setLocation("/page/cgu")} style={{ fontSize: 12, color: "var(--ink-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                conditions d'utilisation
              </button>{" "}
              et notre{" "}
              <button type="button" onClick={() => setLocation("/page/confidentialite")} style={{ fontSize: 12, color: "var(--ink-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                politique de confidentialité
              </button>.
            </p>
          )}
        </div>
      </div>

      {/* ── Right column (hero) ── */}
      {isLg && (
        <div style={{ flex: "1 1 50%", position: "relative", overflow: "hidden" }}>
          <img
            src={heroImage}
            alt="Salon de beauté"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.28) 100%)" }} />
          <div style={{ position: "absolute", bottom: 40, left: 40, right: 40 }}>
            <Logo size="md" onDark />
            <p style={{ marginTop: 12, fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: 380 }}>
              La plateforme de réservation beauté de référence au Maroc.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
