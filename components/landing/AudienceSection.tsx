"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Check, FileText, Radio, Users } from "lucide-react";

import { RiseMark } from "@/components/landing/RiseMark";
import { RollText } from "@/components/landing/RollText";
import { cn } from "@/lib/utils";

function Snippet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-[420px] rounded-[24px] border border-border-default bg-white p-5 shadow-[0_24px_60px_-32px_rgb(8_13_56/0.35)]">
      <p className="text-[13px] font-semibold text-text-muted">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

const COHORTS = [
  { name: "Design Cohort", learners: 48, status: "Active" },
  { name: "Frontend Cohort", learners: 36, status: "Active" },
  { name: "Product Cohort", learners: 22, status: "Starting soon" },
];

const TODAY = [
  { time: "9:00", title: "Design Layout", note: "Live class", icon: Radio },
  { time: "12:00", title: "Review submissions", note: "6 new", icon: FileText },
  {
    time: "16:00",
    title: "Mentor check-in",
    note: "Design Cohort",
    icon: Users,
  },
];

const MODULES = [
  { name: "Introduction to Design", done: true },
  { name: "User Research and Analysis", done: true },
  { name: "Design Layout", done: false },
];

const AUDIENCES = [
  {
    label: "Organizations",
    title: "Run every cohort from one place.",
    points: [
      "Manage multiple cohorts",
      "Organize curriculum and tracks",
      "Monitor progress and outcomes",
      "Work with instructors and mentors",
    ],
    cta: {
      label: "Talk to our team",
      href: "mailto:contact@riseclassroom.com",
    },
    snippet: (
      <Snippet title="Cohorts">
        <ul className="flex flex-col gap-2">
          {COHORTS.map((cohort) => (
            <li
              key={cohort.name}
              className="flex items-center gap-3 rounded-[14px] bg-surface-background p-3"
            >
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-100 text-brand-700">
                <Users className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-text-primary">
                  {cohort.name}
                </span>
                <span className="block text-[12px] text-text-muted">
                  {cohort.learners} learners
                </span>
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  cohort.status === "Active"
                    ? "bg-success-surface text-success-text"
                    : "bg-warning-surface text-warning-text",
                )}
              >
                {cohort.status}
              </span>
            </li>
          ))}
        </ul>
      </Snippet>
    ),
  },
  {
    label: "Instructors",
    title: "Teach the way you always wanted to.",
    points: [
      "Create and manage classes",
      "Share learning resources",
      "Track learner progress",
      "Connect with students",
    ],
    cta: { label: "Start for free", href: "/sign-up" },
    snippet: (
      <Snippet title="Today">
        <ul className="flex flex-col">
          {TODAY.map((item) => (
            <li
              key={item.title}
              className="flex items-center gap-3 border-b border-border-default py-3 last:border-0"
            >
              <span className="w-11 font-work text-[13px] font-semibold text-text-muted tabular-nums">
                {item.time}
              </span>
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-950 text-white">
                <item.icon className="size-4" />
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-text-primary">
                  {item.title}
                </span>
                <span className="block text-[12px] text-text-muted">
                  {item.note}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Snippet>
    ),
  },
  {
    label: "Learners",
    title: "Everything for class, in one place.",
    points: [
      "Join live classes",
      "Find your learning materials",
      "Submit assignments",
      "See your progress",
    ],
    cta: { label: "Sign in", href: "/sign-in" },
    snippet: (
      <Snippet title="My progress">
        <div className="flex items-center justify-between text-[13px] font-semibold">
          <span className="text-text-primary">Design Track</span>
          <span className="text-brand-700 tabular-nums">2 of 3 modules</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
          <div className="h-full w-2/3 rounded-full bg-brand-700" />
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {MODULES.map((module) => (
            <li
              key={module.name}
              className="flex items-center gap-3 rounded-[14px] bg-surface-background p-3 text-[14px] font-medium text-text-primary"
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  module.done
                    ? "bg-brand-700 text-white"
                    : "border-2 border-brand-200",
                )}
              >
                {module.done && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              {module.name}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-2 text-[12px] text-text-muted">
          <CalendarDays className="size-3.5" />
          Next live class: Thursday, 6:00 PM
        </p>
      </Snippet>
    ),
  },
];

export function AudienceSection() {
  const [active, setActive] = useState(0);
  const audience = AUDIENCES[active];

  return (
    <section data-bg="#FFFFFF" className="px-4 py-19 lg:py-[128px]">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-col items-center text-center">
          <RiseMark />
          <h2
            data-reveal="lines"
            className="mt-6 max-w-[680px] text-[36px] leading-[1.08] font-black tracking-[-0.035em] text-brand-950 lg:text-[56px]"
          >
            Built for those who make learning happen.
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Who Rise Classroom is for"
          style={{ "--i": active } as CSSProperties}
          onKeyDown={(event) => {
            const steps: Record<string, number> = {
              ArrowRight: 1,
              ArrowLeft: -1,
            };
            const step = steps[event.key];
            if (!step) return;
            event.preventDefault();
            const next = (active + step + AUDIENCES.length) % AUDIENCES.length;
            setActive(next);
            document.getElementById(`audience-tab-${next}`)?.focus();
          }}
          className="relative mx-auto mt-12 grid w-full max-w-[480px] grid-cols-3 rounded-full border border-border-default bg-white p-1"
        >
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] translate-x-[calc(var(--i)*100%)] rounded-full bg-brand-950 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
          {AUDIENCES.map((item, index) => (
            <button
              key={item.label}
              type="button"
              role="tab"
              id={`audience-tab-${index}`}
              aria-selected={index === active}
              tabIndex={index === active ? 0 : -1}
              aria-controls="audience-panel"
              onClick={() => setActive(index)}
              className={cn(
                "relative h-11 rounded-full text-[14px] font-semibold transition-colors duration-500",
                index === active
                  ? "text-white"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          key={active}
          id="audience-panel"
          role="tabpanel"
          aria-labelledby={`audience-tab-${active}`}
          className="mt-10 grid animate-[panel-in_0.6s_cubic-bezier(0.16,1,0.3,1)] items-center gap-10 rounded-[40px] bg-brand-50 p-7 sm:p-10 lg:mt-12 lg:grid-cols-2 lg:gap-13 lg:p-13 motion-reduce:animate-none"
        >
          <div>
            <h3 className="max-w-[420px] text-[30px] leading-[1.12] font-black tracking-[-0.03em] text-brand-950 lg:text-[40px]">
              {audience.title}
            </h3>
            <ul className="mt-7 flex flex-col gap-3">
              {audience.points.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 text-[16px] text-text-primary"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href={audience.cta.href}
              className="btn-press mt-9 inline-flex h-12 items-center rounded-[14px] border border-border-default bg-white px-5 text-[15px] font-semibold text-text-primary [--press:var(--color-border-strong)]"
            >
              <RollText>{audience.cta.label}</RollText>
            </Link>
          </div>
          <div className="flex justify-center">{audience.snippet}</div>
        </div>
      </div>
    </section>
  );
}
