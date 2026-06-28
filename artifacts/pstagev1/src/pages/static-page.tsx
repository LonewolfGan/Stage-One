import { useParams, Link } from "wouter";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, FileText } from "lucide-react";

const PAGE_CONTENT: Record<string, { title: string; subtitle: string }> = {
  "a-propos": {
    title: "À propos",
    subtitle: "Découvrez notre mission et notre équipe.",
  },
  "contact": {
    title: "Nous contacter",
    subtitle: "Une question ? Nous sommes là pour vous aider.",
  },
  "presse": {
    title: "Presse",
    subtitle: "Retrouvez nos communiqués et ressources médias.",
  },
  "tarifs": {
    title: "Tarifs",
    subtitle: "Des formules adaptées à chaque établissement.",
  },
  "mentions-legales": {
    title: "Mentions légales",
    subtitle: "Informations légales relatives à la plateforme.",
  },
  "cgu": {
    title: "Conditions générales d'utilisation",
    subtitle: "Les règles qui régissent l'utilisation de la plateforme.",
  },
  "confidentialite": {
    title: "Politique de confidentialité",
    subtitle: "Comment nous protégeons vos données personnelles.",
  },
  "cookies": {
    title: "Gestion des cookies",
    subtitle: "Information sur l'utilisation des cookies sur notre site.",
  },
};

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = PAGE_CONTENT[slug ?? ""] ?? {
    title: "Page",
    subtitle: "Cette page sera disponible prochainement.",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      <TopBar />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px" }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(12,12,14,0.06)",
              marginBottom: 24,
            }}
          >
            <FileText size={24} color="var(--ink-secondary)" />
          </div>
          <h1
            style={{
              fontSize: "clamp(22px, 4vw, 32px)",
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            {page.title}
          </h1>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)", lineHeight: 1.6, marginBottom: 32 }}>
            {page.subtitle}
          </p>

          <div
            style={{
              padding: "20px 24px",
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              borderRadius: 12,
              marginBottom: 32,
            }}
          >
            <p style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Bientôt disponible —</strong>{" "}
              Cette page sera complétée lors de la mise en production de la plateforme (Phase 3).
            </p>
          </div>

          <Link href="/" style={{ textDecoration: "none" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                fontWeight: 500,
                color: "var(--ink-secondary)",
                transition: "color 140ms ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = "var(--ink)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = "var(--ink-secondary)"; }}
            >
              <ArrowLeft size={15} />
              Retour à l'accueil
            </span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
