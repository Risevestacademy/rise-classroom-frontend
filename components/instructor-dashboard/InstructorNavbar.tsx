"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Search, Calendar } from "@/assets/icons";
import { UserAvatar } from "@/components/UserAvatar";
import { sessionQuery } from "@/lib/session-query";

const navSections = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/instructor/dashboard" }],
  },
  {
    label: "Program",
    items: [
      { title: "My Tracks", href: "/instructor/my-tracks" },
      { title: "Students", href: "/instructor/students" },
      { title: "Content", href: "/instructor/content" },
    ],
  },
  {
    label: "Teaching",
    items: [
      { title: "Assignments", href: "/instructor/assignments" },
      { title: "Live Sessions", href: "/instructor/live-sessions" },
      { title: "Curriculum", href: "/instructor/curriculum" },
      { title: "Calendar", href: "/instructor/calendar" },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Student Progress", href: "/instructor/student-progress" },
      { title: "Reports", href: "/instructor/reports" },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Announcements", href: "/instructor/announcements" },
      { title: "Messages", href: "/instructor/messages" },
      { title: "Notifications", href: "/instructor/notifications" },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", href: "/instructor/settings" },
      { title: "Integration", href: "/instructor/integration" },
    ],
  },
];

export function InstructorNavbar() {
  const pathname = usePathname();

   const { data: session, isPending } = useQuery(sessionQuery());
  const user = session?.user;

  const activeSection = navSections.find((section) =>
    section.items.some((item) => pathname.startsWith(item.href))
  );

  const activeItem = activeSection?.items.find((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-neutral-300 px-6">
      <nav className="flex items-center gap-2 text-sm">
        {activeSection && (
          <>
            <span className="font-medium text-neutral-500">
              {activeSection.label}
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
            <span className="font-semibold text-neutral-900">
              {activeItem?.title}
            </span>
          </>
        )}
      </nav>

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
          <UserAvatar
          user={{
            name: user?.name ?? "Account",
            avatar: user?.image ?? "/default-avatar.png",
          }}
          isLoading={isPending}
        />
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-bold text-neutral-900">{user?.name}</span>
            <span className="text-xs text-neutral-500">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}