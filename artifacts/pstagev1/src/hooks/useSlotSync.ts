import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";

interface SlotUpdatePayload {
  slotStart: string;
  staffId: string;
  change: "booked" | "released";
}

export function useSlotSync(
  providerId: string | undefined,
  date: string | undefined,
  onConflict?: (payload: SlotUpdatePayload) => void,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!providerId) return;

    const socket = getSocket();
    socket.connect();
    socket.emit("subscribe", { providerId });

    function onSlotUpdate(payload: SlotUpdatePayload) {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      if (payload.change === "booked" && onConflict) {
        onConflict(payload);
      }
    }

    socket.on("slot.update", onSlotUpdate);

    return () => {
      socket.off("slot.update", onSlotUpdate);
      socket.disconnect();
    };
  }, [providerId, date, queryClient, onConflict]);
}
