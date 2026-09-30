"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, House, FileText, Settings, Blocks } from "lucide-react";

import { Logo } from "@/assets/logo";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const overviewNavItems: NavItem[] = [
  { title: "Dashboard", href: "/instructor/dashboard", icon: LayoutDashboard },
];

const programNavItems: NavItem[] = [
  { title: "My Tracks", href: "/instructor/my-tracks", icon: House },
  { title: "Students", href: "/instructor/students", icon: House },
  { title: "Content", href: "/instructor/content", icon: FileText },
];

const teachingNavItems: NavItem[] = [
  { title: "Assignments", href: "/instructor/assignments", icon: House },
  { title: "Live Sessions", href: "/instructor/live-sessions", icon: FileText },
  { title: "Curriculum", href: "/instructor/curriculum", icon: FileText },
  { title: "Calendar", href: "/instructor/calendar", icon: FileText },
];

const insightsNavItems: NavItem[] = [
  { title: "Student Progress", href: "/instructor/student-progress", icon: House, },
  { title: "Reports", href: "/instructor/reports", icon: FileText },
];

const communicationNavItems: NavItem[] = [
  { title: "Announcements", href: "/instructor/announcements", icon: House },
  { title: "Messages", href: "/instructor/messages", icon: FileText },
  { title: "Notifications", href: "/instructor/notifications", icon: FileText },
];

const accountNavItems: NavItem[] = [
  { title: "Settings", href: "/instructor/settings", icon: Settings },
  { title: "Integration", href: "/instructor/integration", icon: Blocks },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-56 flex-col border-r-2 border-neutral-300">
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

      <div className="flex-1 px-3 py-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
            Overview
          </p>
          {overviewNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
            Program
          </p>
          {programNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
            Teaching
          </p>
          {teachingNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
            Insights
          </p>
          {insightsNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
            Communication
          </p>
          {communicationNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>
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
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <UserAvatar src="/avatar.png" name="Instructor" size="md" />
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-neutral-900 truncate">
                Instructor
              </span>
              <span className="text-xs text-neutral-500 truncate mt-0.5">
                Admin@gmail.com
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
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
