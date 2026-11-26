"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Rect = { top: number; left: number; width: number; height: number };

const spotlightPadding = 8;
const gutter = 16;
const cardWidth = 360;
/* Roughly the card's height; decides whether it fits above or below. */
const cardRoom = 230;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function findTarget(target: string | null) {
  return target ? document.querySelector(`[data-tour="${target}"]`) : null;
}

/* Where the target is on screen, kept up to date while the page scrolls,
   resizes or changes. Null while the target isn't on screen, such as a
   sidebar link while the mobile menu is closed. */
function useTargetRect(target: string | null): Rect | null {
  const [rect, setRect] = React.useState<Rect | null>(null);

  React.useLayoutEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const element = findTarget(target);
        const box = element?.getBoundingClientRect();
        if (!box || box.width === 0 || box.right <= 0 || box.left >= window.innerWidth) {
          return setRect(null);
        }
        setRect((current) => {
          const next = {
            top: box.top - spotlightPadding,
            left: box.left - spotlightPadding,
            width: box.width + spotlightPadding * 2,
            height: box.height + spotlightPadding * 2,
          };
          const same =
            current &&
            current.top === next.top &&
            current.left === next.left &&
            current.width === next.width &&
            current.height === next.height;
          return same ? current : next;
        });
      });
    };
    measure();
    // Targets can appear after the step does, once their page has loaded.
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  return rect;
}

/* Brings the step's target into view, leaving room for the card. A target
   taller than the screen is lined up by its top instead. */
function scrollToTarget(target: string | null) {
  const element = findTarget(target);
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

export type SpotlightProps = {
  /** The `data-tour` value of the element to light up. Null centres the card. */
  target: string | null;
  title: string;
  body: React.ReactNode;
  /** Zero-based, for "2 of 4" and the dots. */
  index: number;
  count: number;
  /** Shown beside the text, e.g. Leafy. */
  leading?: React.ReactNode;
  onClose: () => void;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  /**
   * Leaves the page usable, for steps where the person does the thing being
   * explained. Otherwise the page is blocked and focus stays in the card.
   */
  interactive?: boolean;
};

/* One step of a guided walk: the page dims, the part being explained stays
   lit, and a card explains it beside it. Arrow keys move between steps and
   Escape ends the walk. */
export function Spotlight({
  target,
  title,
  body,
  index,
  count,
  leading,
  onClose,
  onNext,
  onBack,
  nextLabel = "Next",
  interactive = false,
}: SpotlightProps): React.JSX.Element {
  const rect = useTargetRect(target);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  const bodyId = React.useId();
  const stepKey = `${index}-${target}`;

  React.useEffect(() => {
    scrollToTarget(target);
    // An interactive step leaves focus where the person is typing.
    if (!interactive) nextRef.current?.focus({ preventScroll: true });
  }, [target, interactive, stepKey]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight" && onNext && !interactive) onNext();
      else if (event.key === "ArrowLeft" && onBack && !interactive) onBack();
      else if (event.key === "Tab" && !interactive && cardRef.current) {
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
  }, [onNext, onBack, onClose, interactive]);

  return createPortal(
    /* Covers the page, so clicks on the dimmed part change nothing mid-tour,
       unless the step lets the page be used. */
    <div className={cn("fixed inset-0 z-50", interactive && "pointer-events-none")}>
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] ring-2 ring-white/70 transition-all duration-300 ease-out motion-reduce:transition-none"
        style={rect ?? { top: "50%", left: "50%", width: 0, height: 0 }}
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal={!interactive}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        data-tour-card
        className="pointer-events-auto fixed flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-xl transition-[top,bottom,left] duration-300 ease-out motion-reduce:transition-none"
        style={cardPosition(rect)}
      >
        <div className="flex items-start gap-3">
          {leading}
          <div
            key={`text-${stepKey}`}
            className="min-w-0 flex-1 animate-in duration-300 fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
          >
            <p className="text-xs font-medium text-neutral-400">
              {index + 1} of {count}
            </p>
            <h2 id={titleId} className="mt-0.5 text-base font-semibold text-neutral-800">
              {title}
            </h2>
            <div id={bodyId} className="mt-1 text-sm text-neutral-500">
              {body}
            </div>
          </div>
          <button
            type="button"
            aria-label="End tour"
            onClick={onClose}
            className="-mt-1 -mr-1 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: count }, (_, at) => (
              <span
                key={at}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                  at === index ? "w-4 bg-brand-primary" : "w-1.5 bg-neutral-200",
                )}
              />
            ))}
          </div>
          {(onBack || onNext) && (
            <div className="flex gap-2">
              {onBack && (
                <Button variant="secondary" size="medium" onClick={onBack}>
                  Back
                </Button>
              )}
              {onNext && (
                <Button ref={nextRef} size="medium" onClick={onNext}>
                  {nextLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
