"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { CirclePlay } from "lucide-react";

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
  { label: "Analytics", screen: "/landing/dashboard-mockup.png" },
  { label: "Learning", screen: "/landing/dashboard-mockup.png" },
  { label: "Community", screen: "/landing/dashboard-mockup.png" },
  { label: "Chat", screen: "/landing/dashboard-mockup.png" },
  { label: "Calender", screen: "/landing/dashboard-mockup.png" },
];
const INITIAL_TAB = 1;
const AUTO_ADVANCE_SECONDS = 5;

/** Product tabs and the dashboard screenshot they switch between. */
export function HeroShowcase() {
  const root = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pillState = useRef<Flip.FlipState | null>(null);
  const progress = useRef<gsap.core.Tween | null>(null);
  const hovered = useRef(false);
  const [active, setActive] = useState(INITIAL_TAB);

  const select = (index: number) => {
    if (index === active) return;
    // Capture where the pill is before React moves it to the new tab.
    pillState.current = Flip.getState("[data-tab-pill]");
    setActive(index);
  };

  useGSAP(
    () => {
      const state = pillState.current;
      pillState.current = null;
      if (!window.matchMedia(MEDIA.motion).matches) return;

      if (state) {
        Flip.from(state, {
          targets: "[data-tab-pill]",
          duration: 0.6,
          ease: EASE_OUT,
          scale: false,
        });
      }

      progress.current = gsap.fromTo(
        "[data-tab-progress]",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: AUTO_ADVANCE_SECONDS,
          ease: "none",
          onComplete: () => select((active + 1) % PRODUCT_TABS.length),
        }
      );
      if (hovered.current) progress.current.pause();
    },
    { scope: root, dependencies: [active], revertOnUpdate: true }
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (active + step + PRODUCT_TABS.length) % PRODUCT_TABS.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      ref={root}
      className="flex w-full flex-col items-center"
      onPointerEnter={() => {
        hovered.current = true;
        progress.current?.pause();
      }}
      onPointerLeave={() => {
        hovered.current = false;
        progress.current?.resume();
      }}
    >
      <div
        data-intro="tabs"
        role="tablist"
        aria-label="Product areas"
        onKeyDown={onKeyDown}
        className="mt-[45px] flex h-[50px] items-center gap-2 rounded-full border border-neutral-300 bg-white p-1 shadow-[inset_0_2px_8px_rgb(0_0_0/0.04)]"
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
        <button
          type="button"
          aria-label="Play product tour"
          className="relative flex size-10 items-center justify-center rounded-full bg-white text-brand-950 shadow-[0_0_12px_rgb(0_0_0/0.04)]"
        >
          <span
            aria-hidden
            className="absolute inset-0 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-brand-200/70 motion-reduce:hidden"
          />
          <CirclePlay className="relative size-5" strokeWidth={2.25} />
        </button>
      </div>

      <div data-intro="dashboard" className="mt-[28px] w-full max-w-[1208px]">
        <div
          data-hero-tilt
          id="product-panel"
          role="tabpanel"
          aria-labelledby={`product-tab-${active}`}
          className="grid will-change-transform"
        >
          {PRODUCT_TABS.map((tab, index) => (
            <Image
              key={tab.label}
              src={tab.screen}
              alt={
                index === active
                  ? `Rise Classroom ${tab.label.toLowerCase()} dashboard`
                  : ""
              }
              aria-hidden={index !== active}
              width={1208}
              height={861}
              unoptimized
              fetchPriority={index === INITIAL_TAB ? "high" : undefined}
              className={cn(
                "col-start-1 row-start-1 h-auto w-full transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                index === active ? "opacity-100" : "scale-[0.98] opacity-0"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
