"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { CirclePause, CirclePlay } from "lucide-react";

import {
  EASE_OUT,
  Flip,
  gsap,
  MEDIA,
  useGSAP,
} from "@/components/landing/motion/gsap";
import { cn } from "@/lib/utils";

// TODO: swap in the per-tab dashboard screenshots once they're exported from
// Figma. Every tab shows the curriculum dashboard until then.
const PRODUCT_TABS = [
  { label: "Analytics", screen: "/landing/analytics-mockup.webp" },
  { label: "Learning", screen: "/landing/dashboard-mockup.webp" },
  { label: "Community", screen: "/landing/dashboard-mockup.webp" },
  { label: "Chat", screen: "/landing/dashboard-mockup.webp" },
  { label: "Calendar", screen: "/landing/calendar-mockup.webp" },
];
const TAB_COUNT = PRODUCT_TABS.length;
/** How long each tab stays up before advancing to the next. */
const AUTO_ADVANCE_SECONDS = 5;

/**
 * Product tabs and the dashboard they switch between. The tabs advance on a
 * timer (paused while hovered), and clicking a tab jumps straight to it.
 */
export function HeroShowcase() {
  const root = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabScroller = useRef<HTMLDivElement>(null);
  const pillState = useRef<Flip.FlipState | null>(null);
  const timer = useRef<gsap.core.Tween | null>(null);
  const hovered = useRef(false);
  const [paused, setPaused] = useState(false);
  // Read by the timer callbacks, which outlive the render they were made in.
  const pausedRef = useRef(false);

  const togglePaused = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    // While paused the timer stays stopped even after the pointer leaves.
    if (pausedRef.current) timer.current?.pause();
    else if (!hovered.current) timer.current?.resume();
  };
  const mounted = useRef(false);
  const [active, setActive] = useState(0);

  // Every tab change goes through select(), which keeps this in sync.
  const activeRef = useRef(0);

  const select = (index: number) => {
    if (index === activeRef.current) return;
    // Capture where the pill is before React moves it to the new tab.
    pillState.current = Flip.getState("[data-tab-pill]");
    activeRef.current = index;
    setActive(index);
  };

  // Per-tab transitions: slide the pill, wipe in the new screen, and restart
  // the auto-advance timer.
  useGSAP(
    () => {
      const state = pillState.current;
      pillState.current = null;
      const isFirstRun = !mounted.current;
      mounted.current = true;

      // Keep the active tab centred when the bar scrolls (mobile).
      const scroller = tabScroller.current;
      const tab = tabRefs.current[active];
      if (scroller && tab && scroller.scrollWidth > scroller.clientWidth) {
        scroller.scrollTo({
          left: tab.offsetLeft - (scroller.clientWidth - tab.offsetWidth) / 2,
          behavior: isFirstRun ? "auto" : "smooth",
        });
      }

      if (!window.matchMedia(MEDIA.motion).matches) return;

      if (state) {
        Flip.from(state, {
          targets: "[data-tab-pill]",
          duration: 0.6,
          ease: EASE_OUT,
          scale: false,
        });
      }

      if (!isFirstRun) {
        gsap.fromTo(
          `[data-screen="${active}"]`,
          { clipPath: "inset(0% 0% 100% 0%)", scale: 1.04 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            duration: 0.9,
            ease: EASE_OUT,
          }
        );
      }

      timer.current = gsap.fromTo(
        "[data-tab-progress]",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: AUTO_ADVANCE_SECONDS,
          ease: "none",
          onComplete: () => select((active + 1) % TAB_COUNT),
        }
      );
      if (hovered.current || pausedRef.current) timer.current.pause();
    },
    { scope: root, dependencies: [active], revertOnUpdate: true }
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (active + step + TAB_COUNT) % TAB_COUNT;
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      ref={root}
      className="flex w-full flex-col items-center"
      onPointerEnter={() => {
        hovered.current = true;
        timer.current?.pause();
      }}
      onPointerLeave={() => {
        hovered.current = false;
        if (!pausedRef.current) timer.current?.resume();
      }}
    >
      {/* Sticks to the top while the dashboard is on screen (the nav hides to
          make room), so tabs can be switched without scrolling back up. On
          narrow screens the bar scrolls sideways, edge to edge. */}
      <div
        ref={tabScroller}
        data-intro="tabs"
        data-hero-tabs
        className="group/tabs sticky top-3 z-20 -mx-4 mt-[33px] w-[calc(100%+2rem)] overflow-x-auto px-4 py-3 [scrollbar-width:none] lg:top-4 lg:mx-0 lg:mt-[45px] lg:w-auto lg:overflow-visible lg:px-0 lg:py-0 [&::-webkit-scrollbar]:hidden"
      >
        <div
          role="tablist"
          aria-label="Product areas"
          onKeyDown={onKeyDown}
          className="mx-auto flex h-[50px] w-max items-center gap-2 rounded-full border border-neutral-300 bg-white p-1 shadow-[inset_0_2px_8px_rgb(0_0_0/0.04)] transition-shadow duration-500 group-data-[stuck=true]/tabs:shadow-[inset_0_2px_8px_rgb(0_0_0/0.04),0_12px_32px_rgb(16_22_79/0.16)]"
        >
          {PRODUCT_TABS.map((tab, index) => {
            const isActive = index === active;
            return (
              <button
                key={tab.label}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                id={`product-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="product-panel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(index)}
                className={cn(
                  "relative isolate h-10 overflow-hidden rounded-full px-4 text-[14px] leading-5 font-medium transition-colors duration-300",
                  isActive
                    ? "text-brand-950"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {isActive && (
                  <span
                    data-tab-pill
                    data-flip-id="tab-pill"
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-full bg-brand-50"
                  >
                    <span
                      data-tab-progress
                      className="absolute inset-x-4 bottom-1 h-[2px] origin-left scale-x-0 rounded-full bg-brand-950/20 motion-reduce:hidden"
                    />
                  </span>
                )}
                {tab.label}
              </button>
            );
          })}
          {/* Pauses and resumes the auto-advance. Hidden with reduced motion,
              where the tabs never advance on their own. */}
          <button
            type="button"
            aria-label={
              paused
                ? "Resume cycling through tabs"
                : "Pause cycling through tabs"
            }
            onClick={togglePaused}
            className="relative flex size-10 items-center justify-center rounded-full bg-white text-brand-950 shadow-[0_0_12px_rgb(0_0_0/0.04)] transition-transform active:scale-90 motion-reduce:hidden"
          >
            {paused && (
              <span
                aria-hidden
                className="absolute inset-0 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-brand-200/70"
              />
            )}
            {paused ? (
              <CirclePlay className="relative size-5" strokeWidth={2.25} />
            ) : (
              <CirclePause className="relative size-5" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile shows a zoomed crop of the dashboard so it stays readable. */}
      <div
        data-intro="dashboard"
        data-hero-dashboard
        className="mt-[16px] w-full max-w-[1208px] overflow-hidden rounded-[12px] lg:mt-[28px] lg:overflow-visible lg:rounded-none"
      >
        <div
          data-hero-tilt
          id="product-panel"
          role="tabpanel"
          aria-labelledby={`product-tab-${active}`}
          className="grid w-[170%] will-change-transform lg:w-full"
        >
          {PRODUCT_TABS.map((tab, index) => (
            <Image
              key={tab.label}
              data-screen={index}
              src={tab.screen}
              alt={`Rise Classroom ${tab.label.toLowerCase()} dashboard`}
              aria-hidden={index !== active}
              width={1208}
              height={861}
              unoptimized
              fetchPriority={index === 0 ? "high" : undefined}
              className={cn(
                "col-start-1 row-start-1 h-auto w-full",
                index === active
                  ? "z-10 opacity-100"
                  : // Fade the old screen only after the new one has wiped in.
                    "opacity-0 transition-opacity delay-500 duration-300"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
