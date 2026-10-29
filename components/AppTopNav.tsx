"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { ArrowRight01, Calendar, Notification02, Search } from "@/assets/icons";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useSidebarNav } from "@/components/SidebarNavContext";

/** A plain label, or a label that links to its page. */
export type Crumb = string | { label: string; href: string };

export function AppTopNav({
  basePath,
  breadcrumb,
  filters,
  unreadCount = 0,
  notificationsOpen,
  onNotificationsClick,
  children,
}: {
  /** The area's root, e.g. `/admin`. */
  basePath: string;
  /** The first crumb is a section name, so it never links. */
  breadcrumb: Crumb[];
  filters?: React.ReactNode;
  unreadCount?: number;
  notificationsOpen?: boolean;
  onNotificationsClick?: () => void;
  children?: React.ReactNode;
}) {
  const { setOpen } = useSidebarNav();
  const pathname = usePathname();
  const calendarHref = `${basePath}/calendar`;
  const onCalendar = pathname.startsWith(calendarHref);

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
                  <ArrowRight01 className="size-5 shrink-0 text-text-secondary" />
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
        {filters && <div className="hidden md:block">{filters}</div>}

        <div className="hidden h-10 items-center gap-2 rounded-lg border border-neutral-200 p-[10px] text-neutral-300 md:flex md:w-50 lg:w-50">
          <Search />
          <input
            type="search"
            placeholder="Search"
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-300 focus:outline-none"
          />
        </div>

        <Link
          href={calendarHref}
          aria-label="Calendar"
          aria-current={onCalendar ? "page" : undefined}
          className={
            onCalendar
              ? "hidden size-10 items-center justify-center rounded-lg bg-brand-300 text-neutral-800 sm:flex"
              : "hidden size-10 items-center justify-center rounded-lg bg-surface-subtle text-icon-primary hover:bg-neutral-200 sm:flex"
          }
        >
          <Calendar />
        </Link>

        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} new`
              : "Notifications"
          }
          aria-expanded={notificationsOpen}
          onClick={onNotificationsClick}
          className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg bg-surface-subtle px-2.5 text-icon-primary hover:bg-neutral-200"
        >
          <span className="relative">
            <Notification02 className="size-5" />
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

        <ProfileMenu basePath={basePath} />
      </div>

      {children}
    </header>
  );
}
