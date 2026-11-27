"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { BellOff, X } from "lucide-react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { useAdminNotifications } from "@/lib/admin-notifications";
import { cn, timeAgo } from "@/lib/utils";
import { notificationText } from "@/lib/notification-text";

type Filter = "all" | "unread";

export const notificationHref = (id: string) => `/admin/notifications?id=${id}`;

/** Slides in from the right under the top nav. */
export function AdminNotificationsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const { notifications, unreadCount, markRead } = useAdminNotifications();
  const visible =
    filter === "unread"
      ? notifications.filter((item) => !item.isRead)
      : notifications;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Clicking outside closes the panel; the page isn't dimmed in the design. */}
        <Dialog.Backdrop className="fixed inset-0 z-40" />
        <Dialog.Popup className="fixed top-[72px] right-0 bottom-0 z-50 flex w-full max-w-[450px] flex-col rounded-tl-3xl rounded-bl-3xl bg-white shadow-[0_8px_24px_rgba(16,24,40,0.08)] outline-none transition-transform duration-200 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="flex items-center justify-between px-6 pt-6">
            <Dialog.Title className="text-xl font-bold text-neutral-800">
              Notifications
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close notifications"
              className="flex size-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-800 hover:bg-neutral-100"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 px-6">
            <div
              role="tablist"
              aria-label="Filter notifications"
              className="flex rounded-xl bg-neutral-100 p-1"
            >
              {(["all", "unread"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-sm font-medium text-text-muted capitalize",
                    filter === value && "bg-white text-text-primary shadow-sm",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markRead()}
                className="text-sm font-medium text-brand-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="mt-6 flex-1 overflow-y-auto px-3 pb-6">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 pt-20 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                  <BellOff className="size-5" />
                </span>
                <p className="font-semibold text-neutral-800">
                  {filter === "unread" ? "You're all caught up" : "No notifications yet"}
                </p>
                <p className="max-w-64 text-sm text-neutral-400">
                  {filter === "unread"
                    ? "There are no unread notifications."
                    : "Updates across your program will show up here."}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {visible.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={notificationHref(item.id)}
                      onClick={() => {
                        markRead(item.id);
                        onOpenChange(false);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-neutral-50"
                    >
                      {/* System notifications have no sender, so they show the title. */}
                      <PersonAvatar
                        name={item.actor?.name ?? item.title}
                        src={item.actor?.image}
                        size={40}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-work text-sm text-neutral-600">
                          <span className="font-medium text-neutral-800">
                            {item.actor?.name ?? item.title}
                          </span>{" "}
                          {notificationText(item.body)}
                        </span>
                        <span className="mt-1 block font-work text-xs text-neutral-400">
                          {timeAgo(item.createdAt)}
                        </span>
                      </span>
                      {!item.isRead && (
                        <span
                          aria-label="Unread"
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-text-error"
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
