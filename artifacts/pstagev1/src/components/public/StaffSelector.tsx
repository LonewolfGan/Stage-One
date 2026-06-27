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
          border: `1px solid ${selectedStaffId === null ? "#D4466E" : "rgba(12, 12, 14, 0.10)"}`,
          borderRadius: 8,
          backgroundColor: selectedStaffId === null ? "#FBEEF1" : "transparent",
          color: selectedStaffId === null ? "#D4466E" : "#0C0C0E",
          cursor: "pointer",
          transition: "border-color 140ms ease, background-color 140ms ease, color 140ms ease",
        }}
        onMouseEnter={(e) => {
          if (selectedStaffId !== null) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "#D4466E";
            el.style.color = "#D4466E";
          }
        }}
        onMouseLeave={(e) => {
          if (selectedStaffId !== null) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "rgba(12, 12, 14, 0.10)";
            el.style.color = "#0C0C0E";
          }
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: selectedStaffId === null ? "rgba(212, 70, 110, 0.15)" : "rgba(12,12,14,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: selectedStaffId === null ? "#D4466E" : "#8C8A82",
          }}
        >
          --
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
              border: `1px solid ${isSelected ? "#D4466E" : "rgba(12, 12, 14, 0.10)"}`,
              borderRadius: 8,
              backgroundColor: isSelected ? "#FBEEF1" : "transparent",
              color: isSelected ? "#D4466E" : "#0C0C0E",
              cursor: "pointer",
              transition: "border-color 140ms ease, background-color 140ms ease, color 140ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "#D4466E";
                el.style.color = "#D4466E";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "rgba(12, 12, 14, 0.10)";
                el.style.color = "#0C0C0E";
              }
            }}
          >
            <img
              src={member.photoUrl}
              alt={member.name}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>{member.firstName}</span>
          </button>
        );
      })}
    </div>
  );
}
