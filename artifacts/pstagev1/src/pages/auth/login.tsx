import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { EyeIcon } from "@/components/ui/eye";
import { EyeOffIcon } from "@/components/ui/eye-off";
import { ArrowLeftIcon } from "@/components/ui/arrow-left";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { setTokens } from "@/lib/auth-store";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import heroImage from "@assets/ChatGPT_Image_Jun_27,_2026,_07_43_37_PM_(1)_1782586261262.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { isLg } = useBreakpoint();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email.trim().toLowerCase(), password);
      setTokens(res.token, res.refreshToken, res.user);
      if (res.user.role === "OWNER" || res.user.role === "ADMIN") {
        setLocation("/dashboard/agenda");
      } else {
        setLocation("/");
      }
    } catch (err: any) {
      const msg: string = err?.data?.message ?? err?.message ?? "";
      const isCredentials =
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("credentials") ||
        msg.toLowerCase().includes("incorrect") ||
        msg.toLowerCase().includes("password") ||
        err?.status === 401;
      setError(isCredentials ? "Email ou mot de passe incorrect." : msg || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: "100vh", backgroundColor: "var(--canvas)" }}
    >
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
            onClick={() => setLocation("/")}
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
            Accueil
          </button>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, maxWidth: 480, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.018em", marginBottom: 8, lineHeight: 1.2 }}>
            Bon retour parmi nous
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-tertiary)", lineHeight: 1.6, marginBottom: 32 }}>
            Connectez-vous à votre espace personnel.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="yasmine@exemple.ma"
                className="h-11"
              />
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="login-password">Mot de passe</Label>
              <div style={{ position: "relative" }}>
                <Input
                  id="login-password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Votre mot de passe"
                  className="h-11 pr-11"
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
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
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
                    margin: 0,
                  }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || !canSubmit}
              whileTap={loading || !canSubmit ? {} : { scale: 0.98 }}
              style={{
                width: "100%", height: 44,
                backgroundColor: canSubmit && !loading ? "var(--accent)" : "rgba(212,70,110,0.28)",
                color: "#FFFFFF", fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
                borderRadius: 8, border: "none",
                cursor: loading || !canSubmit ? "not-allowed" : "pointer",
                transition: "background-color 160ms ease",
                marginTop: 4,
              }}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </motion.button>
          </form>

          <p style={{ marginTop: 20, fontSize: 13, color: "var(--ink-tertiary)" }}>
            Pas encore de compte ?{" "}
            <button
              onClick={() => setLocation("/auth/register")}
              style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
            >
              S'inscrire
            </button>
          </p>
        </div>

        {/* Bottom terms */}
        <p style={{ paddingTop: 32, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: 1.6, maxWidth: 480 }}>
          En vous connectant, vous acceptez nos{" "}
          <span style={{ color: "var(--ink-secondary)", cursor: "pointer", textDecoration: "underline", textDecorationColor: "var(--hairline-strong)" }}>
            conditions d'utilisation
          </span>
          .
        </p>
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
