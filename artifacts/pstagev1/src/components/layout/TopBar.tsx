import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User, Store, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Logo } from "@/components/ui/Logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth, clearTokens } from "@/lib/auth-store";

const NAV_LINKS = [
  { label: "Coiffeur",        href: "/categorie/coiffeur" },
  { label: "Barbier",         href: "/categorie/barbier" },
  { label: "Manucure",        href: "/categorie/manucure" },
  { label: "Institut beauté", href: "/categorie/beaute" },
  { label: "Bien-être",       href: "/categorie/bien-etre" },
];

export function TopBar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { user, isLoggedIn, isOwner } = useAuth();

  return (
    <>
      {/* ── Sticky full-width header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          width: "100%",
          height: 56,
          backgroundColor: "rgba(251,251,252,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(12,12,14,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: isMobile ? 16 : 28,
          paddingRight: isMobile ? 12 : 24,
          gap: 16,
        }}
      >
        {/* Left: logo + nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, minWidth: 0 }}>
          <Link href="/" className="no-underline shrink-0">
            <Logo size="md" />
          </Link>

          {!isMobile && (
            <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="no-underline whitespace-nowrap"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "var(--ink-secondary)",
                    textTransform: "uppercase",
                    transition: "color 180ms ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-secondary)"; }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {isMobile && (
            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 34, height: 34,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "transparent",
                border: "1px solid rgba(12,12,14,0.14)",
                borderRadius: 9999,
                color: "var(--ink)",
                cursor: "pointer",
              }}
              whileTap={{ scale: 0.92 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? "x" : "menu"}
                  initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: "flex" }}
                >
                  {menuOpen ? <X size={16} /> : <Menu size={16} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {isLoggedIn && user ? (
              <motion.div
                key="user-menu"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                {isOwner && !isMobile && (
                  <motion.button
                    onClick={() => setLocation("/dashboard/agenda")}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      height: 32, paddingInline: 12,
                      display: "flex", alignItems: "center", gap: 5,
                      backgroundColor: "transparent",
                      border: "1px solid rgba(12,12,14,0.14)",
                      borderRadius: 9999, cursor: "pointer",
                      fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.04em", textTransform: "uppercase",
                      color: "var(--ink-secondary)",
                      transition: "color 140ms ease, border-color 140ms ease",
                      fontFamily: "var(--font)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(12,12,14,0.3)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-secondary)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(12,12,14,0.14)";
                    }}
                  >
                    <LayoutDashboard size={13} />
                    Dashboard
                  </motion.button>
                )}

                <div style={{
                  height: 32, paddingInline: 10,
                  display: "flex", alignItems: "center", gap: 6,
                  backgroundColor: "rgba(12,12,14,0.04)",
                  border: "1px solid rgba(12,12,14,0.08)",
                  borderRadius: 9999,
                  fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
                  maxWidth: 140, overflow: "hidden",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    backgroundColor: "var(--accent-tint)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <User size={11} color="var(--accent)" />
                  </div>
                  {!isMobile && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name.split(" ")[0]}
                    </span>
                  )}
                </div>

                <motion.button
                  onClick={() => { clearTokens(); setLocation("/"); }}
                  whileTap={{ scale: 0.92 }}
                  title="Se déconnecter"
                  style={{
                    width: 32, height: 32,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(12,12,14,0.14)",
                    borderRadius: 9999, cursor: "pointer",
                    color: "var(--ink-tertiary)",
                    transition: "color 140ms ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)"; }}
                >
                  <LogOut size={13} />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="commencer"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.18 }}
                onClick={() => setOpen(true)}
                style={{
                  height: 32, paddingInline: 16,
                  backgroundColor: "var(--ink)",
                  color: "#FFFFFF",
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: "var(--radius-control)",
                  border: "none", cursor: "pointer",
                  fontFamily: "var(--font)",
                  transition: "background-color 160ms ease",
                }}
                whileHover={{ backgroundColor: "rgba(12,12,14,0.80)" }}
                whileTap={{ scale: 0.94 }}
              >
                Commencer
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile nav dropdown — absolute, below header */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            style={{
              position: "fixed",
              top: 56,
              left: 0,
              right: 0,
              zIndex: 199,
              backgroundColor: "rgba(251,251,252,0.98)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(12,12,14,0.08)",
              padding: "8px 0",
            }}
          >
            {NAV_LINKS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <Link
                  href={item.href}
                  className="no-underline"
                  style={{ display: "block" }}
                  onClick={() => setMenuOpen(false)}
                >
                  <div
                    style={{
                      padding: "13px 20px",
                      fontSize: 13, fontWeight: 600,
                      letterSpacing: "0.04em", textTransform: "uppercase",
                      color: "var(--ink-secondary)",
                      transition: "color 140ms ease, background-color 140ms ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.color = "var(--ink)";
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(12,12,14,0.04)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.color = "var(--ink-secondary)";
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                    }}
                  >
                    {item.label}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Onboarding modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="bg-canvas border border-hairline overflow-hidden p-0"
          style={{ maxWidth: 440, borderRadius: "var(--radius-panel)" }}
        >
          <div className="p-8">
            <DialogHeader className="items-center mb-0">
              <div className="flex items-center justify-center gap-2 mb-5">
                <Logo size="lg" />
              </div>
              <h2 className="text-heading-m font-semibold text-ink text-center mb-2" style={{ letterSpacing: "-0.015em" }}>
                Bienvenue
              </h2>
              <p className="text-body text-ink-tertiary text-center mb-6">
                Comment souhaitez-vous continuer ?
              </p>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  icon: User,
                  title: "Je cherche un salon",
                  desc: "Réservez en ligne, 24h/24",
                  onClick: () => { setOpen(false); setLocation("/auth/register?role=client"); },
                },
                {
                  icon: Store,
                  title: "J'ai un établissement",
                  desc: "Gérez vos réservations",
                  onClick: () => { setOpen(false); setLocation("/auth/register?role=pro"); },
                },
              ].map(({ icon: Icon, title, desc, onClick }) => (
                <motion.button
                  key={title}
                  onClick={onClick}
                  className="border border-hairline rounded-card p-5 text-center cursor-pointer bg-surface-1"
                  whileHover={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-tint)", scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <div className="bg-accent-tint rounded-full flex items-center justify-center mx-auto mb-3" style={{ width: 44, height: 44 }}>
                    <Icon size={20} color="var(--accent)" />
                  </div>
                  <div className="text-label font-semibold text-ink mb-1" style={{ letterSpacing: "-0.01em" }}>{title}</div>
                  <div className="text-caption text-ink-tertiary">{desc}</div>
                </motion.button>
              ))}
            </div>

            <div className="border-t border-hairline mt-6 pt-5 text-center">
              <span className="text-body-s text-ink-tertiary">Déjà un compte ? </span>
              <button
                onClick={() => { setOpen(false); setLocation("/auth/login"); }}
                className="text-body-s text-accent font-medium bg-transparent border-0 cursor-pointer p-0"
              >
                Se connecter
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
