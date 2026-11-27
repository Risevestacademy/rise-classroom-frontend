"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { useCompanion } from "@/components/mascot/Companion";
import { InteractiveMascot } from "@/components/mascot/InteractiveMascot";
import { TEAL_PALETTE, type MascotMood } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";

/* Each step points at the element marked `data-tour="<target>"`. */
type TourStep = {
  target: string;
  title: string;
  body: string;
  mood: MascotMood;
};

export const controlTowerTourSteps: TourStep[] = [
  {
    target: "header",
    title: "Welcome to Control Tower",
    body: "This is your weekly check-in. Let me show you around. It takes less than a minute.",
    mood: "happy",
  },
  {
    target: "plan",
    title: "Plan your week",
    body: "Start each week here: what you're focusing on, and what you want to achieve.",
    mood: "thinking",
  },
  {
    target: "check-in",
    title: "Check in with your mentor",
    body: "After you meet your mentor, note what came out of it and how you're getting on.",
    mood: "happy",
  },
  {
    target: "reflection",
    title: "Reflect on the week",
    body: "Before the week ends, look back at what went well, what didn't and what you'll change.",
    mood: "thinking",
  },
  {
    target: "goals",
    title: "Track your goals",
    body: "Your goals and KPIs run for the whole programme. Update a KPI whenever it moves; changes here save straight away.",
    mood: "happy",
  },
  {
    target: "save",
    title: "Save before the deadline",
    body: "Saving marks the week Completed. A week left empty is marked Missed, but you can still fill it in later.",
    mood: "proud",
  },
  {
    target: "menu",
    title: "Look back any time",
    body: "Your previous weeks live in this menu, and so does this tour if you want it again.",
    mood: "celebrate",
  },
];

const seenKey = (userId: string) => `control-tower-tour-seen:${userId}`;

function readSeen(userId: string): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) === "1";
  } catch {
    return false;
  }
}

function writeSeen(userId: string): void {
  try {
    localStorage.setItem(seenKey(userId), "1");
  } catch {
    /* Without storage the tour simply offers itself again next visit. */
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Opens the tour by itself the first time a student with Leafy planted comes
   to Control Tower, unless they've asked Leafy to stay quiet. `start` replays
   it from the page's menu. */
export function useControlTowerTour() {
  const { planted, quiet } = useCompanion();
  const userId = useQuery(sessionQuery()).data?.user.id;
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!userId || !planted || quiet || readSeen(userId)) return;
    /* Lets the page settle (and Leafy's own greeting rise) first. */
    const timer = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(timer);
  }, [userId, planted, quiet]);

  const close = React.useCallback(
    (finished: boolean) => {
      setOpen(false);
      if (userId) writeSeen(userId);
      track(finished ? "control_tower_tour_finished" : "control_tower_tour_skipped");
    },
    [userId],
  );

  const start = React.useCallback(() => {
    track("control_tower_tour_started");
    setOpen(true);
  }, []);

  return { open, start, close };
}

type Rect = { top: number; left: number; width: number; height: number };

const spotlightPadding = 8;
const gutter = 16;
const cardWidth = 360;
/* Roughly the card's height; decides whether it fits above or below. */
const cardRoom = 230;

/* Where the target is on screen, kept up to date while the page scrolls or
   resizes. Null while the target isn't on the page. */
function useTargetRect(target: string): Rect | null {
  const [rect, setRect] = React.useState<Rect | null>(null);

  React.useLayoutEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const element = document.querySelector(`[data-tour="${target}"]`);
        if (!element) return setRect(null);
        const box = element.getBoundingClientRect();
        setRect({
          top: box.top - spotlightPadding,
          left: box.left - spotlightPadding,
          width: box.width + spotlightPadding * 2,
          height: box.height + spotlightPadding * 2,
        });
      });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  return rect;
}

/* Brings the step's target into view, leaving room for the card. A target
   taller than the screen is lined up by its top instead. */
function scrollToTarget(target: string) {
  const element = document.querySelector(`[data-tour="${target}"]`);
  if (!element) return;
  const box = element.getBoundingClientRect();
  const behavior = prefersReducedMotion() ? "auto" : "smooth";
  const fits = box.height < window.innerHeight - cardRoom - gutter * 3;
  const top = fits
    ? window.scrollY + box.top - (window.innerHeight - box.height - cardRoom) / 2
    : window.scrollY + box.top - 88;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

/* The card goes below the target if it fits, else above, else it sits at the
   bottom of the screen over the target. */
function cardPosition(rect: Rect | null): React.CSSProperties {
  const width = Math.min(cardWidth, window.innerWidth - gutter * 2);
  if (!rect) {
    return { width, left: (window.innerWidth - width) / 2, top: "50%", translate: "0 -50%" };
  }
  const left = Math.min(
    Math.max(gutter, rect.left + rect.width - width),
    window.innerWidth - width - gutter,
  );
  const below = rect.top + rect.height + 12;
  if (window.innerHeight - below >= cardRoom) return { width, left, top: below };
  if (rect.top - 12 >= cardRoom) {
    return { width, left, bottom: window.innerHeight - rect.top + 12 };
  }
  return { width, left, bottom: gutter };
}

/* A guided walk through Control Tower with Leafy: the page dims, the part
   being explained stays lit, and Leafy explains it beside it. Arrow keys move
   between steps and Escape ends the tour. Mount it only while the tour is
   open, so every run starts from the first step. */
export function ControlTowerTour({
  onClose,
}: {
  onClose: (finished: boolean) => void;
}): React.JSX.Element {
  const { growth, planted } = useCompanion();
  const [index, setIndex] = React.useState(0);
  const step = controlTowerTourSteps[index]!;
  const rect = useTargetRect(step.target);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  const last = index === controlTowerTourSteps.length - 1;
  const titleId = React.useId();
  const bodyId = React.useId();

  React.useEffect(() => {
    scrollToTarget(step.target);
    nextRef.current?.focus({ preventScroll: true });
  }, [step]);

  const next = React.useCallback(() => {
    if (last) onClose(true);
    else setIndex((current) => current + 1);
  }, [last, onClose]);
  const back = React.useCallback(
    () => setIndex((current) => Math.max(0, current - 1)),
    [],
  );

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(false);
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") back();
      else if (event.key === "Tab" && cardRef.current) {
        /* Focus stays inside the card while the rest of the page is dimmed. */
        const focusable = cardRef.current.querySelectorAll<HTMLElement>("button");
        const first = focusable[0];
        const lastButton = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          lastButton?.focus();
        } else if (!event.shiftKey && document.activeElement === lastButton) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, back, onClose]);

  return createPortal(
    /* Covers the page, so clicks on the dimmed part change nothing mid-tour. */
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] ring-2 ring-white/70 transition-all duration-300 ease-out motion-reduce:transition-none"
        style={
          rect ?? { top: "50%", left: "50%", width: 0, height: 0 }
        }
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="fixed flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-xl transition-[top,bottom,left] duration-300 ease-out motion-reduce:transition-none"
        style={cardPosition(rect)}
      >
        <div className="flex items-start gap-3">
          {planted && (
            <InteractiveMascot
              key={`mascot-${step.target}`}
              growth={growth}
              mood={step.mood}
              palette={TEAL_PALETTE}
              size={64}
              className="-mt-1 shrink-0"
              label="Leafy, your learning companion"
            />
          )}
          <div
            key={`text-${step.target}`}
            className="min-w-0 flex-1 animate-in duration-300 fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
          >
            <p className="text-xs font-medium text-neutral-400">
              {index + 1} of {controlTowerTourSteps.length}
            </p>
            <h2 id={titleId} className="mt-0.5 text-base font-semibold text-neutral-800">
              {step.title}
            </h2>
            <p id={bodyId} className="mt-1 text-sm text-neutral-500">
              {step.body}
            </p>
          </div>
          <button
            type="button"
            aria-label="End tour"
            onClick={() => onClose(false)}
            className="-mt-1 -mr-1 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {controlTowerTourSteps.map((item, at) => (
              <span
                key={item.target}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                  at === index ? "w-4 bg-brand-primary" : "w-1.5 bg-neutral-200",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="secondary" size="medium" onClick={back}>
                Back
              </Button>
            )}
            <Button ref={nextRef} size="medium" onClick={next}>
              {last ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
