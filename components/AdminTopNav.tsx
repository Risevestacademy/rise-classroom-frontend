"use client";

import { Bell, Menu } from "lucide-react";

import { Search, Calendar } from "@/assets/icons";
import { UserAvatar } from "@/components/UserAvatar";
import { useAdminNav } from "@/components/AdminNavContext";

export function AdminTopNav({
  breadcrumb = ["Overview", "Dashboard"],
}: {
  breadcrumb?: string[];
}) {
  const { setOpen } = useAdminNav();

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-neutral-300 bg-white px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="text-neutral-500 hover:text-neutral-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-1.5 truncate text-sm text-neutral-500">
          {breadcrumb.map((item, index) => (
            <span key={item} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-neutral-400">/</span>}
              <span
                className={
                  index === breadcrumb.length - 1
                    ? "font-medium text-neutral-900"
                    : undefined
                }
              >
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="hidden h-10 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-neutral-400 md:flex md:w-48 lg:w-64">
          <Search />
          <input
            type="search"
            placeholder="Search"
            className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
        </div>

        <button
          type="button"
          aria-label="Calendar"
          className="hidden text-neutral-500 hover:text-neutral-700 sm:block"
        >
          <Calendar />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="text-neutral-500 hover:text-neutral-700"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 border-l border-neutral-300 pl-2 sm:pl-4">
          <UserAvatar />
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-bold text-neutral-900">Admin A.</span>
            <span className="text-xs text-neutral-500">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
