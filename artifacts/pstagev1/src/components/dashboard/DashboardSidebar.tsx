import { Link, useLocation } from "wouter";
import { Calendar, Scissors, Users, BarChart, Settings, Star } from "lucide-react";

const NAV_ITEMS = [
  { name: "Agenda",       href: "/dashboard/agenda",    icon: Calendar  },
  { name: "Prestations",  href: "/dashboard/services",  icon: Scissors  },
  { name: "Équipe",       href: "/dashboard/staff",     icon: Users     },
  { name: "Statistiques", href: "/dashboard/analytics", icon: BarChart  },
  { name: "Avis",         href: "/dashboard/reviews",   icon: Star      },
  { name: "Paramètres",   href: "/dashboard/settings",  icon: Settings  },
];

const RAIL_BG          = "#131416";
const ICON_INACTIVE    = "rgba(255,255,255,0.36)";
const ICON_ACTIVE      = "#FFFFFF";

export function DashboardSidebar() {
  const [location] = useLocation();

  return (
    <aside className="rail-sidebar">
      {/* Brand mark */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 24 }}>
        <div className="rail-brand">
          <span>A</span>
        </div>
      </Link>

      <div className="rail-divider" />

      {/* Nav */}
      <nav className="rail-nav">
        {NAV_ITEMS.map((item) => {
          const isActive =
            location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href} style={{ textDecoration: "none", display: "block", width: "100%" }}>
              <div
                className={`rail-nav-item${isActive ? " rail-nav-item--active" : ""}`}
                data-tooltip={item.name}
              >
                {isActive && <span className="rail-pip" />}
                <item.icon
                  size={18}
                  color={isActive ? ICON_ACTIVE : ICON_INACTIVE}
                  strokeWidth={isActive ? 2 : 1.75}
                />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="rail-bottom">
        <div className="rail-divider" style={{ marginBottom: 16 }} />
        <div className="rail-avatar">
          SA
        </div>
      </div>

      <style>{`
        .rail-sidebar {
          width: 72px;
          height: 100vh;
          background: ${RAIL_BG};
          display: flex;
          flex-direction: column;
          align-items: center;
          position: sticky;
          top: 0;
          flex-shrink: 0;
          padding: 20px 0;
          z-index: 10;
        }

        .rail-brand {
          width: 34px;
          height: 34px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 140ms ease;
        }
        .rail-brand:hover {
          background: rgba(255,255,255,0.12);
        }
        .rail-brand span {
          font-size: 13px;
          font-weight: 600;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          font-family: var(--font);
          line-height: 1;
        }

        .rail-divider {
          width: 28px;
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin-bottom: 20px;
          flex-shrink: 0;
        }

        .rail-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          width: 100%;
          padding: 0 10px;
          overflow: visible;
        }

        .rail-nav-item {
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
        .rail-nav-item:hover {
          background: rgba(255,255,255,0.06);
        }
        .rail-nav-item:hover svg {
          color: rgba(255,255,255,0.80) !important;
          stroke: rgba(255,255,255,0.80) !important;
        }
        .rail-nav-item--active {
          background: rgba(255,255,255,0.09);
        }
        .rail-nav-item--active:hover {
          background: rgba(255,255,255,0.12);
        }

        /* Tooltip */
        .rail-nav-item::after {
          content: attr(data-tooltip);
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
        .rail-nav-item:hover::after {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        /* Active pip */
        .rail-pip {
          position: absolute;
          left: 1px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 14px;
          background: #FFFFFF;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .rail-bottom {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 10px;
        }

        .rail-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.09);
          border: 1.5px solid rgba(255,255,255,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.60);
          cursor: pointer;
          letter-spacing: 0.02em;
          font-family: var(--font);
          transition: background 140ms ease, border-color 140ms ease;
        }
        .rail-avatar:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.24);
        }

        @media (prefers-reduced-motion: reduce) {
          .rail-nav-item,
          .rail-nav-item::after,
          .rail-brand,
          .rail-avatar {
            transition: none;
          }
        }
      `}</style>
    </aside>
  );
}
