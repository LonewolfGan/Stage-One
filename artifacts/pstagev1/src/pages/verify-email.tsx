import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { api } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function VerifyEmailPage() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const token = new URLSearchParams(searchString).get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("Lien invalide ou expiré.");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Aucun token trouvé dans l'URL.");
      return;
    }
    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus("success"))
      .catch((err: any) => {
        setStatus("error");
        setErrorMsg(err?.message ?? "Lien invalide ou expiré.");
      });
  }, [token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--hairline)",
          borderRadius: 16,
          padding: "48px 40px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
        }}
      >
        {status === "loading" && (
          <>
            <Loader2
              size={40}
              style={{ color: "var(--ink-tertiary)", margin: "0 auto 20px", animation: "spin 1s linear infinite" }}
            />
            <p style={{ fontSize: 16, color: "var(--ink-secondary)" }}>Vérification en cours…</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={48} style={{ color: "#16A34A", margin: "0 auto 20px" }} />
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "var(--ink)",
                letterSpacing: "-0.015em",
                marginBottom: 8,
              }}
            >
              Email vérifié !
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-secondary)", marginBottom: 28 }}>
              Votre adresse email a bien été confirmée. Vous pouvez maintenant profiter de toutes les fonctionnalités.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 24px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Retour à l'accueil
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={48} style={{ color: "var(--accent)", margin: "0 auto 20px" }} />
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "var(--ink)",
                letterSpacing: "-0.015em",
                marginBottom: 8,
              }}
            >
              Lien invalide
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-secondary)", marginBottom: 28 }}>{errorMsg}</p>
            <Link
              href="/auth/login"
              style={{
                display: "inline-block",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 24px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
