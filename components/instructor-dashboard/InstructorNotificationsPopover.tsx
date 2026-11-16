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
  instructorAnnouncements,
  instructorNotifications,
  isInstructorItemRead,
  markAllInstructorItemsRead,
  markInstructorItemRead,
  type InstructorNotificationKind,
} from "@/lib/instructor-notifications";

const icons: Record<InstructorNotificationKind, LucideIcon> = {
  assignment: ClipboardList,
  announcement: Megaphone,
  "live-class": Video,
  calendar: CalendarDays,
};

const preview = instructorNotifications.slice(0, 4);

/** Compact notification preview for the instructor navbar. */
export function InstructorNotificationsPopover() {
  const [open, setOpen] = React.useState(false);
  const [, setReadRevision] = React.useState(0);
  const unreadCount =
    instructorNotifications.filter(
      (item) => !isInstructorItemRead(item.id, item.isRead),
    ).length +
    instructorAnnouncements.filter(
      (item) => !isInstructorItemRead(item.id, item.isRead),
    ).length;

  function markRead(id: string) {
    markInstructorItemRead(id);
    setReadRevision((revision) => revision + 1);
  }

  function markAllRead() {
    markAllInstructorItemsRead();
    setReadRevision((revision) => revision + 1);
  }

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
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-neutral-800 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <ul className="divide-y divide-neutral-200">
              {preview.map((item) => {
                const Icon = icons[item.kind];
                const isRead = isInstructorItemRead(item.id, item.isRead);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50"
                    >
                      {!isRead && (
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
                          {item.body}
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
