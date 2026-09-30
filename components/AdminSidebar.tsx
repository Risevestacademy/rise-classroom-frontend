"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  Video,
  Users,
  GraduationCap,
  UserCog,
  ShieldCheck,
  Hash,
  Layers,
  BookOpen,
  BarChart3,
  Activity,
  Megaphone,
  Bell,
  MessageSquare,
  Settings,
  Blocks,
} from "lucide-react";

import { Logo } from "@/assets/logo";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const overviewNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
];

const operationsNavItems: NavItem[] = [
  { title: "Control Tower", href: "/admin/control-tower", icon: Radar },
  { title: "Live Sessions", href: "/admin/live-sessions", icon: Video },
];

const peopleNavItems: NavItem[] = [
  { title: "Students", href: "/admin/students", icon: Users },
  { title: "Instructors", href: "/admin/instructors", icon: GraduationCap },
  { title: "Mentors", href: "/admin/mentors", icon: UserCog },
  { title: "Admins", href: "/admin/admins", icon: ShieldCheck },
];

const academyNavItems: NavItem[] = [
  { title: "Tracks", href: "/admin/tracks", icon: Hash },
  { title: "Cohorts", href: "/admin/cohorts", icon: Layers },
  { title: "Curriculum", href: "/admin/curriculum", icon: BookOpen },
];

const insightNavItems: NavItem[] = [
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  { title: "Activity Log", href: "/admin/activity-log", icon: Activity },
];

const communicationNavItems: NavItem[] = [
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { title: "Notifications", href: "/admin/notifications", icon: Bell },
  { title: "Messages", href: "/admin/messages", icon: MessageSquare },
];

const accountNavItems: NavItem[] = [
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "Integration", href: "/admin/integration", icon: Blocks },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-60 flex-col border-r border-neutral-300 bg-white">
      <div className="flex items-center gap-2.5 border-b border-neutral-300 px-4 py-5">
        <Link href="/admin/dashboard" className="flex items-center overflow-hidden">
          <Logo variant="teal" size="sm" />
        </Link>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <NavSection
          label="Overview"
          items={overviewNavItems}
          pathname={pathname}
        />
        <NavSection
          label="Operations"
          items={operationsNavItems}
          pathname={pathname}
        />
        <NavSection
          label="People"
          items={peopleNavItems}
          pathname={pathname}
        />
        <NavSection
          label="Academy"
          items={academyNavItems}
          pathname={pathname}
        />
        <NavSection
          label="Insight"
          items={insightNavItems}
          pathname={pathname}
        />
        <NavSection
          label="Communication"
          items={communicationNavItems}
          pathname={pathname}
        />
      </div>

      <div className="px-4 pb-4">
        <div className="space-y-1">
          {accountNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        <hr className="my-3 text-neutral-300" />

        <div className="flex items-center gap-3 rounded-2xl bg-neutral-100 p-3">
          <UserAvatar />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-neutral-900">
              Admin A.
            </span>
            <span className="mt-0.5 truncate text-xs text-neutral-500">
              Super Admin
            </span>
          </div>
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
          isActive={pathname === item.href}
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
    <Link
      href={item.href}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium",
        isActive
          ? "border-primary-500 bg-[#E8F5F6] text-primary-500"
          : "border-transparent text-[#505258]"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}
