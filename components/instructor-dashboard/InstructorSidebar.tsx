"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FolderOpen,
  FileCheck,
  Video,
  BookOpen,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Megaphone,
  MessageSquare,
  Bell,
  Settings,
  Blocks,
} from "lucide-react";

import { Logo } from "@/assets/logo";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/UserMenu";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const overviewNavItems: NavItem[] = [
  { title: "Dashboard", href: "/instructor/dashboard", icon: LayoutDashboard },
];

const programNavItems: NavItem[] = [
  { title: "My Tracks", href: "/instructor/my-tracks", icon: FolderKanban },
  { title: "Students", href: "/instructor/students", icon: Users },
  { title: "Content", href: "/instructor/content", icon: FolderOpen },
];

const teachingNavItems: NavItem[] = [
  { title: "Assignments", href: "/instructor/assignments", icon: FileCheck },
  { title: "Live Sessions", href: "/instructor/live-sessions", icon: Video },
  { title: "Curriculum", href: "/instructor/curriculum", icon: BookOpen },
  { title: "Calendar", href: "/instructor/calendar", icon: CalendarDays },
];

const insightsNavItems: NavItem[] = [
  { title: "Student Progress", href: "/instructor/student-progress", icon: TrendingUp },
  { title: "Reports", href: "/instructor/reports", icon: BarChart3 },
];

const communicationNavItems: NavItem[] = [
  { title: "Announcements", href: "/instructor/announcements", icon: Megaphone },
  { title: "Messages", href: "/instructor/messages", icon: MessageSquare },
  { title: "Notifications", href: "/instructor/notifications", icon: Bell },
];

const accountNavItems: NavItem[] = [
  { title: "Settings", href: "/instructor/settings", icon: Settings },
  { title: "Integration", href: "/instructor/integration", icon: Blocks },
];

export function InstructorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 self-start flex-col border-r-2 border-neutral-300">
      <div className="flex h-16 items-center">
        <Link
          href="/instructor/dashboard"
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="flex items-center pl-10 pt-6 pb-4">
            <Logo variant="teal" size="sm" />
          </div>
        </Link>
      </div>

      <hr className="text-neutral-300 mx-4" />

            <div className="flex-1 min-h-0 px-3 py-4 space-y-6 overflow-y-auto">
        <NavSection label="Overview" items={overviewNavItems} pathname={pathname} />
        <NavSection label="Program" items={programNavItems} pathname={pathname} />
        <NavSection label="Teaching" items={teachingNavItems} pathname={pathname} />
        <NavSection label="Insights" items={insightsNavItems} pathname={pathname} />
        <NavSection label="Communication" items={communicationNavItems} pathname={pathname} />
      </div>

      <div className="px-3.5 mb-3">
        <div className="space-y-1">
          {accountNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>
        <hr className="text-neutral-300 mx-4" />
        <div className="mt-auto p-4 bg-neutral-100">
          <UserMenu variant="card" />
        </div>
      </div>
    </aside>
  );
}

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="mb-2 px-3 text-xs font-medium tracking-wider text-neutral-500 uppercase">
        {label}
      </p>
      {items.map((item) => (
        <SidebarNavItem
          key={item.href}
          item={item}
          isActive={pathname.startsWith(item.href)}
        />
      ))}
    </div>
  );
}

function SidebarNavItem({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <div className="relative flex items-center w-full px-2">
      {isActive && (
        <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-8 w-2 rounded-r-md bg-[#0D6D78]" />
      )}

      <Link
        href={item.href}
        className={cn(
          "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium",
          isActive
            ? "bg-neutral-200 text-primary-500 border-2 border-primary-500"
            : "text-neutral-500"
        )}
      >
        <Icon
          fill={isActive ? "currentColor" : "none"}
          className={cn(
            "h-5 w-5 shrink-0",
            isActive ? "text-[#0D6D78]" : "text-neutral-500"
          )}
        />
        <span className="truncate">{item.title}</span>
      </Link>
    </div>
  );
}