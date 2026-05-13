"use client";

import { useEffect, useState } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/user/notifications");
        if (response.ok) {
          const { data } = await response.json();
          setNotifications(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/user/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/user/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <p className="text-center text-black/60">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-cyan-600 hover:text-cyan-700"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-center text-black/60">Aucune notification</p>
      ) : (
        <div className="space-y-3">
          {displayNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                notification.is_read
                  ? "border-black/5 bg-black/5"
                  : "border-cyan/20 bg-cyan/5"
              }`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{notification.title}</p>
                  {notification.body && (
                    <p className="text-sm text-black/60">{notification.body}</p>
                  )}
                </div>
                {!notification.is_read && (
                  <span className="h-2 w-2 rounded-full bg-cyan" />
                )}
              </div>
              <p className="mt-1 text-xs text-black/40">
                {new Date(notification.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full text-center text-sm text-cyan-600 hover:text-cyan-700"
        >
          {showAll ? "Voir moins" : `Voir tout (${notifications.length})`}
        </button>
      )}
    </div>
  );
}
