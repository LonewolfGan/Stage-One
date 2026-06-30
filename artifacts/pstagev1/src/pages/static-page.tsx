import { useParams, Link } from "wouter";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeftIcon } from "@/components/ui/arrow-left";
import { FileTextIcon } from "@/components/ui/file-text";

const PAGE_CONTENT: Record<string, { title: string; subtitle: string }> = {
  "a-propos": {
    title: "À propos",
    subtitle: "Our mission and team.",
  },
  "contact": {
    title: "Nous contacter",
    subtitle: "Questions? Get in touch.",
  },
  "presse": {
    title: "Presse",
    subtitle: "Press releases and media resources.",
  },
  "tarifs": {
    title: "Tarifs",
    subtitle: "Plans for salons and independent providers.",
  },
  "mentions-legales": {
    title: "Mentions légales",
    subtitle: "Legal information.",
  },
  "cgu": {
    title: "Conditions générales d'utilisation",
    subtitle: "Terms of use for the platform.",
  },
  "confidentialite": {
    title: "Politique de confidentialité",
    subtitle: "How we protect your data.",
  },
  "cookies": {
    title: "Gestion des cookies",
    subtitle: "Cookie policy and preferences.",
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
            <FileTextIcon size={24} style={{ color: "var(--ink-secondary)" }} />
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
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Coming soon.</strong> This page will be available in Phase 3.
            </p>
          </div>

          <Link
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, color: "var(--ink)", textDecoration: "none",
              background: "transparent", border: "1px solid rgba(10,10,15,0.18)", borderRadius: 8, padding: "7px 13px",
              fontWeight: 500, letterSpacing: "-0.01em",
              transition: "border-color 140ms ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(10,10,15,0.45)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(10,10,15,0.18)"; }}
          >
            <ArrowLeftIcon size={14} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
