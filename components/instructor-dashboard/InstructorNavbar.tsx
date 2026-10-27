"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronRight, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { Calendar, Search } from "@/assets/icons";
import { UserAvatar } from "@/components/UserAvatar";
import { sessionQuery } from "@/lib/session-query";
import { useInstructorNav } from "./InstructorNavContext";

/** A plain label, or a label that links to its page. */
export type Crumb = string | { label: string; href: string };

export function InstructorNavbar({
  breadcrumb = ["Overview", { label: "Dashboard", href: "/instructor/dashboard" }],
}: {
  /** The first crumb is a section name, so it never links. */
  breadcrumb?: Crumb[];
}) {
  const pathname = usePathname();
  const { setOpen } = useInstructorNav();

  const { data: session, isPending } = useQuery(sessionQuery());
  const user = session?.user;

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border-default bg-surface-background px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="text-neutral-400 hover:text-neutral-600 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-2 truncate font-work text-sm text-text-secondary">
          {breadcrumb.map((crumb, index) => {
            const label = typeof crumb === "string" ? crumb : crumb.label;
            const className =
              index === breadcrumb.length - 1
                ? "font-medium text-text-primary"
                : undefined;
            return (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="size-5 shrink-0 text-text-secondary" />
                )}
                {index === 0 || typeof crumb === "string" ? (
                  <span className={className}>{label}</span>
                ) : (
                  <Link href={crumb.href} className={className}>
                    {label}
                  </Link>
                )}
              </span>
            );
          })}
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
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-bold text-neutral-800">{user?.name}</span>
            <span className="text-xs text-neutral-400">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}