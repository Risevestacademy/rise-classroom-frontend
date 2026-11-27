"use client";

import * as React from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Megaphone,
  Video,
  type LucideIcon,
} from "lucide-react";

import {
  useInstructorNotifications,
  type NotificationRecord,
} from "@/lib/instructor";
import { notificationText } from "@/lib/notification-text";

const icons = {
  assignment: ClipboardList,
  announcement: Megaphone,
  "live-class": Video,
  calendar: CalendarDays,
} satisfies Record<string, LucideIcon>;

const PREVIEW_COUNT = 4;

/** Compact notification preview for the instructor navbar. */
export function InstructorNotificationsPopover() {
  const [open, setOpen] = React.useState(false);
  const {
    notifications,
    unreadCount,
    isPending,
    isError,
    isMarkReadError,
    markRead,
  } = useInstructorNotifications();
  const preview = notifications.slice(0, PREVIEW_COUNT);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className="text-neutral-400 hover:text-neutral-600 bg-neutral-100 rounded-sm p-2 cursor-pointer"
      >
        <Bell className="h-5 w-5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={12}
          className="z-50 mt-5"
        >
          <Popover.Popup className="w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] outline-none">
            <div className="flex items-center justify-between border-b border-neutral-200 px-3.5 py-3">
              <Popover.Title className="text-sm font-medium text-neutral-800">
                Notifications
              </Popover.Title>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markRead()}
                  className="text-[11px] font-medium text-neutral-800 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {isPending ? (
              <ul className="divide-y divide-neutral-200" aria-busy="true">
                {[1, 2, 3].map((item) => (
                  <li key={item} className="flex items-center gap-2 px-3 py-3">
                    <span className="size-6 animate-pulse rounded-full bg-neutral-100" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
                      <span className="block h-2.5 w-1/2 animate-pulse rounded bg-neutral-100" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : isError ? (
              <p role="alert" className="px-4 py-6 text-center text-xs text-neutral-500">
                Couldn&apos;t load notifications.
              </p>
            ) : preview.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-neutral-500">
                No notifications yet.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {preview.map((item) => {
                  const Icon = iconForNotification(item);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => markRead(item.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50"
                      >
                        {!item.isRead && (
                          <span className="flex w-3 shrink-0 justify-center">
                            <span
                              aria-label="Unread"
                              className="size-1.5 rounded-full bg-brand-primary"
                            />
                          </span>
                        )}
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
                          <Icon className="size-3.5" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium text-neutral-800">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-neutral-500">
                            {notificationText(item.body ?? item.message ?? "")}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-neutral-500">
                          {compactTime(item.createdAt)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {isMarkReadError && (
              <p role="alert" className="px-3 py-2 text-xs text-text-error">
                Couldn&apos;t update notification status.
              </p>
            )}

            <div className="p-2">
              <Link
                href="/instructor/notifications"
                onClick={() => setOpen(false)}
                className="flex h-7 w-full items-center justify-center rounded-lg border border-neutral-200 text-[12px] text-neutral-600 hover:bg-neutral-50"
              >
                View all notifications
              </Link>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function iconForNotification(item: NotificationRecord) {
  const type = item.type?.toUpperCase() ?? "";
  if (/ASSIGN|SUBMISSION|GRADE|REVIEW/.test(type)) return icons.assignment;
  if (/ANNOUNCEMENT/.test(type)) return icons.announcement;
  if (/LIVE|CLASS|SESSION|RECORDING/.test(type)) return icons["live-class"];
  if (/CALENDAR|EVENT|SCHEDULE/.test(type)) return icons.calendar;
  return Bell;
}

function compactTime(date: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60_000),
  );
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
