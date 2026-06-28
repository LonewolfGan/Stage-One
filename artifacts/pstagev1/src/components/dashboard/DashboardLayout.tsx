import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Calendar, Scissors, Users, BarChart2,
  Settings, Home, Menu, Bell,
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

const RAIL_W     = 64;
const RAIL_GAP   = 10;
const RAIL_TOTAL = RAIL_W + RAIL_GAP * 2; // space reserved on the left

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
  breadcrumb?: string;
}

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-panel)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--hairline)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: 6, backgroundColor: "var(--accent)", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 600, padding: "1px 6px", verticalAlign: "middle" }}>
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
            ) : (
              notifications.map((n) => (
                <motion.div
                  key={n.id}
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                  whileHover={{ backgroundColor: "rgba(12,12,14,0.025)" }}
                  style={{ padding: "12px 16px", borderBottom: "1px solid var(--hairline)", cursor: n.isRead ? "default" : "pointer", display: "flex", gap: 10, alignItems: "flex-start", backgroundColor: n.isRead ? "transparent" : "rgba(12,12,14,0.02)" }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: n.isRead ? "transparent" : "var(--accent)", flexShrink: 0, marginTop: 5 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-secondary)", margin: "2px 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</p>
                    <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0 }}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Floating light pill rail ── */
function Rail({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();

  return (
    <aside
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "var(--surface-1)",
        border: "1px solid var(--hairline)",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 0",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 16 }}>
        <div
          className="ds-rail-brand"
          title="Accueil"
        >
          <span>A</span>
        </div>
      </Link>

      <div className="ds-rail-sep" />

      {/* Nav */}
      <nav style={{ flex: 1, width: "100%", padding: "12px 8px 0", display: "flex", flexDirection: "column", gap: 2, overflow: "visible" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{ textDecoration: "none", display: "block", width: "100%" }}
              onClick={onClose}
            >
              <div
                className={`ds-rail-item${isActive ? " ds-rail-item--active" : ""}`}
                data-tip={item.name}
              >
                {isActive && <span className="ds-rail-pip" />}
                <item.icon
                  size={17}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  color={isActive ? "var(--ink)" : "var(--ink-tertiary)"}
                />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ width: "100%", padding: "0 8px" }}>
        <div className="ds-rail-sep" style={{ margin: "0 auto 10px" }} />

        <Link href="/" style={{ textDecoration: "none", display: "block", width: "100%", marginBottom: 8 }}>
          <div className="ds-rail-item" data-tip="Voir le site">
            <Home size={15} strokeWidth={1.7} color="var(--ink-tertiary)" />
          </div>
        </Link>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="ds-rail-avatar" title="Salon Atlas">SA</div>
        </div>
      </div>

      <style>{`
        .ds-rail-brand {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--surface-2);
          border: 1px solid var(--hairline);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 120ms ease, border-color 120ms ease;
        }
        .ds-rail-brand:hover { background: var(--surface-3); border-color: var(--hairline-strong); }
        .ds-rail-brand span {
          font-size: 12px; font-weight: 600; color: var(--ink);
          letter-spacing: -0.02em; line-height: 1; font-family: var(--font);
        }

        .ds-rail-sep {
          width: 24px; height: 1px;
          background: var(--hairline);
          flex-shrink: 0;
        }

        .ds-rail-item {
          position: relative; width: 100%; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background-color 120ms ease;
          background: transparent;
        }
        .ds-rail-item:hover { background: var(--surface-2); }
        .ds-rail-item--active {
          background: var(--surface-2);
        }
        .ds-rail-item--active:hover { background: var(--surface-3); }

        /* Tooltip */
        .ds-rail-item[data-tip]::after {
          content: attr(data-tip);
          position: absolute; left: calc(100% + 10px); top: 50%;
          transform: translateY(-50%) translateX(-4px);
          background: var(--ink); color: #FFFFFF;
          font-size: 11px; font-weight: 500; font-family: var(--font);
          padding: 4px 9px; border-radius: 6px;
          white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 100ms ease, transform 100ms ease;
          z-index: 9999; letter-spacing: -0.01em;
        }
        .ds-rail-item[data-tip]:hover::after { opacity: 1; transform: translateY(-50%) translateX(0); }

        /* Active left pip */
        .ds-rail-pip {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 2px; height: 13px; background: var(--ink); border-radius: 0 2px 2px 0;
        }

        .ds-rail-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--surface-3);
          border: 1.5px solid var(--hairline-strong);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 600; color: var(--ink-secondary);
          cursor: pointer; letter-spacing: 0.04em; font-family: var(--font);
          transition: background 120ms ease;
        }
        .ds-rail-avatar:hover { background: var(--surface-4); }

        @media (prefers-reduced-motion: reduce) {
          .ds-rail-item, .ds-rail-item[data-tip]::after, .ds-rail-brand, .ds-rail-avatar { transition: none; }
        }
      `}</style>
    </aside>
  );
}

export function DashboardLayout({ children, title, actions, breadcrumb }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { isLg } = useBreakpoint();
  const { unreadCount } = useNotifications();

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--canvas)" }}>

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {!isLg && sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.32)", zIndex: 40 }}
          />
        )}
      </AnimatePresence>

      {/* ── Floating pill rail ── */}
      {isLg ? (
        <div
          style={{
            position: "fixed",
            top: RAIL_GAP,
            left: RAIL_GAP,
            bottom: RAIL_GAP,
            width: RAIL_W,
            zIndex: 50,
          }}
        >
          <Rail />
        </div>
      ) : (
        <motion.div
          initial={false}
          animate={{ x: sidebarOpen ? 0 : -(RAIL_W + RAIL_GAP + 8) }}
          transition={{ type: "spring", stiffness: 440, damping: 40 }}
          style={{
            position: "fixed",
            top: RAIL_GAP,
            left: RAIL_GAP,
            bottom: RAIL_GAP,
            width: RAIL_W,
            zIndex: 50,
          }}
        >
          <Rail onClose={() => setSidebarOpen(false)} />
        </motion.div>
      )}

      {/* ── Main (offset by pill + gaps) ── */}
      <main
        className="ds-dash-main"
        style={{
          marginLeft: isLg ? RAIL_TOTAL : 0,
          flex: 1,
          minWidth: 0,
          width: "100%",
        }}
      >
        <motion.div
          className="ds-dash-page-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
                    style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--accent)", border: "1.5px solid var(--surface-1)" }}
                  />
                )}
              </motion.button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="ds-dash-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1], delay: 0.08 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
