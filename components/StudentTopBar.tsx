"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, Calendar, ChevronRight, Menu, Search } from "lucide-react";

import { Logo } from "@/assets/logo";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentNav } from "@/components/StudentNavContext";
import { sessionQuery } from "@/lib/session-query";
import { studentQueries } from "@/lib/student";

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "my-learning": "My learning",
  assignments: "Assignments",
  "control-tower": "Control tower",
  announcements: "Announcements",
  notifications: "Notifications",
  chat: "Chat",
  settings: "Settings",
  integration: "Integration",
};

function toTitle(segment: string) {
  const text = segment.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const iconButton =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition-colors hover:text-neutral-800";

/**
 * Header for every student page. On mobile it exposes the sidebar toggle (the
 * sidebar is always visible at `lg` and up); on desktop it shows the
 * breadcrumb, search, shortcuts and the signed-in student with their track.
 */
export function StudentTopBar() {
  const { setOpen } = useStudentNav();
  const pathname = usePathname();
  const session = useQuery(sessionQuery());
  const progress = useQuery(studentQueries.progress());

  const user = session.data?.user;

  // Prefer the track they're still working through over a finished one.
  const enrollment =
    progress.data?.find((item) => !item.trackComplete) ?? progress.data?.[0];

  // /student/<page>/... -> label for <page>
  const segment = pathname.split("/").filter(Boolean)[1];
  const pageLabel = segment ? (pageLabels[segment] ?? toTitle(segment)) : "Dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 sm:px-6 lg:bg-transparent lg:px-8">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="text-neutral-400 hover:text-neutral-600 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="lg:hidden">
        <Logo variant="teal" size="sm" />
      </div>

      <nav
        aria-label="Breadcrumb"
        className="hidden items-center gap-2 text-sm lg:flex"
      >
        <Link
          href="/student/dashboard"
          className="text-neutral-400 hover:text-neutral-600"
        >
          Home
        </Link>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
        <span className="font-medium text-neutral-800">{pageLabel}</span>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <label className="hidden h-9 w-72 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-400 md:flex">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="search"
            disabled
            placeholder="Search"
            aria-label="Search"
            title="Search is coming soon"
            className="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed"
          />
        </label>

        <button
          type="button"
          aria-label="Calendar"
          className={`${iconButton} hidden sm:flex`}
        >
          <Calendar className="h-5 w-5" />
        </button>
        <Link
          href="/student/notifications"
          aria-label="Notifications"
          className={iconButton}
        >
          <Bell className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-3 pl-1">
          <UserAvatar
            user={{
              name: user?.name ?? "Account",
              avatar: user?.image ?? "/default-avatar.png",
            }}
            isLoading={session.isPending}
          />
          <div className="hidden min-w-0 sm:block">
            {session.isPending ? (
              <>
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="mt-1.5 h-3 w-16" />
              </>
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-neutral-800">
                  {user?.displayName ?? user?.name ?? "Student"}
                </p>
                {progress.isPending ? (
                  <Skeleton className="mt-1.5 h-3 w-16" />
                ) : (
                  enrollment && (
                    <p className="truncate text-xs text-neutral-400">
                      {enrollment.track.name}
                    </p>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}