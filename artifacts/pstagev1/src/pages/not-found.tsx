import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--canvas)",
        display: "flex",
        flexDirection: "column",
        paddingTop: 96,
      }}
    >
      <TopBar />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-tertiary)",
              marginBottom: 20,
            }}
          >
            404
          </p>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--ink)",
              marginBottom: 16,
            }}
          >
            Page introuvable
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--ink-tertiary)",
              lineHeight: 1.6,
              marginBottom: 40,
            }}
          >
            Cette page n'existe pas ou a été déplacée.
          </p>
          <button
            onClick={() => setLocation("/")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 44,
              paddingInline: 24,
              backgroundColor: "var(--ink)",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              transition: "background-color 140ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(12,12,14,0.80)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--ink)";
            }}
          >
            <ArrowLeft size={15} />
            Retour à l'accueil
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
