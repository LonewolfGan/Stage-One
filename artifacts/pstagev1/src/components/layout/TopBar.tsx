import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Store, LogOut, LayoutDashboard, CalendarDays, User } from "lucide-react";
import { MenuIcon } from "@/components/ui/menu";
import { XIcon } from "@/components/ui/x";
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

/* ─────────────────────────────────────────────────────────
   Shared: auth actions (user menu / commencer button)
───────────────────────────────────────────────────────── */
function AuthActions({
  onCommencer,
  compact = false,
}: {
  onCommencer: () => void;
  compact?: boolean;
}) {
  const [, setLocation] = useLocation();
  const { user, isLoggedIn, isOwner } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
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
          {isOwner && !compact && (
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

          {/* ── User chip — clickable dropdown trigger ── */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setOpen((v) => !v)}
              style={{
                height: 32, paddingInline: 10,
                display: "flex", alignItems: "center", gap: 6,
                backgroundColor: open ? "rgba(12,12,14,0.08)" : "rgba(12,12,14,0.04)",
                border: `1px solid ${open ? "rgba(12,12,14,0.18)" : "rgba(12,12,14,0.08)"}`,
                borderRadius: 9999, cursor: "pointer",
                fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
                maxWidth: 140, overflow: "hidden",
                transition: "background-color 140ms ease, border-color 140ms ease",
                fontFamily: "var(--font)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,12,14,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(12,12,14,0.18)";
              }}
              onMouseLeave={e => {
                if (!open) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,12,14,0.04)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(12,12,14,0.08)";
                }
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                backgroundColor: "var(--accent-tint)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <User size={11} color="var(--accent)" />
              </div>
              {!compact && (
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name.split(" ")[0]}
                </span>
              )}
            </button>

            {/* ── Dropdown panel ── */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    minWidth: 200,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--hairline)",
                    borderRadius: 12,
                    padding: "6px",
                    zIndex: 9999,
                  }}
                >
                  {/* User info header */}
                  <div style={{
                    padding: "10px 12px 10px",
                    borderBottom: "1px solid var(--hairline)",
                    marginBottom: 6,
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 1 }}>
                      {user.name}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
                      {user.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  {[
                    { icon: User, label: "Mon profil", href: "/account/profile" },
                    { icon: CalendarDays, label: "Mes réservations", href: "/account/bookings" },
                  ].map(({ icon: Icon, label, href }) => (
                    <button
                      key={href}
                      onClick={() => { setOpen(false); setLocation(href); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 9,
                        padding: "9px 12px", borderRadius: 8,
                        fontSize: 13, fontWeight: 400, color: "var(--ink-secondary)",
                        background: "transparent", border: "none", cursor: "pointer",
                        transition: "background-color 120ms ease, color 120ms ease",
                        textAlign: "left", fontFamily: "var(--font)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-2)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-secondary)";
                      }}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}

                  {/* Divider + logout */}
                  <div style={{ borderTop: "1px solid var(--hairline)", marginTop: 6, paddingTop: 6 }}>
                    <button
                      onClick={() => { setOpen(false); clearTokens(); setLocation("/"); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 9,
                        padding: "9px 12px", borderRadius: 8,
                        fontSize: 13, fontWeight: 400, color: "var(--ink-tertiary)",
                        background: "transparent", border: "none", cursor: "pointer",
                        transition: "background-color 120ms ease, color 120ms ease",
                        textAlign: "left", fontFamily: "var(--font)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-2)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)";
                      }}
                    >
                      <LogOut size={14} />
                      Se déconnecter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="commencer"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.18 }}
          onClick={onCommencer}
          style={{
            height: 32, paddingInline: 16,
            backgroundColor: "var(--accent)",
            color: "#FFFFFF",
            fontSize: 10, fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            borderRadius: 9999,
            border: "none", cursor: "pointer",
            fontFamily: "var(--font)",
            transition: "background-color 160ms ease",
          }}
          whileHover={{ backgroundColor: "var(--accent-hover)" }}
          whileTap={{ scale: 0.94 }}
        >
          Commencer
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   Onboarding modal (shared)
───────────────────────────────────────────────────────── */
function OnboardingModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [, setLocation] = useLocation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-canvas border border-hairline overflow-hidden p-0"
        style={{
          maxWidth: 440,
          width: "calc(100% - 2rem)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <div className="p-5 sm:p-8">
          <DialogHeader className="items-center mb-0">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-5">
              <Logo size="lg" />
            </div>
            <h2 className="text-heading-m font-semibold text-ink text-center mb-2" style={{ letterSpacing: "-0.015em" }}>
              Bienvenue
            </h2>
            <p className="text-body text-ink-tertiary text-center mb-5 sm:mb-6">
              Comment souhaitez-vous continuer ?
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              {
                icon: User,
                title: "Je cherche un salon",
                desc: "Réservez en ligne, 24h/24",
                onClick: () => { onOpenChange(false); setLocation("/auth/register?role=client"); },
              },
              {
                icon: Store,
                title: "J'ai un établissement",
                desc: "Gérez vos réservations",
                onClick: () => { onOpenChange(false); setLocation("/auth/register?role=pro"); },
              },
            ].map(({ icon: Icon, title, desc, onClick }) => (
              <motion.button
                key={title}
                onClick={onClick}
                className="border border-hairline rounded-card p-3 sm:p-5 text-center cursor-pointer bg-surface-1"
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

          <div className="border-t border-hairline mt-5 sm:mt-6 pt-4 sm:pt-5 text-center">
            <span className="text-body-s text-ink-tertiary">Déjà un compte ? </span>
            <button
              onClick={() => { onOpenChange(false); setLocation("/auth/login"); }}
              className="text-body-s text-accent font-medium bg-transparent border-0 cursor-pointer p-0"
            >
              Se connecter
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────
   Full-width sticky header — search page only
───────────────────────────────────────────────────────── */
function TopBarSearch({ onCommencer }: { onCommencer: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
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
                  {menuOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          )}
          <AuthActions onCommencer={onCommencer} compact={isMobile} />
        </div>
      </header>

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
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Floating pill nav — all other pages
───────────────────────────────────────────────────────── */
function TopBarPill({ onCommencer }: { onCommencer: () => void }) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <>
      {/* Outer sticky wrapper */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          paddingTop: 16,
          paddingInline: isMobile ? 12 : 20,
          paddingBottom: 4,
          background: "transparent",
          pointerEvents: "none",
        }}
      >
        {/* Pill */}
        <div
          style={{
            maxWidth: 860,
            marginInline: "auto",
            height: 52,
            borderRadius: 9999,
            backgroundColor: "rgba(251,251,252,0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(12,12,14,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingInline: isMobile ? 14 : 20,
            gap: 16,
            pointerEvents: "auto",
          }}
        >
          {/* Left: logo */}
          <Link href="/" className="no-underline shrink-0">
            <Logo size="md" />
          </Link>

          {/* Center: nav links (desktop only) */}
          {!isMobile && (
            <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
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

          {/* Right: hamburger (mobile) + auth actions */}
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
                    {menuOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            )}
            <AuthActions onCommencer={onCommencer} compact={isMobile} />
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            style={{
              position: "fixed",
              top: 72,
              left: 12,
              right: 12,
              zIndex: 199,
              backgroundColor: "rgba(251,251,252,0.98)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(12,12,14,0.10)",
              borderRadius: 16,
              padding: "6px 0",
              overflow: "hidden",
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

            {/* Divider + search CTA */}
            <div style={{ height: 1, backgroundColor: "rgba(12,12,14,0.08)", margin: "6px 0" }} />
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: NAV_LINKS.length * 0.04, duration: 0.2 }}
            >
              <button
                onClick={() => { setMenuOpen(false); setLocation("/search"); }}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "13px 20px",
                  fontSize: 13, fontWeight: 600,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  color: "var(--accent)",
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font)",
                  transition: "background-color 140ms ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-tint)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                Rechercher un salon →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Main export — routes to the right variant
───────────────────────────────────────────────────────── */
export function TopBar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  const isSearch = location === "/search" || location.startsWith("/search?");

  return (
    <>
      {isSearch ? (
        <TopBarSearch onCommencer={() => setOpen(true)} />
      ) : (
        <TopBarPill onCommencer={() => setOpen(true)} />
      )}
      <OnboardingModal open={open} onOpenChange={setOpen} />
    </>
  );
}
