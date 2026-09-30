import { Bell } from "lucide-react";

import { Search, Calendar } from "@/assets/icons";
import { UserAvatar } from "@/components/UserAvatar";

export function AdminTopNav({
  breadcrumb = ["Overview", "Dashboard"],
}: {
  breadcrumb?: string[];
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-300 bg-white px-6 py-3">
      <div className="flex items-center gap-1.5 text-sm text-neutral-500">
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

      <div className="flex items-center gap-4">
        <div className="flex h-10 w-64 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-neutral-400">
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
          className="text-neutral-500 hover:text-neutral-700"
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

        <div className="flex items-center gap-2.5 border-l border-neutral-300 pl-4">
          <UserAvatar />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-neutral-900">Admin A.</span>
            <span className="text-xs text-neutral-500">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
