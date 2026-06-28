import { Link, useLocation } from "wouter";
import { Calendar, Scissors, Users, BarChart, Settings, Star } from "lucide-react";

const NAV_ITEMS = [
  { name: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { name: "Prestations", href: "/dashboard/services", icon: Scissors },
  { name: "Équipe", href: "/dashboard/staff", icon: Users },
  { name: "Statistiques", href: "/dashboard/analytics", icon: BarChart },
  { name: "Avis", href: "/dashboard/reviews", icon: Star },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const [location] = useLocation();

  return (
    <aside
      style={{
        width: 224,
        height: "100vh",
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid rgba(12, 12, 14, 0.08)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid rgba(12, 12, 14, 0.08)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              display: "block",
            }}
          >
            pstagev1
          </span>
        </Link>
        <span
          style={{
            fontSize: 12,
            color: "rgba(12,12,14,0.45)",
            display: "block",
            marginTop: 2,
          }}
        >
          Salon Atlas
        </span>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  height: 32,
                  paddingLeft: 12,
                  paddingRight: 12,
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "background-color 140ms ease",
                  backgroundColor: isActive ? "#FFFFFF" : "transparent",
                  border: isActive ? "1px solid rgba(12, 12, 14, 0.08)" : "1px solid transparent",
                  color: isActive ? "#0C0C0E" : "rgba(12,12,14,0.65)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "#FFFFFF";
                    (e.currentTarget as HTMLDivElement).style.color = "#0C0C0E";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLDivElement).style.color = "rgba(12,12,14,0.65)";
                  }
                }}
              >
                <item.icon
                  size={15}
                  color={isActive ? "#0C0C0E" : "rgba(12,12,14,0.45)"}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User row */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid rgba(12, 12, 14, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "rgba(12,12,14,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(12,12,14,0.65)",
              flexShrink: 0,
            }}
          >
            SA
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#0C0C0E",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Salon Atlas
            </p>
            <p style={{ fontSize: 11, color: "var(--ink-tertiary)", fontWeight: 500 }}>
              Plan Pro
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
