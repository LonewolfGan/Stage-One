import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Calendar, Scissors, Users, BarChart2,
  Settings, Home, ChevronRight, Menu, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Logo } from "@/components/ui/Logo";

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

export function DashboardLayout({ children, title, actions, breadcrumb }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLg } = useBreakpoint();

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
                backgroundColor: "var(--accent-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--accent)",
                flexShrink: 0,
              }}
            >
              SA
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Salon Atlas
              </p>
              <p style={{ fontSize: 11, color: "var(--accent)", margin: 0, fontWeight: 500 }}>Plan Pro</p>
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
                    whileHover={{ backgroundColor: isActive ? "var(--accent-tint)" : "rgba(12,12,14,0.04)", x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      height: 34,
                      paddingInline: 10,
                      borderRadius: "var(--radius-control)",
                      backgroundColor: isActive ? "var(--accent-tint)" : "transparent",
                      color: isActive ? "var(--accent)" : "var(--ink-secondary)",
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
                          width: 3,
                          height: 20,
                          borderRadius: "0 2px 2px 0",
                          backgroundColor: "var(--accent)",
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
        {/* Page header */}
        <motion.div
          className="ds-dash-page-header"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1] }}
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
          {actions && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {actions}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1], delay: 0.1 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
