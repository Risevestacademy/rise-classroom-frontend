
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  Radar,
  Megaphone,
  Bell,
  MessageCircle,
  Settings,
  Blocks,
  X,
} from "lucide-react";

import { Logo } from "@/assets/logo";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/UserMenu";
import { useStudentNav } from "@/components/StudentNavContext";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const homeNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My learning",
    href: "/student/my-learning",
    icon: GraduationCap,
  },
  {
    title: "Assignments",
    href: "/student/assignments",
    icon: ClipboardList,
  },
  {
    title: "Control tower",
    href: "/student/control-tower",
    icon: Radar,
  },
];

const communicationNavItems: NavItem[] = [
  {
    title: "Announcements",
    href: "/student/announcements",
    icon: Megaphone,
  },
  {
    title: "Notifications",
    href: "/student/notifications",
    icon: Bell,
  },
  {
    title: "Chat",
    href: "/student/chat",
    icon: MessageCircle,
  },
];

const accountNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/student/settings",
    icon: Settings,
  },
  {
    title: "Integration",
    href: "/student/integration",
    icon: Blocks,
  },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useStudentNav();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-neutral-800/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-72 -translate-x-full flex-col overflow-hidden border-r border-neutral-200 bg-white transition-transform duration-200 ease-in-out",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:min-h-0 lg:w-60 lg:shrink-0 lg:translate-x-0 lg:self-start",
          open && "translate-x-0",
        )}
      >
        {/* Logo header */}
        <div className="flex shrink-0 items-center justify-between gap-2.5 border-b border-neutral-200 px-4 py-5">
          <Link
            href="/student/dashboard"
            className="flex items-center overflow-hidden"
          >
            <Logo variant="teal" size="sm" />
          </Link>

          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="text-neutral-400 hover:text-neutral-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable navigation */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
          <NavSection
            label="Home"
            items={homeNavItems}
            pathname={pathname}
            itemsClassName="space-y-2"
          />

          <NavSection
            label="Communication"
            items={communicationNavItems}
            pathname={pathname}
          />
        </div>

        {/* Fixed account section */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="space-y-1">
            {accountNavItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
          </div>

          <hr className="my-3 text-neutral-200" />

          <UserMenu variant="plain" subtitle="email" />
        </div>
      </aside>
    </>
  );
}

function NavSection({
  label,
  items,
  pathname,
  itemsClassName,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  itemsClassName?: string;
}) {
  return (
    <div>
      <p className="mb-3 px-1 text-xs font-medium tracking-wider text-neutral-400 uppercase">
        {label}
      </p>

      <div className={itemsClassName}>
        {items.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </div>
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
    <div className="relative flex w-full items-center">
      {isActive && (
        <span className="absolute top-1/2 -left-4 h-7 w-1 -translate-y-1/2 rounded-r-full bg-brand-primary" />
      )}

      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-10 w-full items-center gap-3 rounded-lg border px-3 text-sm font-medium",
          isActive
            ? "border-brand-primary bg-surface-brand text-brand-primary"
            : "border-transparent text-neutral-500",
        )}
      >
        <Icon
          fill={isActive ? "currentColor" : "none"}
          className="h-5 w-5 shrink-0"
        />

        <span className="truncate">{item.title}</span>
      </Link>
    </div>
  );
}
