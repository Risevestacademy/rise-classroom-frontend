"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, Menu } from "lucide-react";

import { Search, Calendar } from "@/assets/icons";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminNav } from "@/components/AdminNavContext";
import { sessionQuery } from "@/lib/session-query";
import type { Role } from "@/lib/auth";

const roleLabels: Record<Role, string> = {
  SUPERADMIN: "Super Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

export function AdminTopNav({
  breadcrumb = ["Overview", "Dashboard"],
}: {
  breadcrumb?: string[];
}) {
  const { setOpen } = useAdminNav();
  const { data: session, isPending } = useQuery(sessionQuery());
  const user = session?.user;

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
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

        <div className="flex items-center gap-2.5 border-l border-neutral-200 pl-2 sm:pl-4">
          <UserAvatar
            user={{
              name: user?.name ?? "Account",
              avatar: user?.image ?? "/default-avatar.png",
            }}
            isLoading={isPending}
          />
          {isPending ? (
            <div className="hidden flex-col gap-1 sm:flex">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          ) : (
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-bold text-neutral-800">
                {user?.displayName ?? user?.name ?? "Account"}
              </span>
              <span className="text-xs text-neutral-400">
                {user ? roleLabels[user.role] : "Not signed in"}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
