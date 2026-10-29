"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Logo } from "@/assets/logo";
import type { IconProps } from "@/assets/icons";
import { cn } from "@/lib/utils";
import { useSidebarNav } from "@/components/SidebarNavContext";
import { UserMenu } from "@/components/UserMenu";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<IconProps<"stroke" | "solid">>;
}

export interface NavSectionConfig {
  label: string;
  items: NavItem[];
}

export function AppSidebar({
  homeHref,
  sections,
  accountItems,
}: {
  homeHref: string;
  sections: NavSectionConfig[];
  accountItems: NavItem[];
}) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebarNav();

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
          "fixed inset-y-0 left-0 z-50 flex h-screen w-72 -translate-x-full flex-col border-r-2 border-neutral-200 bg-white transition-transform duration-200 ease-in-out",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-60 lg:shrink-0 lg:self-start lg:translate-x-0 lg:bg-transparent",
          open && "translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between">
          <Link
            href={homeHref}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex items-center pl-10 pt-6 pb-4">
              <Logo variant="teal" size="sm" />
            </div>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="mr-4 text-neutral-400 hover:text-neutral-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <hr className="mx-4 text-neutral-200" />

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <NavSection
              key={section.label}
              label={section.label}
              items={section.items}
              pathname={pathname}
            />
          ))}
        </div>

        <div className="mb-3 px-3.5">
          <div className="space-y-1">
            {accountItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                isActive={isActivePath(pathname, item.href)}
              />
            ))}
          </div>
          <hr className="mx-2 text-neutral-200" />
          <div className="mt-auto p-2">
            {/* Sign-out lives in the top nav's profile menu. */}
            <UserMenu variant="plain-white" subtitle="email" withMenu={false} />
          </div>
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
      <p className="mb-2 px-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">
        {label}
      </p>
      {items.map((item) => (
        <SidebarNavItem
          key={item.href}
          item={item}
          isActive={isActivePath(pathname, item.href)}
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
    <div className="relative flex w-full items-center px-2">
      {isActive && (
        <span className="absolute top-1/2 -left-4 h-8 w-2 -translate-y-1/2 rounded-r-md bg-brand-primary" />
      )}

      <Link
        href={item.href}
        className={cn(
          "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium",
          isActive
            ? "border-2 border-brand-primary bg-neutral-100 text-brand-primary"
            : "text-neutral-400",
        )}
      >
        <Icon
          // Figma icons switch to their solid variant when active; others (e.g. lucide) ignore it.
          {...("variants" in Icon && { variant: isActive ? "solid" : "stroke" })}
          className={cn(
            "h-5 w-5 shrink-0",
            isActive ? "text-brand-primary" : "text-neutral-400",
          )}
        />
        <span className="truncate">{item.title}</span>
      </Link>
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
