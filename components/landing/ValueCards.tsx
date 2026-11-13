import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import {
  CalendarDays,
  Check,
  FileText,
  MessageCircle,
  Radio,
} from "lucide-react";

import { RiseMark } from "@/components/landing/RiseMark";
import { cn } from "@/lib/utils";

const AVATARS = [
  "/landing/testimonial/chioma-adeyemi.jpg",
  "/landing/testimonial/tunde-lawal.jpg",
  "/landing/testimonial/ifeoma-nwosu.jpg",
  "/landing/testimonial/oluwafemi-banks.jpg",
  "/landing/testimonial/rihannat-oyiza.jpg",
];

/** Delay for the nth element of a tile's entrance, in CSS. */
const delay = (index: number, step = 90) =>
  ({ transitionDelay: `${index * step}ms` }) as CSSProperties;

/* Cards start with data-inview="false" and the landing motion flips it as
   they scroll in; the visuals animate to their resting state from there. */

const MODULES = [
  { name: "Introduction to Design", done: 100 },
  { name: "User Research and Analysis", done: 72 },
  { name: "Design Layout", done: 38 },
];

function CurriculumVisual() {
  return (
    <div className="w-full max-w-[520px] rounded-[18px] border border-border-default bg-white p-4 shadow-[0_24px_60px_-24px_rgb(8_13_56/0.25)] transition-[translate,rotate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tile:-translate-y-1 group-hover/tile:-rotate-[0.6deg]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-text-muted">Cohort 2026</p>
          <p className="text-[15px] font-bold text-brand-950">
            Design Track Curriculum
          </p>
        </div>
        <span className="rounded-full bg-success-surface px-2 py-0.5 text-[11px] font-semibold text-success-text">
          Active
        </span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {["Design", "Frontend", "Product"].map((track, index) => (
          <span
            key={track}
            style={delay(index)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium opacity-0 transition-[opacity,translate] duration-500 translate-y-2",
              index === 0
                ? "border-brand-200 bg-brand-50 text-brand-800"
                : "border-border-default text-text-secondary",
              `group-data-[inview=true]/tile:translate-y-0 group-data-[inview=true]/tile:opacity-100`,
            )}
          >
            {track}
          </span>
        ))}
      </div>
      <ul className="mt-4 flex flex-col gap-2.5">
        {MODULES.map((module, index) => (
          <li
            key={module.name}
            className="rounded-[12px] bg-surface-background p-3"
          >
            <div className="flex items-center gap-2 text-[12px] font-semibold text-text-primary">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px]",
                  module.done === 100
                    ? "bg-brand-950 text-white"
                    : "bg-brand-100 text-brand-800",
                )}
              >
                {module.done === 100 ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  `0${index + 1}`
                )}
              </span>
              {module.name}
              <span className="ml-auto text-text-muted tabular-nums">
                {module.done}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100">
              <div
                style={
                  {
                    ...delay(index, 140),
                    "--done": `${module.done}%`,
                  } as CSSProperties
                }
                className={cn(
                  "h-full w-0 rounded-full bg-brand-600 transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  `group-data-[inview=true]/tile:w-[var(--done)]`,
                )}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LiveClassVisual() {
  return (
    <div className="relative w-full max-w-[280px]">
      <div className="absolute -top-3 -right-2 z-10 flex items-center gap-1.5 rounded-full bg-[#dc2626] px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-white opacity-75 motion-reduce:hidden" />
          <span className="relative size-2 rounded-full bg-white" />
        </span>
        LIVE
      </div>
      <div className="rounded-[18px] border border-border-default bg-white p-4 shadow-[0_24px_60px_-24px_rgb(8_13_56/0.3)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tile:scale-[1.03]">
        <div className="flex items-center gap-2 text-[11px] font-medium text-text-muted">
          <CalendarDays className="size-3.5" />
          Today · 6:00 – 7:30 PM
        </div>
        <p className="mt-2 text-[15px] leading-5 font-bold text-brand-950">
          Rise Academy Live Class
        </p>
        <p className="mt-0.5 text-[12px] text-text-secondary">
          Design Layout · Module 3
        </p>
        <div className="mt-4 flex items-center">
          {AVATARS.slice(0, 4).map((src, index) => (
            <Image
              key={src}
              src={src}
              alt=""
              width={56}
              height={56}
              style={delay(index, 120)}
              className={cn(
                "size-8 scale-50 rounded-full object-cover opacity-0 ring-2 ring-white transition-[scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] not-first:-ml-2.5",
                `group-data-[inview=true]/tile:scale-100 group-data-[inview=true]/tile:opacity-100`,
              )}
            />
          ))}
          <span className="ml-2 text-[12px] font-medium text-text-secondary">
            +24 joined
          </span>
        </div>
        <span className="mt-4 flex h-9 items-center justify-center gap-2 rounded-full bg-brand-950 text-[13px] font-semibold text-white">
          <Radio className="size-4" />
          Join class
        </span>
      </div>
    </div>
  );
}

function AssignmentVisual() {
  return (
    <div className="relative w-full max-w-[280px]">
      <div className="rounded-[18px] border border-border-default bg-white p-4 shadow-[0_24px_60px_-24px_rgb(8_13_56/0.3)]">
        <p className="text-[11px] font-medium text-text-muted">
          Assignment · Due Fri
        </p>
        <p className="mt-1 text-[14px] font-bold text-brand-950">
          Wireframe a learner dashboard
        </p>
        <div className="mt-3 flex items-center gap-2.5 rounded-[12px] bg-surface-background p-2.5">
          <span className="flex size-8 items-center justify-center rounded-[8px] bg-brand-100 text-brand-700">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-text-primary">
              dashboard-v2.fig
            </p>
            <p className="text-[11px] text-text-muted">Submitted by Ifeoma</p>
          </div>
        </div>
        <div
          style={delay(3, 120)}
          className={cn(
            "mt-3 flex translate-y-2 items-start gap-2 opacity-0 transition-[opacity,translate] duration-500",
            `group-data-[inview=true]/tile:translate-y-0 group-data-[inview=true]/tile:opacity-100`,
          )}
        >
          <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
          <p className="text-[12px] leading-4 text-text-secondary">
            Clear hierarchy. Try a bolder progress state next.
          </p>
        </div>
      </div>
      <span
        style={delay(5, 120)}
        className={cn(
          "absolute -top-4 -right-3 flex size-[74px] scale-[2.2] -rotate-12 items-center justify-center rounded-full border-[3px] border-success-text bg-white/90 text-center text-[11px] leading-3 font-black tracking-wide text-success-text uppercase opacity-0 transition-[scale,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          `group-data-[inview=true]/tile:scale-100 group-data-[inview=true]/tile:opacity-100`,
        )}
      >
        Excellent
        <br />
        A+
      </span>
    </div>
  );
}

const WEEKS = [34, 48, 42, 61, 58, 74, 82];

function ProgressVisual() {
  const circumference = 2 * Math.PI * 42;
  return (
    <div className="flex w-full max-w-[280px] flex-col items-center gap-5">
      <div className="relative size-[132px]">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="9"
            className="stroke-brand-100"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ "--off": circumference * 0.18 } as CSSProperties}
            className={cn(
              "stroke-brand-600 transition-[stroke-dashoffset] duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] [stroke-dashoffset:264]",
              `group-data-[inview=true]/tile:[stroke-dashoffset:var(--off)]`,
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[30px] leading-none font-black text-brand-950">
            82%
          </span>
          <span className="mt-1 text-[11px] font-semibold text-success-text">
            Healthy
          </span>
        </div>
      </div>
      <div className="flex h-14 w-full items-end gap-1.5">
        {WEEKS.map((value, index) => (
          <span
            key={index}
            style={{ ...delay(index, 70), "--h": `${value}%` } as CSSProperties}
            className={cn(
              "h-0 flex-1 rounded-t-[4px] transition-[height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
              index === WEEKS.length - 1 ? "bg-brand-600" : "bg-brand-200",
              `group-data-[inview=true]/tile:h-[var(--h)]`,
            )}
          />
        ))}
      </div>
    </div>
  );
}

const CARDS: {
  label: string;
  line: string;
  body: string;
  visual: ReactNode;
}[] = [
  {
    label: "Structure",
    line: "Your whole program, organized in one place.",
    body: "Organize cohorts, manage tracks, and connect lessons and resources to students.",
    visual: <CurriculumVisual />,
  },
  {
    label: "Live classes",
    line: "Every session, one click away.",
    body: "Schedule classes and keep every session easy to find for your learners.",
    visual: <LiveClassVisual />,
  },
  {
    label: "Feedback",
    line: "Feedback that moves people forward.",
    body: "Collect submissions, review work, and leave feedback where it’s needed.",
    visual: <AssignmentVisual />,
  },
  {
    label: "Progress",
    line: "Progress everyone can see.",
    body: "Track assignments, goals, and feedback so everyone knows what comes next.",
    visual: <ProgressVisual />,
  },
];

export function ValueCards() {
  return (
    <section
      id="solutions"
      data-bg="#FFFFFF"
      data-values
      className="px-4 py-19 lg:py-[128px]"
    >
      <div className="mx-auto grid max-w-[1200px] gap-13 lg:grid-cols-[1fr_minmax(0,600px)] lg:gap-16">
        <div className="lg:sticky lg:top-[calc(50svh-180px)] lg:self-start">
          <RiseMark />
          <h2
            data-reveal="lines"
            className="mt-6 max-w-[460px] text-[36px] leading-[1.08] font-black tracking-[-0.035em] text-brand-950 lg:text-[56px]"
          >
            Learning deserves better systems.
          </h2>
          <p className="mt-5 max-w-[400px] text-[17px] leading-7 text-text-secondary">
            More time creating meaningful experiences. Less time managing the
            process.
          </p>
          <ol className="mt-10 hidden flex-col gap-1 lg:flex">
            {CARDS.map((card, index) => (
              <li
                key={card.label}
                data-value-label
                data-active={index === 0}
                className="group flex items-center gap-4 py-1.5 text-[16px] font-semibold text-text-muted transition-colors duration-500 data-[active=true]:text-brand-950"
              >
                <span className="h-[2px] w-6 origin-left scale-x-50 rounded-full bg-current transition-[scale] duration-500 group-data-[active=true]:scale-x-100" />
                {card.label}
              </li>
            ))}
          </ol>
        </div>

        <ul className="flex flex-col gap-6">
          {CARDS.map((card, index) => (
            <li
              key={card.label}
              data-value-card
              data-inview="false"
              className={cn(
                "group/tile overflow-hidden rounded-[32px] p-7 lg:p-10",
                index % 2 ? "bg-info-surface" : "bg-brand-50",
              )}
            >
              <p className="font-work text-[14px] font-semibold text-brand-600 tabular-nums">
                0{index + 1} · {card.label}
              </p>
              <h3 className="mt-3 max-w-[420px] text-[26px] leading-[1.2] font-bold tracking-[-0.015em] text-brand-950 lg:text-[30px]">
                {card.line}
              </h3>
              <p className="mt-3 max-w-[440px] text-[16px] leading-7 text-text-secondary">
                {card.body}
              </p>
              <div className="mt-10 flex min-h-[260px] items-center justify-center">
                {card.visual}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
