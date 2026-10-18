"use client";

import * as React from "react";
import { Bell, ChevronRight, Menu } from "lucide-react";

import { Search, Calendar } from "@/assets/icons";
import { AdminProfileMenu } from "@/components/AdminProfileMenu";
import { useAdminNav } from "@/components/AdminNavContext";
import {
  AdminNotificationsPanel,
  useAdminNotifications,
} from "@/components/AdminNotificationsPanel";

export function AdminTopNav({
  breadcrumb = ["Overview", "Dashboard"],
}: {
  breadcrumb?: string[];
}) {
  const { setOpen } = useAdminNav();
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const { unreadCount } = useAdminNotifications();

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="text-neutral-400 hover:text-neutral-600 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-1.5 truncate text-sm text-neutral-400">
          {breadcrumb.map((item, index) => (
            <span key={item} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
              )}
              <span
                className={
                  index === breadcrumb.length - 1
                    ? "font-medium text-neutral-800"
                    : undefined
                }
              >
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden h-10 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-neutral-300 md:flex md:w-48 lg:w-64">
          <Search />
          <input
            type="search"
            placeholder="Search"
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-300 focus:outline-none"
          />
        </div>

        <button
          type="button"
          aria-label="Calendar"
          className="hidden size-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 hover:bg-neutral-200 sm:flex"
        >
          <Calendar />
        </button>

        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} new`
              : "Notifications"
          }
          aria-expanded={notificationsOpen}
          onClick={() => setNotificationsOpen(true)}
          className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 text-neutral-800 hover:bg-neutral-200"
        >
          <span className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 right-0 size-2 rounded-full bg-text-error ring-2 ring-neutral-100" />
            )}
          </span>
          {unreadCount > 0 && (
            <span className="hidden text-sm font-medium text-text-error sm:inline">
              {unreadCount} New
            </span>
          )}
        </button>

        <div className="pl-1 sm:pl-2">
          <AdminProfileMenu />
        </div>
      </div>

      <AdminNotificationsPanel
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />
    </header>
  );
}
