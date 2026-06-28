import { Link, useLocation } from "wouter";
import { Calendar, Scissors, Users, BarChart, Star, Settings, Home } from "lucide-react";

const NAV_ITEMS = [
  { name: "Agenda",       href: "/dashboard/agenda",    icon: Calendar },
  { name: "Prestations",  href: "/dashboard/services",  icon: Scissors },
  { name: "Équipe",       href: "/dashboard/staff",     icon: Users    },
  { name: "Statistiques", href: "/dashboard/analytics", icon: BarChart },
  { name: "Avis",         href: "/dashboard/reviews",   icon: Star     },
  { name: "Paramètres",   href: "/dashboard/settings",  icon: Settings },
];

const RAIL_W   = 64;
const RAIL_GAP = 10;

export function DashboardSidebar() {
  const [location] = useLocation();

  return (
    <>
      {/* Fixed floating pill */}
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
          <Link href="/" style={{ textDecoration: "none", marginBottom: 16 }}>
            <div className="dbs-brand"><span>A</span></div>
          </Link>

          <div className="dbs-sep" />

          <nav style={{ flex: 1, width: "100%", padding: "12px 8px 0", display: "flex", flexDirection: "column", gap: 2, overflow: "visible" }}>
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.name} href={item.href} style={{ textDecoration: "none", display: "block", width: "100%" }}>
                  <div className={`dbs-item${isActive ? " dbs-item--active" : ""}`} data-tip={item.name}>
                    {isActive && <span className="dbs-pip" />}
                    <item.icon size={17} strokeWidth={isActive ? 2.2 : 1.7} color={isActive ? "var(--ink)" : "var(--ink-tertiary)"} />
                  </div>
                </Link>
              );
            })}
          </nav>

          <div style={{ width: "100%", padding: "0 8px" }}>
            <div className="dbs-sep" style={{ margin: "0 auto 10px" }} />
            <Link href="/" style={{ textDecoration: "none", display: "block", width: "100%", marginBottom: 8 }}>
              <div className="dbs-item" data-tip="Voir le site">
                <Home size={15} strokeWidth={1.7} color="var(--ink-tertiary)" />
              </div>
            </Link>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className="dbs-avatar">SA</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Spacer for flex layout */}
      <div style={{ width: RAIL_W + RAIL_GAP * 2, flexShrink: 0 }} />

      <style>{`
        .dbs-brand {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--surface-2); border: 1px solid var(--hairline);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 120ms ease;
        }
        .dbs-brand:hover { background: var(--surface-3); }
        .dbs-brand span { font-size: 12px; font-weight: 600; color: var(--ink); letter-spacing: -0.02em; }
        .dbs-sep { width: 24px; height: 1px; background: var(--hairline); flex-shrink: 0; }
        .dbs-item {
          position: relative; width: 100%; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background-color 120ms ease; background: transparent;
        }
        .dbs-item:hover { background: var(--surface-2); }
        .dbs-item--active { background: var(--surface-2); }
        .dbs-item--active:hover { background: var(--surface-3); }
        .dbs-item[data-tip]::after {
          content: attr(data-tip); position: absolute; left: calc(100% + 10px); top: 50%;
          transform: translateY(-50%) translateX(-4px);
          background: var(--ink); color: #FFFFFF;
          font-size: 11px; font-weight: 500; padding: 4px 9px; border-radius: 6px;
          white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 100ms ease, transform 100ms ease; z-index: 9999;
        }
        .dbs-item[data-tip]:hover::after { opacity: 1; transform: translateY(-50%) translateX(0); }
        .dbs-pip {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 2px; height: 13px; background: var(--ink); border-radius: 0 2px 2px 0;
        }
        .dbs-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--surface-3); border: 1.5px solid var(--hairline-strong);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 600; color: var(--ink-secondary); cursor: pointer;
          transition: background 120ms ease;
        }
        .dbs-avatar:hover { background: var(--surface-4); }
      `}</style>
    </>
  );
}
