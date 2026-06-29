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

const RAIL_W     = 72;
const RAIL_GAP   = 8;
const RAIL_BG    = "#181A1F";
const ROSE       = "#D4466E";
const ROSE_ACTIVE = "rgba(212,70,110,0.13)";

export function DashboardSidebar() {
  const [location] = useLocation();

  return (
    <>
      <div style={{ position: "fixed", top: RAIL_GAP, left: RAIL_GAP, bottom: RAIL_GAP, width: RAIL_W, zIndex: 50 }}>
        <aside
          style={{
            width: "100%", height: "100%",
            backgroundColor: RAIL_BG,
            borderRadius: 16,
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "18px 0 16px",
            overflow: "visible",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <div className="dbs2-brand"><span>A</span></div>
          </Link>

          <div className="dbs2-sep" style={{ margin: "18px auto" }} />

          <nav style={{ flex: 1, width: "100%", padding: "0 8px", display: "flex", flexDirection: "column", gap: 2, overflow: "visible" }}>
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/") || (item.href === "/dashboard/agenda" && location === "/dashboard/reservations");
              return (
                <Link key={item.name} href={item.href} style={{ textDecoration: "none", display: "block", width: "100%" }}>
                  <div className={`dbs2-item${isActive ? " dbs2-item--active" : ""}`} data-tip={item.name}>
                    {isActive && <span className="dbs2-pip" />}
                    <item.icon size={18} strokeWidth={isActive ? 2.1 : 1.6} color={isActive ? "#FFFFFF" : "rgba(255,255,255,0.38)"} />
                  </div>
                </Link>
              );
            })}
          </nav>

          <div style={{ width: "100%", padding: "0 8px" }}>
            <div className="dbs2-sep" style={{ margin: "0 auto 12px" }} />
            <Link href="/" style={{ textDecoration: "none", display: "block", width: "100%", marginBottom: 10 }}>
              <div className="dbs2-item" data-tip="Voir le site">
                <Home size={16} strokeWidth={1.6} color="rgba(255,255,255,0.28)" />
              </div>
            </Link>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className="dbs2-avatar">SA</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Spacer */}
      <div style={{ width: RAIL_W + RAIL_GAP + 8, flexShrink: 0 }} />

      <style>{`
        .dbs2-brand {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 140ms ease; flex-shrink: 0;
        }
        .dbs2-brand:hover { background: rgba(255,255,255,0.12); }
        .dbs2-brand span { font-size: 14px; font-weight: 600; color: #FFF; letter-spacing: -0.02em; }
        .dbs2-sep { width: 28px; height: 1px; background: rgba(255,255,255,0.08); flex-shrink: 0; }
        .dbs2-item {
          position: relative; width: 100%; height: 40px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background-color 120ms ease; background: transparent;
        }
        .dbs2-item:hover { background: rgba(255,255,255,0.06); }
        .dbs2-item--active { background: ${ROSE_ACTIVE}; }
        .dbs2-item--active:hover { background: rgba(212,70,110,0.18); }
        .dbs2-item[data-tip]::after {
          content: attr(data-tip);
          position: absolute; left: calc(100% + 12px); top: 50%;
          transform: translateY(-50%) translateX(-4px);
          background: #0C0C0E; color: #FFF;
          font-size: 11px; font-weight: 500; padding: 5px 10px; border-radius: 6px;
          white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 100ms ease, transform 100ms ease; z-index: 9999;
        }
        .dbs2-item[data-tip]:hover::after { opacity: 1; transform: translateY(-50%) translateX(0); }
        .dbs2-pip {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 2.5px; height: 16px; background: ${ROSE}; border-radius: 0 3px 3px 0;
        }
        .dbs2-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.50);
          cursor: pointer; transition: background 140ms ease;
        }
        .dbs2-avatar:hover { background: rgba(255,255,255,0.13); }
      `}</style>
    </>
  );
}
