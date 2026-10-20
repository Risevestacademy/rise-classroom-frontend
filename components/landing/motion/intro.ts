"use client";

import { EASE_OUT, gsap, SplitText } from "./gsap";

/**
 * How long after navigation the hero intro may still start. The CSS reveals
 * the hero on its own at this point, so on a slow connection the page shows
 * straight away instead of waiting on JavaScript, and the intro is skipped.
 */
const INTRO_BUDGET_MS = 1200;

/** Load sequence: nav, headline lines, subtext, CTAs, tabs, then the dashboard. */
export function heroIntro() {
  gsap.set("[data-intro]", { visibility: "visible" });
  if (performance.now() > INTRO_BUDGET_MS) return;

  const tl = gsap.timeline({ defaults: { ease: EASE_OUT, duration: 1.2 } });

  tl.from("[data-intro='nav']", { yPercent: -100, opacity: 0, duration: 1 }, 0);

  const title = document.querySelector<HTMLElement>("[data-intro='title']");
  if (title) {
    SplitText.create(title, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      // Returning the tween lets SplitText re-split after fonts load or on
      // resize without restarting the animation.
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.3,
          ease: EASE_OUT,
          stagger: 0.12,
          delay: 0.1,
        }),
    });
  }

  tl.from("[data-intro='sub']", { y: 24, opacity: 0 }, 0.5)
    .from(
      "[data-intro='ctas'] > *",
      { y: 24, scale: 0.96, opacity: 0, stagger: 0.08 },
      0.6
    )
    .from("[data-intro='tabs']", { y: 24, opacity: 0 }, 0.75)
    .from(
      "[data-intro='dashboard']",
      {
        // A shorter rise on small screens, where 120px is most of the view.
        y: () => (window.innerWidth < 1024 ? 60 : 120),
        opacity: 0,
        duration: 1.6,
      },
      0.8
    );
}

/** The dashboard starts bent back and straightens as you scroll (Didasko's values). */
export function heroDashboardTilt() {
  gsap.fromTo(
    "[data-hero-tilt]",
    { transformPerspective: 1200, rotateX: 25, scale: 0.9 },
    {
      rotateX: 0,
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "[data-hero-tilt]",
        start: 0,
        end: "top 20%",
        scrub: true,
      },
    }
  );
}
