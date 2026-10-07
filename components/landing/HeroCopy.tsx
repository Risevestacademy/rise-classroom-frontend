import * as React from "react";
import { ArrowRight } from "lucide-react";

import type { Admissions } from "@/lib/admissions";
import type { LandingPeople } from "@/lib/people";
import { cn } from "@/lib/utils";

import type { Chapter } from "./story";

/** Each word starts below its mask; the load intro raises them one by one. */
function Word({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      <span className="inline-block overflow-hidden pb-[0.08em] align-top">
        <span
          data-word
          className={cn("inline-block will-change-transform", className)}
          style={{ transform: "translate3d(0, 105%, 0)" }}
        >
          {children}
        </span>
      </span>{" "}
    </>
  );
}

/**
 * The opening screen, on a teal field, composed like a magazine cover. The
 * Rise mark is the artwork: as large as the screen allows, with one real
 * person's portrait filling all three bands, cycling slowly between people.
 * The canvas draws it into `[data-hero-mark]`; a photo caption sits in the
 * empty corner under the mark's lowest wing. The copy is secondary: it sits
 * bottom left, on the header's margin, and may tuck under the mark's edge.
 */
export function HeroCopy({
  chapter,
  admissions,
  people,
  onSeat,
}: {
  chapter: Chapter;
  admissions?: Admissions;
  people?: LandingPeople;
  /** Takes you to the application (or waitlist) at the end of the story. */
  onSeat: () => void;
}) {
  const open = admissions?.cohortsOpen ?? false;
  const cohort = admissions?.cohort?.name;
  const status = open
    ? `${cohort ? `${cohort} applications` : "Applications"} are open`
    : `${cohort ?? "The next cohort"} opens soon`;

  // The headline turns on its promise: what you'll be doing.
  const words = chapter.title.split(" ");
  const split = words.findIndex((word) => word.toLowerCase().startsWith("you"));

  return (
    <div
      data-chapter={chapter.id}
      className="absolute inset-0 flex flex-col px-6 pt-[80px] pb-8 sm:px-10 md:block md:p-0"
    >
      {/* The canvas draws the mark into this box. */}
      <div
        data-hero-mark
        className="relative -mx-6 aspect-[37/31] w-[calc(100%+48px)] shrink-0 sm:-mx-10 sm:w-[calc(100%+80px)] md:absolute md:top-[76px] md:right-10 md:mx-0 md:h-[min(calc(100dvh-100px),50vw)] md:w-auto"
      >
        {/* Photo captions, one per portrait; the page crossfades them with the mark. */}
        {people?.hero.map((person, k) => (
          <p
            key={person.name}
            data-hero-caption={k}
            className="absolute right-6 bottom-[2%] text-right text-xs leading-snug text-white sm:right-10 md:right-0 md:text-sm"
            style={{ opacity: k === 0 ? 1 : 0 }}
          >
            <span className="block font-bold">{person.name}</span>
            <span className="block text-white/65">
              {person.role === "Student" ? `${person.track} student` : person.role}
            </span>
            {/* Their own words. Until we have them, a marker shows where they go, in development only. */}
            {(person.quote || process.env.NODE_ENV !== "production") && (
              <span className="mt-2 hidden max-w-[17rem] text-sm leading-snug text-white/85 md:block">
                {person.quote ? `“${person.quote}”` : `[${person.name}'s quote goes here]`}
              </span>
            )}
          </p>
        ))}
      </div>

      <div
        data-hero-line
        className="pointer-events-auto relative z-10 mt-6 md:absolute md:bottom-[7vh] md:left-10 md:mt-0 md:w-[min(42vw,40rem)]"
      >
        {chapter.kicker && (
          <p data-fade className="mb-4 text-sm font-medium text-white/70 md:mb-6" style={{ opacity: 0 }}>
            <span className="font-bold text-white">Rise Classroom</span> · Rise Academy, by{" "}
            <a
              href="https://risevest.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white"
            >
              Risevest
            </a>
          </p>
        )}
        <h1 className="text-[clamp(2.4rem,10vw,3.5rem)] leading-[0.94] font-bold tracking-[-0.045em] text-white md:text-[clamp(2.5rem,4.3vw,5.75rem)]">
          {words.map((word, k) => (
            <Word key={k} className={split >= 0 && k >= split ? "text-[#9AD3D8]" : undefined}>
              {word}
            </Word>
          ))}
        </h1>

        {chapter.body && (
          <p
            data-fade
            className="mt-4 max-w-[30rem] text-base leading-relaxed text-white/75 md:mt-6 md:text-lg"
            style={{ opacity: 0 }}
          >
            {chapter.body}
          </p>
        )}

        <div
          data-fade
          className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 md:mt-8"
          style={{ opacity: 0 }}
        >
          {admissions && (
            <button
              type="button"
              onClick={onSeat}
              className="group inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-brand-primary transition-colors outline-none hover:bg-[#E8F5F6] focus-visible:ring-4 focus-visible:ring-white/40"
            >
              {open ? "Apply now" : "Join the waitlist"}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          )}
          {admissions && <p className="text-sm font-medium text-white/70">{status}</p>}
        </div>
      </div>
    </div>
  );
}
