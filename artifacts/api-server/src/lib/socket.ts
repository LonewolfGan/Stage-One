import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { logger } from "./logger";

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/ws/socket.io",
  });

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("subscribe", ({ providerId }: { providerId: string }) => {
      if (!providerId) return;
      socket.join(`provider:${providerId}`);
      logger.info({ socketId: socket.id, providerId }, "Socket subscribed to provider");
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitSlotUpdate(
  providerId: string,
  payload: {
    slotStart: string;
    staffId: string;
    change: "booked" | "released";
  },
) {
  try {
    getIO().to(`provider:${providerId}`).emit("slot.update", payload);
  } catch {
    logger.warn("Socket.io not ready, skipping emit");
  }
}

export function emitBookingConfirmed(
  providerId: string,
  payload: {
    bookingId: string;
    staffId: string;
    serviceName: string;
    clientName: string;
    startDatetime: string;
  },
) {
  try {
    getIO().to(`provider:${providerId}`).emit("booking.confirmed", payload);
  } catch {
    logger.warn("Socket.io not ready, skipping emit");
  }
}
