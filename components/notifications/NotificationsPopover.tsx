"use client";

import * as React from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { Bell, BellOff } from "lucide-react";

import {
  NotificationIcon,
  UnreadDot,
} from "@/components/notifications/NotificationParts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ANNOUNCEMENTS_PATH,
  NOTIFICATIONS_PATH,
  compactTime,
  isAnnouncementNotification,
  useStudentNotifications,
} from "@/lib/student-notifications";
import { cn } from "@/lib/utils";

const PREVIEW_COUNT = 4;

/** The bell in the student top bar and its latest few notifications. */
export function NotificationsPopover({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const { notifications, unreadCount, isPending, markRead } =
    useStudentNotifications();
  const latest = notifications.slice(0, PREVIEW_COUNT);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className={cn("relative", className)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 size-2 rounded-full bg-text-error ring-2 ring-neutral-100" />
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup className="w-[calc(100vw-2rem)] max-w-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(16,24,40,0.08)] outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <Popover.Title className="text-base text-neutral-800">
                Notifications
              </Popover.Title>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markRead()}
                  className="font-work text-xs font-medium text-brand-primary hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {isPending ? (
              <div className="divide-y divide-neutral-200">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3 px-5 py-4">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : latest.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <BellOff className="size-5 text-neutral-400" />
                <p className="text-sm text-neutral-800">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {latest.map((item) => {
                  const toAnnouncements = isAnnouncementNotification(item);
                  const row = (
                    <>
                      <UnreadDot unread={!item.isRead} />
                      <NotificationIcon type={item.type} className="size-9" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-neutral-800">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate font-work text-xs text-neutral-500">
                          {item.body}
                        </span>
                      </span>
                      <span className="shrink-0 font-work text-xs text-neutral-500">
                        {compactTime(item.createdAt)}
                      </span>
                    </>
                  );
                  const rowClass =
                    "flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50";
                  return (
                    <li key={item.id}>
                      {toAnnouncements ? (
                        <Link
                          href={ANNOUNCEMENTS_PATH}
                          onClick={() => {
                            markRead(item.id);
                            setOpen(false);
                          }}
                          className={rowClass}
                        >
                          {row}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markRead(item.id)}
                          className={rowClass}
                        >
                          {row}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t border-neutral-200 p-3">
              <Link
                href={NOTIFICATIONS_PATH}
                onClick={() => setOpen(false)}
                className="flex h-10 w-full items-center justify-center rounded-lg border border-neutral-200 text-sm text-neutral-800 hover:bg-neutral-50"
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
