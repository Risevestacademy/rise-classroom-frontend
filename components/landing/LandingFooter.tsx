"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";

import { FooterMark } from "./FooterMark";
import type { ChapterId } from "./story";

/** Footer links that scroll the story back to a chapter. */
const PROGRAM: { label: string; chapter: ChapterId }[] = [
  { label: "Tracks", chapter: "track" },
  { label: "Live classes", chapter: "taught" },
  { label: "Mentors", chapter: "mentor" },
  { label: "Stipend", chapter: "stipend" },
  { label: "After Rise", chapter: "next" },
];

const MARQUEE = ["Learn", "Practice", "Progress"];

const lagosTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  hour: "2-digit",
  minute: "2-digit",
});

function subscribeToMinutes(onChange: () => void) {
  const id = window.setInterval(onChange, 10_000);
  return () => window.clearInterval(id);
}

/** The time in Lagos, ticking; empty on the server so hydration matches. */
function useLagosTime() {
  return React.useSyncExternalStore(
    subscribeToMinutes,
    () => lagosTime.format(Date.now()),
    () => ""
  );
}

/**
 * The footer: a slow marquee of the motto, a big closing line with links
 * that jump back into the story, and the Rise mark built from slats that
 * scatter from your cursor, cropped by the bottom of the page.
 */
export function LandingFooter({
  ref,
  open,
  onJump,
}: {
  ref?: React.Ref<HTMLElement>;
  /** A cohort is taking applications: say "Apply now" instead of the waitlist. */
  open: boolean;
  onJump: (chapter: ChapterId | "top") => void;
}) {
  const seat = open ? "Apply now" : "Join the waitlist";

  const time = useLagosTime();

  return (
    <footer ref={ref} className="relative overflow-hidden bg-neutral-800 text-white">
      {/* The motto, drifting past. */}
      <div aria-hidden className="overflow-hidden border-b border-white/10 py-6 md:py-8">
        <div className="flex w-max animate-[landing-marquee_38s_linear_infinite] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {[...MARQUEE, ...MARQUEE].map((word, k) => (
                <span
                  key={k}
                  className="flex items-center text-[clamp(3rem,9vw,9rem)] leading-none font-bold tracking-[-0.04em]"
                >
                  <span className={k % 2 ? "text-transparent [-webkit-text-stroke:1.5px_rgb(255_255_255/0.35)]" : ""}>
                    {word}.
                  </span>
                  <span className="mx-[0.35em] inline-block h-[0.14em] w-[0.14em] rounded-full bg-brand-primary" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-14 px-6 pt-[96px] pb-[72px] sm:px-10 md:grid-cols-12 md:gap-8 md:px-[6vw] md:pt-[128px]">
        <div className="md:col-span-6">
          <p className="text-xs font-medium tracking-[0.16em] text-[#7FC4CB] uppercase">Rise Classroom</p>
          <p className="mt-5 max-w-[14ch] text-[clamp(2.25rem,4.6vw,4.5rem)] leading-[0.98] font-bold tracking-[-0.035em]">
            Your seat is waiting.
          </p>
          <button
            type="button"
            onClick={() => onJump("end")}
            className="group mt-10 inline-flex cursor-pointer items-center gap-4 text-lg font-bold outline-none focus-visible:underline"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-primary transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:rotate-45">
              <ArrowUpRight className="h-6 w-6" />
            </span>
            <span className="relative">
              {seat}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
            </span>
          </button>
        </div>

        <nav aria-label="The program" className="md:col-span-3 md:col-start-8">
          <p className="text-xs font-medium tracking-[0.16em] text-neutral-400 uppercase">The program</p>
          <ul className="mt-5 space-y-2">
            {PROGRAM.map((item, k) => (
              <li key={item.chapter}>
                <button
                  type="button"
                  onClick={() => onJump(item.chapter)}
                  className="group flex cursor-pointer items-baseline gap-3 text-xl font-bold text-neutral-300 transition-colors outline-none hover:text-white focus-visible:text-white md:text-2xl"
                >
                  <span className="w-5 text-[11px] font-medium text-neutral-500 transition-colors group-hover:text-[#7FC4CB]">
                    0{k + 1}
                  </span>
                  <span className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5">
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Students" className="md:col-span-2 md:col-start-11">
          <p className="text-xs font-medium tracking-[0.16em] text-neutral-400 uppercase">Students</p>
          <ul className="mt-5 space-y-2 text-xl font-bold text-neutral-300 md:text-2xl">
            <li>
              <Link href="/sign-in" className="transition-colors outline-none hover:text-white focus-visible:text-white">
                Sign in
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onJump("end")}
                className="cursor-pointer transition-colors outline-none hover:text-white focus-visible:text-white"
              >
                {open ? "Apply" : "Waitlist"}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-6 text-xs text-neutral-400 sm:px-10 md:px-[6vw]">
        <span>
          © {new Date().getFullYear()} Rise Academy, a{" "}
          <a
            href="https://risevest.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
          >
            Risevest
          </a>{" "}
          programme
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7FC4CB]" />
          Lagos{time && <span className="text-neutral-300 tabular-nums">{time} WAT</span>}
        </span>
        <button
          type="button"
          onClick={() => onJump("top")}
          className="group flex cursor-pointer items-center gap-2 transition-colors outline-none hover:text-white focus-visible:text-white"
        >
          Replay the story
          <ArrowUp className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5" />
        </button>
      </div>

      <FooterMark />
    </footer>
  );
}
