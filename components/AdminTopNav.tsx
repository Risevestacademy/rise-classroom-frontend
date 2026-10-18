"use client";

import { Bell, Menu } from "lucide-react";

import { Search, Calendar } from "@/assets/icons";
import { AdminProfileMenu } from "@/components/AdminProfileMenu";
import { useAdminNav } from "@/components/AdminNavContext";

export function AdminTopNav({
  breadcrumb = ["Overview", "Dashboard"],
}: {
  breadcrumb?: string[];
}) {
  const { setOpen } = useAdminNav();

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
              {index > 0 && <span className="text-neutral-300">/</span>}
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

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
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
          className="hidden text-neutral-400 hover:text-neutral-600 sm:block"
        >
          <Calendar />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="text-neutral-400 hover:text-neutral-600"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="border-l border-neutral-200 pl-2 sm:pl-4">
          <AdminProfileMenu />
        </div>
      </div>
    </header>
  );
}
