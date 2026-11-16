"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Calendar, ChevronRight, Menu, Search } from "lucide-react";

import { Logo } from "@/assets/logo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useStudentNav } from "@/components/StudentNavContext";
import { findTopic, useStudentCurriculum } from "@/lib/student-lessons";

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "my-learning": "Curriculum",
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

/* "Module N" for /student/my-learning/module/<id>, numbered as on the curriculum page. */
function ModuleCrumb({ moduleId }: { moduleId: string }) {
  const { topics } = useStudentCurriculum();
  const number = findTopic(topics, moduleId)?.number;
  return (
    <>
      <ChevronRight className="h-4 w-4 text-neutral-400" />
      <span className="font-medium text-neutral-800">
        {number ? `Module ${number}` : "Module"}
      </span>
    </>
  );
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

  // /student/<page>/... -> label for <page>
  const segments = pathname.split("/").filter(Boolean);
  const segment = segments[1];
  const nested = segments.length > 2;
  const moduleId =
    segment === "my-learning" && segments[2] === "module" ? segments[3] : undefined;
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
        {nested && segment ? (
          <Link
            href={`/student/${segment}`}
            className="text-neutral-400 hover:text-neutral-600"
          >
            {pageLabel}
          </Link>
        ) : (
          <span className="font-medium text-neutral-800">{pageLabel}</span>
        )}
        {moduleId && <ModuleCrumb moduleId={moduleId} />}
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

        <div className="pl-1">
          <ProfileMenu basePath="/student" />
        </div>
      </div>
    </header>
  );
}