import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

const POLL_INTERVAL = 30_000;

export function useNotifications() {
  const [data, setData] = useState<NotificationsResponse>({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get<NotificationsResponse>("/dashboard/notifications");
      setData(res);
    } catch {
      // 401 expected when not logged in — silently ignore
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    timerRef.current = setInterval(() => fetch(true), POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch]);

  const markRead = useCallback(async (id: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, prev.unreadCount - (prev.notifications.find((n) => n.id === id && !n.isRead) ? 1 : 0)),
    }));
    try {
      await api.post(`/dashboard/notifications/${id}/read`, {});
    } catch { /* silently ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setData((prev) => ({
      notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await api.post("/dashboard/notifications/read-all", {});
    } catch { /* silently ignore */ }
  }, []);

  return { ...data, loading, markRead, markAllRead, refetch: fetch };
}
