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

const RAIL_W   = 72;
const RAIL_BG  = "#131416";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
  breadcrumb?: string;
}

function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--hairline)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "1px 6px",
                    verticalAlign: "middle",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 11,
                  color: "var(--ink-secondary)",
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--ink-tertiary)",
                  fontSize: 13,
                }}
              >
                <Bell size={28} style={{ margin: "0 auto 10px", opacity: 0.3, display: "block" }} />
                Aucune notification
              </div>
            ) : (
              notifications.map((n) => (
                <motion.div
                  key={n.id}
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                  whileHover={{ backgroundColor: "rgba(12,12,14,0.025)" }}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--hairline)",
                    cursor: n.isRead ? "default" : "pointer",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    backgroundColor: n.isRead ? "transparent" : "rgba(12,12,14,0.02)",
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: n.isRead ? "transparent" : "var(--accent)",
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: n.isRead ? 400 : 600,
                        color: "var(--ink)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--ink-secondary)",
                        margin: "2px 0 4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.body}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0 }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                    </p>
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

/* ── Dark icon rail ── */
function Rail({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside className="ds-rail">
      {/* Brand mark */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <div className="ds-rail-brand">
          <span>A</span>
        </div>
      </Link>

      <div className="ds-rail-divider" style={{ margin: "20px 0" }} />

      {/* Nav */}
      <nav className="ds-rail-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const isHovered = hovered === item.name;
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
                onMouseEnter={() => setHovered(item.name)}
                onMouseLeave={() => setHovered(null)}
              >
                {isActive && <span className="ds-rail-pip" />}
                <item.icon
                  size={17}
                  strokeWidth={isActive ? 2 : 1.75}
                  color={isActive ? "#FFFFFF" : isHovered ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.38)"}
                />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="ds-rail-bottom">
        <div className="ds-rail-divider" style={{ marginBottom: 16 }} />

        {/* Home link */}
        <Link href="/" style={{ textDecoration: "none", display: "block", width: "100%", padding: "0 10px", marginBottom: 8 }}>
          <div
            className="ds-rail-item"
            data-tip="Voir le site"
          >
            <Home size={17} strokeWidth={1.75} color="rgba(255,255,255,0.28)" />
          </div>
        </Link>

        {/* User avatar */}
        <div className="ds-rail-avatar" title="Salon Atlas">SA</div>
      </div>

      <style>{`
        .ds-rail {
          width: ${RAIL_W}px;
          height: 100vh;
          background: ${RAIL_BG};
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
          flex-shrink: 0;
          position: relative;
        }

        .ds-rail-brand {
          width: 34px;
          height: 34px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 140ms ease;
          cursor: pointer;
        }
        .ds-rail-brand:hover { background: rgba(255,255,255,0.12); }
        .ds-rail-brand span {
          font-size: 13px;
          font-weight: 600;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          line-height: 1;
          font-family: var(--font);
        }

        .ds-rail-divider {
          width: 28px;
          height: 1px;
          background: rgba(255,255,255,0.07);
          flex-shrink: 0;
        }

        .ds-rail-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          width: 100%;
          padding: 0 10px;
          overflow: visible;
        }

        .ds-rail-item {
          position: relative;
          width: 100%;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 140ms ease;
          background: transparent;
        }
        .ds-rail-item:hover { background: rgba(255,255,255,0.06); }
        .ds-rail-item--active { background: rgba(255,255,255,0.09); }
        .ds-rail-item--active:hover { background: rgba(255,255,255,0.12); }

        /* CSS tooltip */
        .ds-rail-item[data-tip]::after {
          content: attr(data-tip);
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%) translateX(-4px);
          background: #0C0C0E;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 500;
          font-family: var(--font);
          padding: 5px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 120ms ease, transform 120ms ease;
          z-index: 9999;
          letter-spacing: -0.01em;
        }
        .ds-rail-item[data-tip]:hover::after {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        /* Active pip */
        .ds-rail-pip {
          position: absolute;
          left: 1px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 14px;
          background: #FFFFFF;
          border-radius: 2px;
        }

        .ds-rail-bottom {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .ds-rail-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255,255,255,0.09);
          border: 1.5px solid rgba(255,255,255,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          letter-spacing: 0.02em;
          font-family: var(--font);
          transition: background 140ms ease, border-color 140ms ease;
        }
        .ds-rail-avatar:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.24);
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-rail-item,
          .ds-rail-item[data-tip]::after,
          .ds-rail-brand,
          .ds-rail-avatar {
            transition: none;
          }
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              zIndex: 40,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Rail (desktop: sticky | mobile: fixed drawer) ── */}
      {isLg ? (
        <div style={{ position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
          <Rail />
        </div>
      ) : (
        <motion.div
          key="mobile-rail"
          initial={false}
          animate={{ x: sidebarOpen ? 0 : -RAIL_W }}
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            zIndex: 50,
          }}
        >
          <Rail onClose={() => setSidebarOpen(false)} />
        </motion.div>
      )}

      {/* ── Main content ── */}
      <main
        className="ds-dash-main"
        style={{ marginLeft: isLg ? 0 : 0, flex: 1, minWidth: 0, width: "100%" }}
      >
        {/* Page header */}
        <motion.div
          className="ds-dash-page-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1] }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {!isLg && (
              <motion.button
                onClick={() => setSidebarOpen(true)}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(12,12,14,0.04)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-control)",
                  cursor: "pointer",
                  color: "var(--ink-secondary)",
                  flexShrink: 0,
                }}
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

          {/* Right: actions + bell */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {actions}

            <div style={{ position: "relative" }}>
              <motion.button
                onClick={() => setNotifOpen((v) => !v)}
                whileTap={{ scale: 0.91 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: notifOpen ? "rgba(12,12,14,0.06)" : "rgba(12,12,14,0.04)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-control)",
                  cursor: "pointer",
                  color: "var(--ink-secondary)",
                  position: "relative",
                }}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "var(--accent)",
                      border: "1.5px solid var(--surface-1)",
                    }}
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
          transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1], delay: 0.1 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
