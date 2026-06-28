import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Calendar, Scissors, Users, BarChart2,
  Settings, Home, ChevronRight, Menu, X, Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Logo } from "@/components/ui/Logo";
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
          {/* Header */}
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

          {/* List */}
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
                  {/* Unread dot */}
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

export function DashboardLayout({ children, title, actions, breadcrumb }: DashboardLayoutProps) {
  const [location] = useLocation();
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
              backgroundColor: "rgba(0,0,0,0.28)",
              zIndex: 40,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 220,
          height: "100vh",
          backgroundColor: "var(--surface-1)",
          borderRight: "1px solid var(--hairline)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 50,
          transform: isLg || sidebarOpen ? "translateX(0)" : "translateX(-220px)",
          transition: "transform 240ms cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "16px 16px 14px",
            borderBottom: "1px solid var(--hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--hairline-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Logo size="sm" />
            </div>
          </Link>
          {!isLg && (
            <motion.button
              onClick={() => setSidebarOpen(false)}
              whileTap={{ scale: 0.9, rotate: 90 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                padding: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-tertiary)",
                display: "flex",
                alignItems: "center",
                borderRadius: 6,
              }}
            >
              <X size={16} />
            </motion.button>
          )}
        </div>

        {/* Salon badge */}
        <div style={{ padding: "10px 16px 14px", borderBottom: "1px solid var(--hairline)" }}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35, ease: [0.0, 0.0, 0.2, 1] }}
            style={{
              padding: "8px 10px",
              backgroundColor: "rgba(12,12,14,0.04)",
              borderRadius: "var(--radius-control)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius-full)",
                backgroundColor: "rgba(12,12,14,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ink)",
                flexShrink: 0,
              }}
            >
              SA
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Salon Atlas
              </p>
              <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0, fontWeight: 500 }}>Plan Pro</p>
            </div>
          </motion.div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.05, duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
              >
                <Link href={item.href} style={{ textDecoration: "none" }} onClick={() => setSidebarOpen(false)}>
                  <motion.div
                    whileHover={{ backgroundColor: isActive ? "var(--surface-3)" : "rgba(12,12,14,0.04)", x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      height: 34,
                      paddingInline: 10,
                      borderRadius: "var(--radius-control)",
                      backgroundColor: isActive ? "var(--surface-2)" : "transparent",
                      color: isActive ? "var(--ink)" : "var(--ink-secondary)",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <item.icon size={15} style={{ flexShrink: 0 }} />
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        style={{
                          position: "absolute",
                          left: 0,
                          width: 2,
                          height: 18,
                          borderRadius: "0 2px 2px 0",
                          backgroundColor: "var(--ink)",
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer link */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid var(--hairline)" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <motion.div
              whileHover={{ color: "var(--ink)", x: 2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                height: 34,
                paddingInline: 10,
                borderRadius: "var(--radius-control)",
                color: "var(--ink-tertiary)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Home size={15} style={{ flexShrink: 0 }} />
              Voir le site
            </motion.div>
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        className="ds-dash-main"
        style={{ marginLeft: isLg ? 220 : 0, flex: 1, minWidth: 0, width: "100%" }}
      >
        {/* Page header — flush to top, rounded only on bottom */}
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
                  <ChevronRight size={12} color="var(--ink-disabled)" />
                  <span style={{ fontSize: 12, color: "var(--ink-secondary)", fontWeight: 500 }}>{breadcrumb}</span>
                </div>
              )}
              <h1 className="ds-dash-page-title">{title}</h1>
            </div>
          </div>

          {/* Right side: actions + bell */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {actions}

            {/* Bell button */}
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
