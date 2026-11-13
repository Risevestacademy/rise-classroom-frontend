"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Laptop, ListChecks, Palette, Shapes } from "lucide-react";

import { Notification02, Search, Settings01 } from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import {
  SettingsProvider,
  useSettings,
} from "@/components/settings/SettingsContext";
import { SuccessToast } from "@/components/ui/toast";
import {
  searchSettings,
  settingsBasePath,
  settingsNavItems,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

const navIcons: Record<
  (typeof settingsNavItems)[number]["key"],
  React.ComponentType<{ className?: string }>
> = {
  general: Settings01,
  appearance: Palette,
  learning: Shapes,
  roles: ListChecks,
  notifications: Notification02,
  system: Laptop,
};

export function SettingsShell({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <SettingsProvider>
      <AdminTopNav
        breadcrumb={["Overview", { label: "Settings", href: settingsBasePath }]}
      />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-x-16 gap-y-6 lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-y-10 xl:gap-x-25">
          <h1 className="self-center text-2xl font-semibold text-text-primary">
            Settings
          </h1>
          <SettingsSearch />
          <SettingsNav />
          <div className="min-w-0">{children}</div>
        </div>
      </main>
      <SettingsToast />
    </SettingsProvider>
  );
}

function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings"
      className="-mx-4 flex gap-1 self-start overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
    >
      {settingsNavItems.map((item) => {
        const Icon = navIcons[item.key];
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 font-work text-sm font-medium whitespace-nowrap text-text-primary transition-colors hover:bg-surface-subtle",
              isActive && "bg-surface-subtle",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

function SettingsSearch() {
  const [query, setQuery] = React.useState("");
  const results = searchSettings(query);
  const isSearching = query.trim().length > 0;

  return (
    <div className="relative w-full max-w-118">
      <div className="flex h-9 items-center gap-2 rounded-lg border border-border-default px-2.5 text-icon-muted transition-colors focus-within:border-border-focus">
        <Search className="size-4 shrink-0" />
        <input
          type="search"
          aria-label="Search settings"
          placeholder="Search settings"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
          }}
          className="w-full bg-transparent font-work text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {isSearching && (
        <div className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-lg bg-surface-default py-2 font-work shadow-[0_2px_6px_rgb(0_0_0/0.19),0_0_1px_rgb(0_0_0/0.25)]">
          {results.length === 0 ? (
            <p className="px-4 py-2 text-sm text-text-muted">
              No settings match &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul>
              {results.map((result) => (
                <li key={`${result.section}-${result.label}`}>
                  <Link
                    href={result.href}
                    onClick={() => setQuery("")}
                    className="flex min-h-10 items-center justify-between gap-3 px-4 py-1.5 text-sm text-text-primary hover:bg-brand-100 focus-visible:bg-brand-100 focus-visible:outline-none"
                  >
                    {result.label}
                    <span className="text-xs text-text-muted">
                      {result.section}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsToast() {
  const { toast, setToast } = useSettings();
  const dismiss = React.useCallback(() => setToast(null), [setToast]);

  if (!toast) return null;
  return (
    <SuccessToast
      title={toast.title}
      message={toast.message}
      onDismiss={dismiss}
    />
  );
}
