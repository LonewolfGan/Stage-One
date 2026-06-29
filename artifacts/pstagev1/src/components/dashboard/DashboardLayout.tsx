import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Calendar, Scissors, Users, BarChart2,
  Settings, Home, Menu, Bell, Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const NAV_ITEMS = [
  { name: "Agenda",       href: "/dashboard/agenda",    icon: Calendar   },
  { name: "Prestations",  href: "/dashboard/services",  icon: Scissors   },
  { name: "Équipe",       href: "/dashboard/staff",     icon: Users      },
  { name: "Statistiques", href: "/dashboard/analytics", icon: BarChart2  },
  { name: "Paramètres",   href: "/dashboard/settings",  icon: Settings   },
];

/* Rail geometry */
const RAIL_W   = 72;
const RAIL_GAP = 8;
const RAIL_TOTAL = RAIL_W + RAIL_GAP + 8; // 88px content offset

/* Colors */
const RAIL_BG     = "#D4466E";
const ROSE        = "#D4466E";
const ROSE_ACTIVE = "rgba(12,12,14,0.78)";

/* Topbar avatar stack — Figma pattern */
const TEAM_AVATARS = [
  { initials: "YA", name: "Yasmine A.", color: "#D4466E" },
  { initials: "SB", name: "Sara B.",    color: "#06B6D4" },
  { initials: "NF", name: "Nadia F.",   color: "#8B5CF6" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
  breadcrumb?: string;
  noPadding?: boolean;
}

/* ── Notification panel ── */
function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 480, damping: 34 }}
          style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340, backgroundColor: "var(--surface-1)", border: "1px solid var(--hairline)", borderRadius: 12, zIndex: 200, overflow: "hidden" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--hairline)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: 6, backgroundColor: ROSE, color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 600, padding: "1px 6px", verticalAlign: "middle" }}>
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 11, color: "var(--ink-secondary)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Tout marquer lu
              </button>
            )}
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--ink-tertiary)", fontSize: 13 }}>
                <Bell size={28} style={{ margin: "0 auto 10px", opacity: 0.3, display: "block" }} />
                Aucune notification
              </div>
            ) : notifications.map((n) => (
              <motion.div
                key={n.id}
                onClick={() => { if (!n.isRead) markRead(n.id); }}
                whileHover={{ backgroundColor: "rgba(12,12,14,0.025)" }}
                style={{ padding: "12px 16px", borderBottom: "1px solid var(--hairline)", cursor: n.isRead ? "default" : "pointer", display: "flex", gap: 10, alignItems: "flex-start", backgroundColor: n.isRead ? "transparent" : "rgba(12,12,14,0.02)" }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: n.isRead ? "transparent" : ROSE, flexShrink: 0, marginTop: 5 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "var(--ink-secondary)", margin: "2px 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</p>
                  <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0 }}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Dark floating rail ── */
function Rail({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();

  return (
    <aside
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: RAIL_BG,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "18px 0 16px",
        overflow: "visible",
      }}
    >
      {/* Brand mark */}
      <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
        <div className="drl-brand">
          <span>A</span>
        </div>
      </Link>

      <div className="drl-sep" style={{ margin: "18px auto" }} />

      {/* Nav */}
      <nav style={{ flex: 1, width: "100%", padding: "0 8px", display: "flex", flexDirection: "column", gap: 2, overflow: "visible" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href} style={{ textDecoration: "none", display: "block", width: "100%" }} onClick={onClose}>
              <div className={`drl-item${isActive ? " drl-item--active" : ""}`} data-tip={item.name}>
                {isActive && <span className="drl-pip" />}
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  color={isActive ? "#FFFFFF" : "rgba(255,255,255,0.70)"}
                />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ width: "100%", padding: "0 8px" }}>
        <div className="drl-sep" style={{ margin: "0 auto 12px" }} />

        <Link href="/" style={{ textDecoration: "none", display: "block", width: "100%", marginBottom: 10 }}>
          <div className="drl-item" data-tip="Voir le site">
            <Home size={16} strokeWidth={1.6} color="rgba(255,255,255,0.70)" />
          </div>
        </Link>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="drl-avatar" title="Salon Atlas">SA</div>
        </div>
      </div>

      <style>{`
        .drl-brand {
          width: 36px; height: 36px;
          background: rgba(12,12,14,0.22);
          border: 1px solid rgba(12,12,14,0.28);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 140ms ease;
          flex-shrink: 0;
        }
        .drl-brand:hover { background: rgba(12,12,14,0.34); }
        .drl-brand span {
          font-size: 14px; font-weight: 700; color: #FFFFFF;
          letter-spacing: -0.02em; line-height: 1; font-family: var(--font);
        }

        .drl-sep {
          width: 28px; height: 1px;
          background: rgba(255,255,255,0.30);
          flex-shrink: 0;
        }

        .drl-item {
          position: relative; width: 100%; height: 40px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background-color 120ms ease;
          background: transparent;
        }
        .drl-item:hover { background: rgba(12,12,14,0.16); }
        .drl-item:hover svg { opacity: 1; }
        .drl-item--active { background: ${ROSE_ACTIVE}; }
        .drl-item--active:hover { background: rgba(12,12,14,0.86); }

        /* Tooltip */
        .drl-item[data-tip]::after {
          content: attr(data-tip);
          position: absolute; left: calc(100% + 12px); top: 50%;
          transform: translateY(-50%) translateX(-4px);
          background: #0C0C0E; color: #FFFFFF;
          font-size: 11px; font-weight: 500; font-family: var(--font);
          padding: 5px 10px; border-radius: 6px;
          white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 100ms ease, transform 100ms ease;
          z-index: 9999; letter-spacing: -0.01em;
        }
        .drl-item[data-tip]:hover::after { opacity: 1; transform: translateY(-50%) translateX(0); }

        /* White active pip (visible on rose bg) */
        .drl-pip {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 2.5px; height: 16px;
          background: #FFFFFF;
          border-radius: 0 3px 3px 0;
        }

        .drl-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(12,12,14,0.22);
          border: 1.5px solid rgba(12,12,14,0.30);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #FFFFFF;
          cursor: pointer; letter-spacing: 0.04em; font-family: var(--font);
          transition: background 140ms ease, border-color 140ms ease;
        }
        .drl-avatar:hover {
          background: rgba(12,12,14,0.36);
          border-color: rgba(12,12,14,0.44);
        }

        @media (prefers-reduced-motion: reduce) {
          .drl-item, .drl-item[data-tip]::after, .drl-brand, .drl-avatar { transition: none; }
        }
      `}</style>
    </aside>
  );
}

export function DashboardLayout({ children, title, actions, breadcrumb, noPadding }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { isLg } = useBreakpoint();
  const { unreadCount } = useNotifications();

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--canvas)" }}>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {!isLg && sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.48)", zIndex: 40 }}
          />
        )}
      </AnimatePresence>

      {/* ── Floating dark pill ── */}
      {isLg ? (
        <div style={{ position: "fixed", top: RAIL_GAP, left: RAIL_GAP, bottom: RAIL_GAP, width: RAIL_W, zIndex: 50 }}>
          <Rail />
        </div>
      ) : (
        <motion.div
          initial={false}
          animate={{ x: sidebarOpen ? 0 : -(RAIL_W + RAIL_GAP + 8) }}
          transition={{ type: "spring", stiffness: 440, damping: 40 }}
          style={{ position: "fixed", top: RAIL_GAP, left: RAIL_GAP, bottom: RAIL_GAP, width: RAIL_W, zIndex: 50 }}
        >
          <Rail onClose={() => setSidebarOpen(false)} />
        </motion.div>
      )}

      {/* Main content */}
      <main
        className="ds-dash-main"
        style={{ marginLeft: isLg ? RAIL_TOTAL : 0, flex: 1, minWidth: 0, width: "100%" }}
      >
        <motion.div
          className="ds-dash-page-header"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {!isLg && (
              <motion.button
                onClick={() => setSidebarOpen(true)}
                whileTap={{ scale: 0.92 }}
                style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(12,12,14,0.04)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-control)", cursor: "pointer", color: "var(--ink-secondary)", flexShrink: 0 }}
              >
                <Menu size={15} />
              </motion.button>
            )}
            <div>
              {breadcrumb && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>Dashboard</span>
                  <span style={{ fontSize: 12, color: "var(--ink-disabled)" }}>›</span>
                  <span style={{ fontSize: 12, color: "var(--ink-secondary)", fontWeight: 500 }}>{breadcrumb}</span>
                </div>
              )}
              <h1 className="ds-dash-page-title">{title}</h1>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {actions}

            {/* Bell */}
            <div style={{ position: "relative" }}>
              <motion.button
                onClick={() => setNotifOpen((v) => !v)}
                whileTap={{ scale: 0.91 }}
                style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: notifOpen ? "rgba(12,12,14,0.06)" : "rgba(12,12,14,0.04)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-control)", cursor: "pointer", color: "var(--ink-secondary)", position: "relative" }}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", backgroundColor: ROSE, border: "1.5px solid var(--surface-1)" }}
                  />
                )}
              </motion.button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            {/* Avatar stack — Figma pattern */}
            {isLg && (
              <div style={{ display: "flex", alignItems: "center", marginLeft: 4 }} role="group" aria-label="Équipe en ligne">
                {TEAM_AVATARS.map((av, i) => (
                  <button
                    key={av.initials}
                    type="button"
                    aria-label={av.name}
                    title={av.name}
                    style={{
                      width: 30, height: 30, borderRadius: "50%",
                      backgroundColor: av.color,
                      border: "2px solid var(--surface-1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700, color: "#fff",
                      marginLeft: i === 0 ? 0 : -8,
                      cursor: "pointer",
                      zIndex: TEAM_AVATARS.length - i,
                      position: "relative",
                      transition: "transform 120ms",
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onFocus={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                    onBlur={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {av.initials}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Ajouter un membre"
                  style={{
                    width: 30, height: 30, borderRadius: "50%",
                    backgroundColor: ROSE,
                    border: "2px solid var(--surface-1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginLeft: -8, cursor: "pointer", zIndex: 0, position: "relative",
                    transition: "background 120ms", padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#c23a5e")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = ROSE)}
                  onFocus={(e) => (e.currentTarget.style.background = "#c23a5e")}
                  onBlur={(e) => (e.currentTarget.style.background = ROSE)}
                >
                  <Plus size={12} color="#fff" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="ds-dash-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.0, 0.0, 0.2, 1], delay: 0.06 }}
          style={noPadding ? { padding: 0 } : undefined}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
