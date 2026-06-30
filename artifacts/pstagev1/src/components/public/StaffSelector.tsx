import { UserIcon } from "@/components/ui/user";
import { StaffMember } from "@/lib/types";

interface StaffSelectorProps {
  staff: StaffMember[];
  selectedStaffId: string | null;
  onSelectStaff: (id: string | null) => void;
}

export function StaffSelector({ staff, selectedStaffId, onSelectStaff }: StaffSelectorProps) {
  return (
    <div style={{ display: "flex", overflowX: "auto", gap: 8, paddingBottom: 4 }}>
      <button
        onClick={() => onSelectStaff(null)}
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 44,
          paddingLeft: 16,
          paddingRight: 16,
          border: `1px solid ${selectedStaffId === null ? "var(--accent)" : "rgba(12, 12, 14, 0.10)"}`,
          borderRadius: 9999,
          backgroundColor: selectedStaffId === null ? "var(--accent)" : "transparent",
          color: selectedStaffId === null ? "#FFFFFF" : "#0C0C0E",
          cursor: "pointer",
          transition: "border-color 140ms ease, background-color 140ms ease, color 140ms ease",
        }}
        onMouseEnter={(e) => {
          if (selectedStaffId !== null) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "rgba(12,12,14,0.30)";
          }
        }}
        onMouseLeave={(e) => {
          if (selectedStaffId !== null) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "rgba(12, 12, 14, 0.10)";
          }
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: selectedStaffId === null ? "rgba(255,255,255,0.20)" : "rgba(12,12,14,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: selectedStaffId === null ? "#FFFFFF" : "var(--ink-tertiary)",
          }}
        >
          <UserIcon size={14} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Pas de préférence</span>
      </button>

      {staff.map((member) => {
        const isSelected = selectedStaffId === member.id;
        return (
          <button
            key={member.id}
            onClick={() => onSelectStaff(member.id)}
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 44,
              paddingLeft: 16,
              paddingRight: 16,
              border: `1px solid ${isSelected ? "var(--accent)" : "rgba(12, 12, 14, 0.10)"}`,
              borderRadius: 9999,
              backgroundColor: isSelected ? "var(--accent)" : "transparent",
              color: isSelected ? "#FFFFFF" : "#0C0C0E",
              cursor: "pointer",
              transition: "border-color 140ms ease, background-color 140ms ease, color 140ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "rgba(12,12,14,0.30)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "rgba(12, 12, 14, 0.10)";
              }
            }}
          >
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  objectFit: "cover",
                  opacity: isSelected ? 0.9 : 1,
                }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: isSelected ? "rgba(255,255,255,0.20)" : "rgba(12,12,14,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: isSelected ? "#FFFFFF" : "var(--ink-tertiary)",
                  letterSpacing: "-0.01em",
                  flexShrink: 0,
                }}
              >
                {member.initials}
              </div>
            )}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{member.firstName}</span>
          </button>
        );
      })}
    </div>
  );
}
