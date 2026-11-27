"use client";

import { createContext, useContext } from "react";
import Image from "next/image";
import {
  BatteryFull,
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  Search,
  Signal,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/assets/logo";
import { cn } from "@/lib/utils";

/** Each app is laid out at one of these sizes and scaled to fit the device's screen. */
export const LAYOUT_SIZE = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
} as const;

export type Layout = keyof typeof LAYOUT_SIZE;

const LayoutContext = createContext<Layout>("desktop");
export const LayoutProvider = LayoutContext.Provider;

/** True when the app is drawn for a phone screen. */
export function usePhone() {
  return useContext(LayoutContext) === "phone";
}

/** Height of a sidebar item plus the gap below it. */
const NAV_STEP = 48;

export type NavItem = { id: string; title: string; icon: React.ComponentType<{ className?: string }> };
export type NavSection = { label: string; items: NavItem[] };

export function Card({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-neutral-200 bg-white", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ProgressBar({ value, id }: { value: number; id?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        data-demo={id}
        className="h-full origin-left rounded-full bg-brand-primary"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

const BADGE = {
  success: "bg-surface-success-badge text-green-700",
  warning: "bg-surface-warning-badge text-amber-700",
  error: "bg-red-50 text-red-600",
  brand: "bg-surface-brand text-brand-600",
};

export function Badge({
  tone,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { tone: keyof typeof BADGE }) {
  return (
    <span
      className={cn(
        "w-fit rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        BADGE[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Two badges in one spot, so the timeline can swap one for the other. */
export function BadgeSwap({
  id,
  from,
  to,
}: {
  id: string;
  from: [keyof typeof BADGE, string];
  to: [keyof typeof BADGE, string];
}) {
  return (
    <span className="grid">
      <Badge data-demo={`${id}-from`} tone={from[0]} className="[grid-area:1/1]">
        {from[1]}
      </Badge>
      <Badge data-demo={`${id}-to`} tone={to[0]} className="opacity-0 [grid-area:1/1]">
        {to[1]}
      </Badge>
    </span>
  );
}

const AVATAR_TONES = [
  "bg-brand-100 text-brand-700",
  "bg-amber-100 text-amber-700",
  "bg-green-100 text-green-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
];

export function Initials({
  name,
  tone = 0,
  className,
}: {
  name: string;
  tone?: number;
  className?: string;
}) {
  const letters = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        AVATAR_TONES[tone % AVATAR_TONES.length],
        className,
      )}
    >
      {letters}
    </span>
  );
}

/** A long, grouped sidebar like the admin's. It doesn't change page, so no sliding pill. */
function SectionedNav({ sections, active }: { sections: NavSection[]; active: string }) {
  return (
    <div className="px-4 py-3">
      {sections.map(({ label, items }) => (
        <div key={label} className="mb-2">
          <p className="mb-1 px-1 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
            {label}
          </p>
          {items.map(({ id, title, icon: Icon }) => (
            <div
              key={id}
              data-demo={`nav-${id}`}
              className={cn(
                "flex h-8 items-center gap-3 rounded-lg border px-3 text-[13px] font-medium",
                id === active
                  ? "border-brand-primary bg-surface-brand text-brand-primary"
                  : "border-transparent text-neutral-500",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Sidebar({
  nav,
  sections,
  active,
}: {
  nav: NavItem[];
  sections?: NavSection[];
  active: string;
}) {
  const index = nav.findIndex((item) => item.id === active);
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-5">
        <Logo variant="teal" size="sm" />
      </div>
      {sections ? (
        <SectionedNav sections={sections} active={active} />
      ) : (
      <div className="px-4 py-4">
        <p className="mb-3 px-1 text-xs font-medium tracking-wider text-neutral-400 uppercase">
          Home
        </p>
        <div className="relative space-y-2">
          <span
            data-demo="nav-pill"
            className="absolute inset-x-0 top-0 h-10 rounded-lg border border-brand-primary bg-surface-brand"
            style={{ transform: `translateY(${index * NAV_STEP}px)` }}
          />
          {nav.map(({ id, title, icon: Icon }) => (
            <div
              key={id}
              data-demo={`nav-${id}`}
              className={cn(
                "relative flex h-10 items-center gap-3 px-3 text-sm font-medium",
                id === active ? "text-brand-primary" : "text-neutral-500",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {title}
            </div>
          ))}
        </div>
      </div>
      )}
    </aside>
  );
}

export type Crumb = { id: string; parts: string[] };

function TopBar({ crumbs, user }: { crumbs: Crumb[]; user: { name: string; meta: string } }) {
  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 px-8">
      <div className="relative h-5 flex-1 text-sm">
        {crumbs.map(({ id, parts }, index) => (
          <div
            key={id}
            data-demo={`crumb-${id}`}
            className={cn("absolute inset-0 flex items-center gap-2", index > 0 && "opacity-0")}
          >
            {parts.map((part, i) => (
              <span key={part} className="flex items-center gap-2">
                <span
                  className={
                    i === parts.length - 1 ? "font-medium text-neutral-800" : "text-neutral-400"
                  }
                >
                  {part}
                </span>
                {i < parts.length - 1 && <ChevronRight className="size-4 text-neutral-400" />}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="flex h-9 w-64 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-400">
        <Search className="size-4" />
        Search
      </div>
      {[Calendar, Bell].map((Icon, i) => (
        <span
          key={i}
          className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500"
        >
          <Icon className="size-5" />
        </span>
      ))}
      <div className="flex items-center gap-2 pl-1">
        <Image
          src="/default-avatar.png"
          alt=""
          width={36}
          height={36}
          className="size-9 rounded-full"
        />
        <div className="text-xs leading-4">
          <p className="font-medium text-neutral-800">{user.name}</p>
          <p className="text-neutral-400">{user.meta}</p>
        </div>
      </div>
    </header>
  );
}

/** A file being dragged in from the desktop. */
function DraggedFile({ name }: { name: string }) {
  return (
    <div
      data-demo="file"
      className="absolute top-0 left-0 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 opacity-0 shadow-xl"
    >
      <FileText className="size-4 text-red-600" />
      {name}
    </div>
  );
}

function Cursor() {
  const phone = usePhone();
  return (
    <div data-demo="cursor" className="absolute top-0 left-0 z-40 opacity-0">
      <span
        data-demo="ripple"
        className="absolute -top-4 -left-4 size-8 rounded-full bg-brand-500/30 opacity-0"
      />
      {phone ? (
        <svg width="34" height="34" viewBox="0 0 34 34" className="-mt-[17px] -ml-[17px]">
          <circle cx="17" cy="17" r="15" fill="rgb(8 13 56 / 0.18)" stroke="#FFFFFF" strokeWidth="2" />
        </svg>
      ) : (
      <svg width="22" height="26" viewBox="0 0 22 26" className="drop-shadow-md">
        <path
          d="M2 2 L2 21 L7 16.5 L10.5 24 L14 22.5 L10.5 15 L17 15 Z"
          fill="#080D38"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      )}
    </div>
  );
}

/** A toast along the bottom of the app. */
export function Toast({ id, icon: Icon, children }: { id: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center">
      <div
        data-demo={id}
        className="flex items-center gap-3 rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white opacity-0 shadow-2xl"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-white/15">
          <Icon className="size-3.5" />
        </span>
        {children}
      </div>
    </div>
  );
}

/** A dimmed backdrop with a dialog centred on the app. */
export function DemoDialog({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-demo={`${id}-backdrop`}
      className="absolute inset-0 z-20 flex items-center justify-center bg-brand-950/40 opacity-0"
    >
      <div
        data-demo={id}
        className={cn("rounded-2xl bg-white p-6 shadow-2xl", className)}
      >
        {children}
      </div>
    </div>
  );
}

type ShellProps = {
  /** The phone's bottom bar, and the sidebar unless `sections` is given. */
  nav: NavItem[];
  sections?: NavSection[];
  active: string;
  crumbs: Crumb[];
  user: { name: string; meta: string };
  /** Floats in the bottom-right corner, where the app keeps Leafy. */
  corner?: React.ReactNode;
  file?: string;
  overlay?: React.ReactNode;
  children: React.ReactNode;
};

/** The app frame every role shares: navigation, top bar, then the role's scenes. */
export function Shell(props: ShellProps) {
  const phone = usePhone();
  const { width, height } = LAYOUT_SIZE[phone ? "phone" : "desktop"];
  const { nav, sections, active, crumbs, user, corner, file, overlay, children } = props;

  return (
    <div
      data-layout={phone ? "phone" : "desktop"}
      className={cn("relative flex overflow-hidden bg-neutral-50 text-left", phone && "flex-col")}
      style={{ width, height }}
    >
      {phone ? (
        <>
          <PhoneTopBar crumbs={crumbs} />
          <div className="relative flex-1">{children}</div>
          <BottomNav nav={nav} active={active} />
        </>
      ) : (
        <>
          <Sidebar nav={nav} sections={sections} active={active} />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar crumbs={crumbs} user={user} />
            <div className="relative flex-1">{children}</div>
          </div>
        </>
      )}
      {corner && (
        <div className={cn("absolute z-10", phone ? "right-4 bottom-[100px]" : "right-6 bottom-6")}>
          {corner}
        </div>
      )}
      {overlay}
      {file && <DraggedFile name={file} />}
      <Cursor />
    </div>
  );
}

function PhoneTopBar({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <header className="relative z-10 shrink-0 bg-neutral-50 px-5 pt-14 pb-3">
      <div className="absolute inset-x-0 top-0 flex h-12 items-center justify-between px-8 text-sm font-semibold text-neutral-800">
        <span>9:41</span>
        <span className="flex items-center gap-1.5">
          <Signal className="size-4" />
          <Wifi className="size-4" />
          <BatteryFull className="size-5" />
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-7 flex-1">
          {crumbs.map(({ id, parts }, index) => (
            <p
              key={id}
              data-demo={`crumb-${id}`}
              className={cn(
                "absolute inset-0 truncate text-xl font-bold text-neutral-800",
                index > 0 && "opacity-0",
              )}
            >
              {parts[parts.length - 1]}
            </p>
          ))}
        </div>
        <Image src="/default-avatar.png" alt="" width={36} height={36} className="size-9 rounded-full" />
      </div>
    </header>
  );
}

function BottomNav({ nav, active }: { nav: NavItem[]; active: string }) {
  const index = nav.findIndex((item) => item.id === active);
  return (
    <nav className="relative z-10 shrink-0 border-t border-neutral-200 bg-white px-3 pt-2 pb-7">
      <div className="relative grid grid-cols-4">
        <span
          data-demo="nav-pill"
          data-axis="x"
          className="absolute top-0 left-0 h-full w-1/4 rounded-xl bg-surface-brand"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {nav.map(({ id, title, icon: Icon }) => (
          <div
            key={id}
            data-demo={`nav-${id}`}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
              id === active ? "text-brand-primary" : "text-neutral-500",
            )}
          >
            <Icon className="size-5" />
            <span className="max-w-full truncate px-1">{title}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}
