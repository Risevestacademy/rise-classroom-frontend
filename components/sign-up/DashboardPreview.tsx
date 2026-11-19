"use client";

import { useSyncExternalStore } from "react";

import {
  Activity02,
  Admin,
  Calendar,
  Coins01,
  Cohorts,
  DashboardSquare01,
  Marketing,
  Mentor,
  Notification02,
  Search,
  Structure01,
  Teacher,
  Track,
  UserMultiple,
  Video02,
} from "@/assets/icons";
import { Logo } from "@/assets/logo";
import { cn, greeting } from "@/lib/utils";

type Icon = React.ComponentType<{ className?: string }>;

const sections: { label: string; items: [string, Icon][] }[] = [
  { label: "Overview", items: [["Dashboard", DashboardSquare01]] },
  { label: "Operations", items: [["Live Sessions", Video02]] },
  {
    label: "People",
    items: [
      ["Students", UserMultiple],
      ["Instructors", Teacher],
      ["Mentors", Mentor],
      ["Admins", Admin],
    ],
  },
  {
    label: "Academy",
    items: [
      ["Cohorts", Cohorts],
      ["Tracks", Track],
      ["Curriculum", Structure01],
    ],
  },
  {
    label: "Insight",
    items: [
      ["Reports", Coins01],
      ["Activity Log", Activity02],
    ],
  },
  {
    label: "Communication",
    items: [
      ["Announcements", Marketing],
      ["Notifications", Notification02],
    ],
  },
];

const metrics: { title: string; empty: string; tone: string }[] = [
  {
    title: "Participants",
    empty: "No participants yet",
    tone: "bg-surface-info-badge text-text-info",
  },
  {
    title: "Active Tracks",
    empty: "No added tracks",
    tone: "bg-surface-success-badge text-text-success",
  },
  {
    title: "Engagement",
    empty: "No engagement yet",
    tone: "bg-[#fdeafc] text-[#960b93]",
  },
  {
    title: "At Risk",
    empty: "No added student yet",
    tone: "bg-surface-error-badge text-text-error",
  },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

const noSubscription = () => () => {};

/* The time of day is only known in the browser, so the server renders a
   neutral greeting and the browser swaps it in after hydration. */
function useGreeting(): string {
  return useSyncExternalStore(
    noSubscription,
    () => greeting(),
    () => "Hello",
  );
}

/* The form field the applicant is in, which the preview zooms towards. */
export type PreviewFocus = "name" | "academy" | null;

/* Where each field's text sits in the preview, as a zoom and the point it
   zooms towards. The name zooms on the greeting, its largest appearance; the
   academy on the organisation tag at the foot of the sidebar. */
const zooms: Record<NonNullable<PreviewFocus>, string> = {
  name: "scale-[1.6] origin-[30%_10%]",
  academy: "scale-[1.8] origin-bottom-left",
};

/* Text the applicant is typing. While their field is focused it takes the
   brand colour, with a blinking cursor after it. */
function Typed({ value, active }: { value: string; active: boolean }) {
  if (!active) return <>{value}</>;
  return (
    <span className="text-brand-primary">
      {value}
      <span className="ml-[0.5px] inline-block h-[1em] w-[0.5px] translate-y-[0.15em] animate-[preview-caret_1s_steps(1)_infinite] bg-current motion-reduce:animate-none" />
    </span>
  );
}

/* A miniature of the dashboard the applicant's academy will get, filled in
   with what they type. While they're in a field it zooms towards the part
   that field changes, so each keystroke visibly lands somewhere. Decorative:
   the form itself carries the meaning. */
export function DashboardPreview({
  fullName,
  academyName,
  focus = null,
}: {
  fullName: string;
  academyName: string;
  focus?: PreviewFocus;
}): React.JSX.Element {
  const name = fullName.trim() || "Full name";
  const academy = academyName.trim() || "Your academy";
  const hello = useGreeting();

  return (
    <div
      aria-hidden
      className="aspect-[510/362] w-full max-w-[560px] overflow-hidden rounded-lg bg-neutral-50 font-work text-[6px] leading-tight text-text-primary shadow-[0_24px_48px_rgba(0,0,0,0.25)] select-none"
    >
      <div
        data-preview-zoom={focus ?? "none"}
        className={cn(
          "flex h-full w-full transition-[scale,transform-origin] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:scale-100 motion-reduce:transition-none",
          focus ? zooms[focus] : "scale-100 origin-center",
        )}
      >
        <aside className="flex w-[17%] shrink-0 flex-col border-r border-border-default bg-white">
          <div className="px-2 py-2.5">
            <Logo
              variant="teal"
              size="sm"
              className="origin-left scale-[0.55] gap-1"
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-1">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="px-1 pb-0.5 text-[4.5px] tracking-wider text-text-secondary uppercase">
                  {section.label}
                </p>
                {section.items.map(([title, ItemIcon], index) => {
                  const active = section.label === "Overview" && index === 0;
                  return (
                    <p
                      key={title}
                      className={cn(
                        "flex items-center gap-1 rounded-[3px] px-1 py-[3px]",
                        active
                          ? "border border-brand-primary font-medium"
                          : "text-text-secondary",
                      )}
                    >
                      <ItemIcon className="size-[7px] shrink-0" />
                      {title}
                    </p>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mx-1 mb-1.5 flex items-center gap-1 border-t border-border-default px-1 pt-1.5">
            <span className="flex size-[11px] shrink-0 items-center justify-center rounded-[2px] bg-avatar-teal-surface text-[4px] font-semibold text-avatar-teal-text">
              {initials(academy)}
            </span>
            <span className="truncate font-medium">
              <Typed value={academy} active={focus === "academy"} />
            </span>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-2 border-b border-border-default px-2.5 py-1.5">
            <p className="text-text-secondary">
              Overview <span className="px-0.5">›</span>{" "}
              <span className="font-medium text-text-primary">Dashboard</span>
            </p>
            <div className="flex items-center gap-1.5">
              <span className="flex h-[11px] w-20 items-center gap-0.5 rounded-[3px] border border-border-default px-1 text-text-secondary">
                <Search className="size-[6px]" />
                Search
              </span>
              <span className="flex size-[11px] items-center justify-center rounded-[3px] bg-neutral-100">
                <Calendar className="size-[6px]" />
              </span>
              <span className="flex size-[11px] items-center justify-center rounded-[3px] bg-neutral-100">
                <Notification02 className="size-[6px]" />
              </span>
              <span className="flex size-[12px] items-center justify-center rounded-full bg-brand-primary text-[4.5px] font-semibold text-white">
                {initials(name) || "FN"}
              </span>
              <span className="max-w-20">
                <span className="block truncate font-medium">
                  <Typed value={name} active={focus === "name"} />
                </span>
                <span className="block text-[4.5px] text-text-secondary">
                  Super Admin
                </span>
              </span>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-2.5 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold">
                  {hello}, <Typed value={name} active={focus === "name"} />
                </p>
                <p className="text-[5px] text-text-secondary">
                  Here&apos;s what&apos;s happening across your program
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-0.5 rounded-[3px] border border-border-default bg-white px-1 py-0.5">
                <Calendar className="size-[6px]" />
                This week
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {metrics.map((metric) => (
                <div
                  key={metric.title}
                  className="flex gap-1 rounded-[4px] bg-white p-1.5"
                >
                  <span
                    className={cn(
                      "size-[10px] shrink-0 rounded-[3px]",
                      metric.tone,
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{metric.title}</p>
                    <p className="text-[7px] font-semibold">--</p>
                    <p className="truncate text-[4.5px] text-text-secondary">
                      {metric.empty}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
              <span className="relative mb-1 block h-[22px] w-[34px]">
                <span className="absolute top-0 right-0 h-[14px] w-[26px] rounded-[3px] border border-border-default bg-neutral-100" />
                <span className="absolute bottom-0 left-0 h-[14px] w-[26px] rounded-[3px] border border-border-default bg-white" />
              </span>
              <p className="text-[8px] font-semibold">
                It&apos;s quiet for now
              </p>
              <p className="max-w-[150px] text-[5px] text-text-secondary">
                Start by setting up your tracks and adding participants. As your
                program grows, you&apos;ll see engagement, progress, and
                important updates here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
