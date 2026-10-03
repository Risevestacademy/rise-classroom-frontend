"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Settings,
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

const overviewNavItems: NavItem[] = [
  { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { title: "Control Tower", href: "/student/control-tower", icon: Radar },
];

const learningNavItems: NavItem[] = [
  { title: "My Tracks", href: "/student/my-tracks", icon: BookOpen },
  { title: "Assignments", href: "/student/assignments", icon: ClipboardList },
];

const communicationNavItems: NavItem[] = [
  { title: "Messages", href: "/student/messages", icon: MessageSquare },
];

const accountNavItems: NavItem[] = [
  { title: "Settings", href: "/student/settings", icon: Settings },
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
          className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-72 -translate-x-full flex-col border-r border-neutral-300 bg-white transition-transform duration-200 ease-in-out",
          "lg:static lg:z-auto lg:h-auto lg:min-h-screen lg:w-60 lg:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <div className="flex items-center justify-between gap-2.5 border-b border-neutral-300 px-4 py-5">
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
            className="text-neutral-500 hover:text-neutral-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <NavSection
            label="Overview"
            items={overviewNavItems}
            pathname={pathname}
          />
          <NavSection
            label="Learning"
            items={learningNavItems}
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

          <UserMenu variant="muted" />
        </div>
      </aside>
    </>
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
          : "border-transparent text-[#505258]",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}
