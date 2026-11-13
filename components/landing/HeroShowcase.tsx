"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { CirclePause, CirclePlay } from "lucide-react";

import {
  EASE_OUT,
  Flip,
  gsap,
  MEDIA,
  useGSAP,
} from "@/components/landing/motion/gsap";
import {
  createRollRenderer,
  ROLL_OVERFLOW,
  type RollRenderer,
} from "@/components/landing/rollTransition";
import { cn } from "@/lib/utils";

// TODO: swap in the per-tab dashboard screenshots once they're exported from
// Figma. Every tab shows the curriculum dashboard until then.
const PRODUCT_TABS = [
  { label: "Analytics", screen: "/landing/analytics-mockup.webp" },
  { label: "Learning", screen: "/landing/dashboard-mockup.webp" },
  { label: "Calendar", screen: "/landing/calendar-mockup.webp" },
];
const TAB_COUNT = PRODUCT_TABS.length;
/** The design opens on Learning. */
const FIRST_TAB = 1;
/** How long each tab stays up before advancing to the next. */
const AUTO_ADVANCE_SECONDS = 5;
const PANEL_RADIUS = 12;

/**
 * Product tabs and the dashboard they switch between. The tabs advance on a
 * timer (paused while the tab bar is hovered), and clicking a tab jumps straight to it.
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
  const [active, setActive] = useState(FIRST_TAB);
  const rollCanvas = useRef<HTMLCanvasElement>(null);
  const roll = useRef<RollRenderer | null>(null);
  // The screen being replaced by the current change.
  const previousTab = useRef(FIRST_TAB);

  useEffect(() => {
    if (rollCanvas.current)
      roll.current = createRollRenderer(rollCanvas.current);
    return () => {
      roll.current?.dispose();
      roll.current = null;
    };
  }, []);

  // Every tab change goes through select(), which keeps this in sync.
  const activeRef = useRef(FIRST_TAB);

  const select = (index: number) => {
    if (index === activeRef.current) return;
    // Capture where the pill is before React moves it to the new tab.
    pillState.current = Flip.getState("[data-tab-pill]");
    previousTab.current = activeRef.current;
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

      const screens = gsap.utils.toArray<HTMLImageElement>("[data-screen]");
      const from = screens[previousTab.current];
      const to = screens[active];
      const canvas = rollCanvas.current;
      const renderer = roll.current;
      const canRoll =
        renderer && canvas && from?.naturalWidth && to?.naturalWidth;

      if (!isFirstRun && canRoll) {
        canvas.style.visibility = "visible";
        renderer.resize(PANEL_RADIUS);
        const tween = { progress: 0 };
        renderer.draw(from, to, 0);
        gsap.to(tween, {
          progress: 1,
          duration: 1.1,
          ease: "power2.inOut",
          onUpdate: () => renderer.draw(from, to, tween.progress),
          onComplete: () => {
            canvas.style.visibility = "hidden";
          },
        });
      } else if (!isFirstRun) {
        gsap.fromTo(
          `[data-screen="${active}"]`,
          { clipPath: "inset(0% 0% 100% 0%)", scale: 1.04 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            duration: 0.9,
            ease: EASE_OUT,
          },
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
        },
      );
      if (hovered.current || pausedRef.current) timer.current.pause();

      return () => {
        if (canvas) canvas.style.visibility = "hidden";
      };
    },
    { scope: root, dependencies: [active], revertOnUpdate: true },
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
    <div ref={root} className="flex w-full flex-col items-center">
      {/* Sticks to the top while the dashboard is on screen (the nav hides to
          make room), so tabs can be switched without scrolling back up. On
          narrow screens the bar scrolls sideways, edge to edge. */}
      <div
        ref={tabScroller}
        // Only the tab bar pauses the timer: the dashboard fills most of the
        // screen, so pausing over it made the tabs look stuck.
        onPointerEnter={() => {
          hovered.current = true;
          timer.current?.pause();
        }}
        onPointerLeave={() => {
          hovered.current = false;
          if (!pausedRef.current) timer.current?.resume();
        }}
        data-intro="tabs"
        data-hero-tabs
        className="group/tabs sticky top-3 z-20 -mx-4 mt-[33px] w-[calc(100%+2rem)] overflow-x-auto px-4 py-3 [scrollbar-width:none] lg:top-4 lg:mx-0 lg:mt-[74px] lg:w-auto lg:overflow-visible lg:px-0 lg:py-0 [&::-webkit-scrollbar]:hidden"
      >
        <div
          role="tablist"
          aria-label="Product areas"
          onKeyDown={onKeyDown}
          className="mx-auto flex h-[50px] w-max items-center gap-2 rounded-full border border-border-strong bg-white p-1 transition-shadow duration-500 group-data-[stuck=true]/tabs:shadow-[0_12px_32px_rgb(16_22_79/0.16)]"
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
                    : "text-text-secondary hover:text-text-primary",
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

      <div
        data-intro="dashboard"
        data-hero-dashboard
        className="mt-[16px] w-full max-w-[800px] overflow-hidden rounded-[12px] lg:mt-6 lg:overflow-visible"
      >
        <div
          data-hero-tilt
          id="product-panel"
          role="tabpanel"
          aria-labelledby={`product-tab-${active}`}
          className="relative w-full will-change-transform"
        >
          <div className="grid w-full lg:overflow-hidden lg:rounded-[12px]">
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
                fetchPriority={index === FIRST_TAB ? "high" : undefined}
                className={cn(
                  "col-start-1 row-start-1 h-auto w-full",
                  index === active
                    ? "z-10 opacity-100"
                    : // Fade the old screen only after the new one has wiped in.
                      "opacity-0 transition-opacity delay-500 duration-300",
                )}
              />
            ))}
          </div>
          {/* Draws the rolling hand-off between screens; taller than the panel
              so the edge can bulge past it. */}
          <canvas
            ref={rollCanvas}
            aria-hidden
            className="pointer-events-none invisible absolute inset-x-0 z-20 w-full"
            style={{
              top: `${-ROLL_OVERFLOW * 100}%`,
              height: `${(1 + 2 * ROLL_OVERFLOW) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
