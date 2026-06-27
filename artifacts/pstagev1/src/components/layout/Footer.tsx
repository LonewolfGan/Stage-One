import { Link } from "wouter";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "rgba(12,12,14,0.04)",
        borderTop: "1px solid var(--hairline)",
        borderRadius: "48px 48px 0 0",
        paddingTop: 80,
        paddingBottom: 64,
        position: "relative",
        zIndex: 20,
      }}
    >
      <div className="page-container">
        <div className="footer-grid" style={{ marginBottom: 64 }}>
          {/* Brand column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Logo size="md" />
            <p style={{ fontSize: 13, color: "var(--ink-tertiary)", lineHeight: 1.6, maxWidth: 200 }}>
              La réservation beauté simplifiée pour le Maroc.
            </p>
          </div>

          {[
            {
              title: "À propos",
              links: [
                { label: "Qui sommes-nous", href: "/page/a-propos" },
                { label: "Nous contacter", href: "/page/contact" },
                { label: "Presse", href: "/page/presse" },
              ],
            },
            {
              title: "Prestataires",
              links: [
                { label: "Ajouter mon salon", href: "/auth/register?role=pro" },
                { label: "Espace Pro", href: "/auth/register?role=pro" },
                { label: "Tarifs", href: "/page/tarifs" },
              ],
            },
            {
              title: "Légal",
              links: [
                { label: "Mentions légales", href: "/page/mentions-legales" },
                { label: "CGU", href: "/page/cgu" },
                { label: "Confidentialité", href: "/page/confidentialite" },
              ],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: 20,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {title}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      style={{
                        fontSize: 14,
                        color: "var(--ink-secondary)",
                        textDecoration: "none",
                        transition: "color 140ms ease",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-secondary)"; }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p style={{ fontSize: 11, color: "var(--ink-tertiary)", letterSpacing: "0.01em", margin: 0 }}>
            © {new Date().getFullYear()} PSTAGEV1. Tous droits réservés.
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Confidentialité", href: "/page/confidentialite" },
              { label: "CGU", href: "/page/cgu" },
              { label: "Cookies", href: "/page/cookies" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                style={{
                  fontSize: 11,
                  color: "var(--ink-tertiary)",
                  textDecoration: "none",
                  transition: "color 140ms ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-tertiary)"; }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
