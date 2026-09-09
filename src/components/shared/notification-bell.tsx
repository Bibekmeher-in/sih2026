"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Package,
  Truck,
  IndianRupee,
  Sparkles,
  AlertCircle,
  CheckCheck,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Notification {
  _id: string;
  type: "ORDER_UPDATE" | "PRICE_ALERT" | "DELIVERY_UPDATE" | "DEMAND_SPIKE" | "SYSTEM";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const TYPE_META: Record<
  Notification["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  ORDER_UPDATE: { icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
  PRICE_ALERT: { icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-50" },
  DELIVERY_UPDATE: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
  DEMAND_SPIKE: { icon: Sparkles, color: "text-emerald-600", bg: "bg-emerald-50" },
  SYSTEM: { icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-100" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // silently ignore fetch errors for background polling
    }
  }, []);

  // Initial fetch + 60s polling
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
    // fetchNotifications is stable (useCallback with no deps that change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const markAllRead = async () => {
    try {
      setLoading(true);
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  const markOneRead = async (n: Notification) => {
    if (!n.read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: n._id }),
        });
        setNotifications((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silently ignore
      }
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={btnRef}
        id="notification-bell-btn"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchNotifications();
        }}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600",
          open
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        )}
      >
        <Bell className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold leading-none"
            style={{ width: 18, height: 18, minWidth: 18 }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  aria-label="Mark all notifications as read"
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                  <Bell className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  You&apos;re all caught up 🎉
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  No new notifications right now.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
                const Icon = meta.icon;
                return (
                  <button
                    key={n._id}
                    onClick={() => markOneRead(n)}
                    className={cn(
                      "w-full text-left flex gap-3 px-4 py-3 transition-colors",
                      n.read
                        ? "bg-white hover:bg-slate-50"
                        : "bg-emerald-50/40 hover:bg-emerald-50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        meta.bg
                      )}
                    >
                      <Icon className={cn("h-4 w-4", meta.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p
                          className={cn(
                            "text-xs font-semibold leading-snug",
                            n.read ? "text-slate-700" : "text-slate-900"
                          )}
                        >
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-label="Unread" />
                          )}
                          {n.link && (
                            <ExternalLink className="h-3 w-3 text-slate-300" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
