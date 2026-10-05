"use client";

import * as React from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";

import type { Admissions } from "@/lib/admissions";
import { cn } from "@/lib/utils";

import { MagneticButton } from "./MagneticButton";
import { RevealTitle } from "./RevealTitle";
import { seatUrl, type Chapter } from "./story";

const TRACKS = ["Design", "Frontend", "Backend", "Mobile"] as const;

/* Never put the stipend amount here: it stays a surprise until it arrives. */
const FACTS = ["12 months", "Virtual, taught live", "Ages 18 to 28, across Africa", "Stipend included"];

/** An inline blank in the sentence: big, underlined, and sized to its text. */
const blank =
  "mx-[0.15em] inline-block min-w-[5ch] max-w-full border-b-2 border-dashed border-neutral-300 bg-transparent px-[0.1em] align-baseline text-neutral-800 outline-none [field-sizing:content] placeholder:text-neutral-300 focus:border-solid focus:border-brand-primary";

/**
 * The last screen of the story, written as a sentence you fill in. When a
 * cohort is open it's the application; otherwise it's the waitlist. Until
 * admissions load it shows the waitlist. The canvas shrinks the Rise mark into
 * the gap beside the heading (`[data-logo-slot]`), then the whole screen
 * scrolls away to the footer.
 */
export function ApplicationCopy({ chapter, admissions }: { chapter: Chapter; admissions?: Admissions }) {
  const [track, setTrack] = React.useState<(typeof TRACKS)[number]>("Design");
  const open = admissions?.cohortsOpen ?? false;
  const cohort = admissions?.cohort?.name;

  const kicker = open
    ? cohort
      ? `Applications are open · ${cohort}`
      : "Applications are open"
    : cohort
      ? `${cohort} · Opening soon`
      : chapter.kicker;
  const title = open ? "Take your seat." : chapter.title;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    window.location.href = seatUrl(open, {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      track,
    });
  }

  return (
    <div
      data-chapter={chapter.id}
      className="pointer-events-auto absolute inset-0 flex flex-col justify-center px-5 pt-[80px] pb-8 md:px-[6vw] md:pt-[96px]"
      style={{ opacity: 0, visibility: "hidden" }}
    >
      {kicker && (
        <p
          data-fade
          className="mb-5 flex items-center gap-2.5 text-xs font-medium tracking-[0.16em] text-brand-primary uppercase md:text-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary opacity-50 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-primary" />
          </span>
          {kicker}
        </p>
      )}

      <h2 className="text-[clamp(3rem,8.2vw,9.5rem)] leading-[0.9] font-bold tracking-[-0.045em] text-neutral-800">
        {/* The canvas draws the mark here. */}
        <span data-logo-slot aria-hidden className="mr-[0.2em] inline-block h-[0.74em] w-[0.88em] align-[-0.02em]" />
        <RevealTitle text={title} />
      </h2>

      <form
        data-fade
        onSubmit={handleSubmit}
        aria-label={open ? "Apply" : "Join the waitlist"}
        className="mt-8 flex flex-col gap-8 md:mt-12 md:flex-row md:items-end md:justify-between md:gap-12"
      >
        <p className="max-w-[64rem] text-[clamp(1.35rem,2.55vw,2.6rem)] leading-[1.55] font-bold tracking-[-0.02em] text-neutral-400">
          Hi, I&apos;m
          <label className="sr-only" htmlFor="waitlist-name">
            Your name
          </label>
          <input
            id="waitlist-name"
            name="name"
            required
            autoComplete="name"
            placeholder="your name"
            className={blank}
          />
          {open ? ". I'm applying to the" : ". I'd like to join the"}
          <span className="relative mx-[0.15em] inline-flex items-baseline">
            <label className="sr-only" htmlFor="waitlist-track">
              Track
            </label>
            <select
              id="waitlist-track"
              name="track"
              value={track}
              onChange={(event) => setTrack(event.target.value as (typeof TRACKS)[number])}
              className="cursor-pointer appearance-none border-b-2 border-brand-primary bg-transparent pr-[1.1em] pl-[0.1em] text-brand-primary outline-none focus-visible:bg-brand-surface"
            >
              {TRACKS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-0 bottom-[0.32em] h-[0.7em] w-[0.7em] text-brand-primary"
            />
          </span>
          {open ? (cohort ? `track for ${cohort}. You can reach me at` : "track. You can reach me at") : "track, so write to me at"}
          <label className="sr-only" htmlFor="waitlist-email">
            Your email
          </label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            className={blank}
          />
          {open ? "." : `the moment ${cohort ?? "applications"} ${cohort ? "opens" : "open"}.`}
        </p>

        <MagneticButton
          type="submit"
          className="h-[56px] w-full shrink-0 rounded-full bg-brand-primary text-base font-bold text-white md:h-[168px] md:w-[168px] md:text-lg"
        >
          <span className="flex items-center justify-center gap-2 text-center leading-tight md:flex-col md:gap-1 md:px-5">
            {open ? "Start my application" : "Save my seat"}
            <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6" />
          </span>
        </MagneticButton>
      </form>

      <ul
        data-fade
        className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 md:mt-12"
        aria-label="About the program"
      >
        {FACTS.map((fact, k) => (
          <li key={fact} className={cn("flex items-center gap-6", k > 1 && "hidden sm:flex")}>
            {k > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-neutral-300" />}
            {fact}
          </li>
        ))}
      </ul>
    </div>
  );
}
