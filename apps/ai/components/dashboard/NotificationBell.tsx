"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/(platform)/actions";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

export function NotificationBell({ initialNotifications }: { initialNotifications: NotificationItem[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Optimistic — flip local state immediately, let the server action catch up.
  function markRead(id: string) {
    setNotifications((cur) => cur.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    markNotificationReadAction(id);
  }

  function markAllRead() {
    const now = new Date().toISOString();
    setNotifications((cur) => cur.map((n) => ({ ...n, read_at: n.read_at || now })));
    markAllNotificationsReadAction();
  }

  // Opening the dropdown is itself "viewing" the notifications — clear the
  // badge right away instead of requiring an extra explicit click on top of
  // the click that already opened it.
  useEffect(() => {
    if (open) markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative grid h-8 w-8 place-items-center rounded-md border border-border bg-bg-subtle text-fg-muted transition-colors hover:border-enterprise-primary/40 hover:text-fg"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-enterprise-primary px-1 text-[9px] font-bold text-enterprise-on-primary">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-bg-elevated shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 ? (
              <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs text-enterprise-primary hover:underline">
                <Check className="h-3 w-3" /> Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-fg-subtle">No notifications yet</p>
            ) : (
              notifications.map((n) => {
                const row = (
                  <div className="flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-bg-subtle">
                    <span className={"mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full " + (n.read_at ? "bg-transparent" : "bg-enterprise-primary")} />
                    <div className="min-w-0 flex-1">
                      <p className={"text-sm " + (n.read_at ? "text-fg-muted" : "font-medium text-fg")}>{n.title}</p>
                      {n.body ? <p className="mt-0.5 text-xs text-fg-subtle">{n.body}</p> : null}
                      <p className="mt-1 text-[10px] text-fg-subtle">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className="block border-b border-border last:border-0"
                  >
                    {row}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="block w-full border-b border-border text-left last:border-0"
                  >
                    {row}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
