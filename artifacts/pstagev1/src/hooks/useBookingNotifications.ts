import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSocket } from "@/lib/socket";

interface BookingConfirmedPayload {
  bookingId: string;
  staffId: string;
  serviceName: string;
  clientName: string;
  startDatetime: string;
}

export function useBookingNotifications(providerId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!providerId) return;

    const socket = getSocket();
    socket.connect();
    socket.emit("subscribe", { providerId });

    function onBookingConfirmed(payload: BookingConfirmedPayload) {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] });

      const time = format(new Date(payload.startDatetime), "HH:mm", { locale: fr });
      toast.success(`Nouveau RDV — ${payload.clientName}`, {
        description: `${payload.serviceName} · ${time}`,
        duration: 8000,
      });
    }

    socket.on("booking.confirmed", onBookingConfirmed);

    return () => {
      socket.off("booking.confirmed", onBookingConfirmed);
      socket.disconnect();
    };
  }, [providerId, queryClient]);
}
