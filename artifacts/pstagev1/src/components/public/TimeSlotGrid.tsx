import { TimeSlot } from "@/lib/types";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (time: string) => void;
}

export function TimeSlotGrid({ slots, selectedSlot, onSelectSlot }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>
        Aucun créneau disponible pour cette date.
      </p>
    );
  }

  return (
    <div className="timeslot-grid">
      {slots.map((slot, idx) => {
        const isSelected = selectedSlot === slot.time;
        return (
          <button
            key={idx}
            disabled={!slot.available}
            onClick={() => slot.available && onSelectSlot(slot.time)}
            style={{
              height: 40,
              border: `1px solid ${
                isSelected
                  ? "var(--accent)"
                  : slot.available
                  ? "var(--hairline-strong)"
                  : "var(--hairline)"
              }`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: isSelected
                ? "var(--accent)"
                : slot.available
                ? "var(--ink)"
                : "var(--ink-disabled)",
              backgroundColor: isSelected ? "var(--accent-tint)" : "transparent",
              cursor: slot.available ? "pointer" : "not-allowed",
              transition: "border-color 140ms ease, color 140ms ease, background-color 140ms ease",
              fontFamily: "var(--font)",
            }}
            onMouseEnter={(e) => {
              if (slot.available && !isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "var(--accent)";
                el.style.color = "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              if (slot.available && !isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "var(--hairline-strong)";
                el.style.color = "var(--ink)";
              }
            }}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}
