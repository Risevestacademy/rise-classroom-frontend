"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Select } from "@base-ui/react/select";
import { ArrowUpRight, Check, ChevronDown, LoaderCircle } from "lucide-react";

import {
  joinWaitlist,
  saveWaitlistReceipt,
  startApplication,
  type Admissions,
  type SeatRequest,
} from "@/lib/admissions";
import { cn } from "@/lib/utils";

import { MagneticButton } from "./MagneticButton";
import { RevealTitle } from "./RevealTitle";
import { seatUrl, type Chapter } from "./story";

const TRACKS = ["Design", "Frontend", "Backend", "Mobile"] as const;
type Track = (typeof TRACKS)[number];

/** What each track covers, shown under its name in the picker. */
const TRACK_DETAIL: Record<Track, string> = {
  Design: "Research, wireframes and design systems",
  Frontend: "HTML, CSS, JavaScript and React",
  Backend: "Python, Node, SQL and APIs",
  Mobile: "Swift, Kotlin and Flutter",
};

/**
 * The track blank in the sentence. Reads as part of the sentence (big brand
 * word, solid underline, small chevron) and opens a card of the four tracks
 * with what each covers. Base UI handles keyboard and screen readers, and
 * submits the choice with the form as `track`.
 */
function TrackSelect({
  value,
  onChange,
  disabled,
}: {
  value: Track;
  onChange: (track: Track) => void;
  disabled?: boolean;
}) {
  return (
    <Select.Root
      name="track"
      disabled={disabled}
      value={value}
      onValueChange={(next) => next && onChange(next as Track)}
      items={TRACKS.map((track) => ({ value: track, label: track }))}
    >
      <Select.Trigger
        aria-label="Track"
        className="group/track mx-[0.15em] inline-flex cursor-pointer items-baseline gap-[0.18em] border-b-2 border-brand-primary px-[0.1em] text-brand-primary outline-none transition-colors hover:border-neutral-800 hover:text-neutral-800 focus-visible:bg-brand-surface data-[popup-open]:bg-brand-surface"
      >
        <Select.Value />
        <Select.Icon className="inline-flex self-center">
          <ChevronDown className="h-[0.55em] w-[0.55em] transition-transform duration-300 group-data-[popup-open]/track:rotate-180" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner side="bottom" align="start" sideOffset={10} alignItemWithTrigger={false} className="z-50">
          <Select.Popup className="w-[min(24rem,calc(100vw-2.5rem))] origin-[var(--transform-origin)] rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_24px_60px_-20px_rgb(17_24_25/0.35)] transition-[transform,opacity] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Select.List>
              {TRACKS.map((track) => (
                <Select.Item
                  key={track}
                  value={track}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3 outline-none select-none data-[highlighted]:bg-brand-surface"
                >
                  <span>
                    <Select.ItemText className="block text-lg leading-tight font-bold tracking-[-0.01em] text-neutral-800">
                      {track}
                    </Select.ItemText>
                    <span className="mt-0.5 block text-sm text-neutral-500">{TRACK_DETAIL[track]}</span>
                  </span>
                  <Select.ItemIndicator className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-primary text-white">
                    <Check className="h-3.5 w-3.5" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

// The stipend isn't listed: Rise Classroom doesn't handle it, so it lives in the FAQ.
const FACTS = ["Free to join", "12 months", "Virtual, taught live", "Ages 18 to 28, across Africa"];

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
  const [track, setTrack] = React.useState<Track>("Design");
  const open = admissions?.cohortsOpen ?? false;
  const cohort = admissions?.cohort?.name;

  const kicker = open
    ? cohort
      ? `Rise Academy · ${cohort} is open`
      : "Rise Academy · Applications are open"
    : cohort
      ? `Rise Academy · ${cohort} opens soon`
      : chapter.kicker;
  const title = open ? "Take your seat." : chapter.title;

  const router = useRouter();
  const submit = useMutation({
    mutationFn: (request: SeatRequest) => (open ? startApplication(request) : joinWaitlist(request)),
    onSuccess: (_, request) => {
      if (open) {
        window.location.href = seatUrl(true, request);
        return;
      }
      // The waitlist ends on its own thank-you page.
      saveWaitlistReceipt(request);
      router.push("/waitlist/joined");
    },
  });
  const pending = submit.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    submit.mutate({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      track,
      cohort: cohort ?? null,
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
        aria-busy={pending}
        className="mt-8 flex flex-col gap-8 md:mt-12 md:flex-row md:items-end md:justify-between md:gap-12"
      >
        {/* Locked while it sends, so nothing changes mid-request. */}
        <fieldset disabled={pending} className="contents">
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
          <TrackSelect value={track} onChange={setTrack} disabled={pending} />
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
        </fieldset>

        <div className="flex shrink-0 flex-col items-center gap-3">
          <MagneticButton
            type="submit"
            disabled={pending}
            aria-label={pending ? (open ? "Starting your application" : "Saving your seat") : undefined}
            className="h-[56px] w-full shrink-0 rounded-full bg-brand-primary text-base font-bold text-white disabled:cursor-progress md:h-[168px] md:w-[168px] md:text-lg"
          >
            <span className="flex items-center justify-center gap-2 text-center leading-tight md:flex-col md:gap-1 md:px-5">
              {pending ? (
                <>
                  <LoaderCircle aria-hidden className="h-5 w-5 animate-spin motion-reduce:animate-none md:h-6 md:w-6" />
                  {open ? "Starting…" : "Saving…"}
                </>
              ) : (
                <>
                  {open ? "Start my application" : "Save my seat"}
                  <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6" />
                </>
              )}
            </span>
          </MagneticButton>
          {submit.isError && (
            <p role="alert" className="max-w-[14rem] text-center text-sm text-text-error">
              That didn&apos;t go through. Check your connection and try again.
            </p>
          )}
        </div>
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
