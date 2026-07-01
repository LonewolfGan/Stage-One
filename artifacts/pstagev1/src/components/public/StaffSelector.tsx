import { UserIcon } from "@/components/ui/user";
import { StaffMember } from "@/lib/types";
import { ds } from "@/lib/design-system";

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
          border: `1px solid ${selectedStaffId === null ? ds.colors.accent : ds.colors.border}`,
          borderRadius: ds.radius.full,
          backgroundColor: selectedStaffId === null ? ds.colors.accent : "transparent",
          color: selectedStaffId === null ? "#FFFFFF" : ds.colors.ink,
          cursor: "pointer",
          transition: "border-color 140ms ease, background-color 140ms ease, color 140ms ease",
        }}
        onMouseEnter={(e) => {
          if (selectedStaffId !== null) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = ds.colors.borderMedium;
          }
        }}
        onMouseLeave={(e) => {
          if (selectedStaffId !== null) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = ds.colors.border;
          }
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: selectedStaffId === null ? "rgba(255,255,255,0.20)" : ds.colors.canvasMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: selectedStaffId === null ? "#FFFFFF" : ds.colors.inkTertiary,
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
              border: `1px solid ${isSelected ? ds.colors.accent : ds.colors.border}`,
              borderRadius: ds.radius.full,
              backgroundColor: isSelected ? ds.colors.accent : "transparent",
              color: isSelected ? "#FFFFFF" : ds.colors.ink,
              cursor: "pointer",
              transition: "border-color 140ms ease, background-color 140ms ease, color 140ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = ds.colors.borderMedium;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = ds.colors.border;
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
                  backgroundColor: isSelected ? "rgba(255,255,255,0.20)" : ds.colors.canvasMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: isSelected ? "#FFFFFF" : ds.colors.inkTertiary,
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
