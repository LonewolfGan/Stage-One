import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import illustrationSrc from "@assets/404_Error-pana_1782672606697.svg";

const ease = [0.16, 1, 0.3, 1] as const;

export default function NotFoundPage() {
  const [, navigate] = useLocation();

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--canvas)",
      }}
    >
      <TopBar />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingInline: 24,
          paddingBlock: 48,
        }}
      >
        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease }}
          style={{ width: "100%", maxWidth: 560 }}
        >
          <img
            src={illustrationSrc}
            alt="Illustration page introuvable"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              userSelect: "none",
              pointerEvents: "none",
            }}
            draggable={false}
          />
        </motion.div>

        {/* Text block */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease, delay: 0.14 }}
          style={{ textAlign: "center", maxWidth: 400 }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.07em",
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              margin: "0 0 14px",
              fontFamily: "var(--font)",
            }}
          >
            Erreur 404
          </p>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              margin: "0 0 12px",
              fontFamily: "var(--font)",
              textWrap: "balance",
            }}
          >
            Page introuvable
          </h1>

          <p
            style={{
              fontSize: 15,
              color: "var(--ink-secondary)",
              lineHeight: 1.65,
              margin: "0 0 32px",
              fontFamily: "var(--font)",
              maxWidth: "52ch",
            }}
          >
            L'adresse que vous avez saisie n'existe pas ou a été déplacée.
            Vérifiez l'URL ou revenez à l'accueil.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <motion.button
              onClick={() => navigate("/")}
              whileTap={{ scale: 0.97 }}
              style={{
                height: 40,
                paddingInline: 20,
                background: "var(--ink)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "var(--font)",
                transition: "opacity 140ms ease",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.82"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              Retour à l&apos;accueil
            </motion.button>

            <motion.button
              onClick={() => navigate("/search")}
              whileTap={{ scale: 0.97 }}
              style={{
                height: 40,
                paddingInline: 20,
                background: "transparent",
                color: "var(--ink-secondary)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                border: "1px solid rgba(12,12,14,0.14)",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "var(--font)",
                transition: "border-color 140ms ease, color 140ms ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(12,12,14,0.32)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--ink)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(12,12,14,0.14)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--ink-secondary)";
              }}
            >
              Parcourir les salons
            </motion.button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
