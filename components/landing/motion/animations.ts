"use client";

import { EASE_OUT, gsap, ScrollTrigger, SplitText } from "./gsap";

const all = <T extends Element = HTMLElement>(
  selector: string,
  scope?: Element
) => gsap.utils.toArray<T>(selector, scope);

/** Lets the hero intro elements render; the CSS keeps them hidden until now. */
export function showIntroElements() {
  gsap.set("[data-intro]", { visibility: "visible" });
}

/** Load sequence: nav, headline lines, subtext, CTAs, tabs, then the dashboard. */
export function heroIntro() {
  showIntroElements();

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
      { y: 120, opacity: 0, duration: 1.6 },
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

/** Hides the nav while scrolling down and brings it back when scrolling up. */
export function navAutoHide() {
  const header = document.querySelector<HTMLElement>("[data-landing-nav]");
  if (!header) return;

  let hidden = false;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const shouldHide = self.direction === 1 && self.scroll() > 400;
      if (shouldHide === hidden) return;
      hidden = shouldHide;
      gsap.to(header, {
        yPercent: hidden ? -100 : 0,
        duration: 0.6,
        ease: EASE_OUT,
        overwrite: "auto",
      });
    },
  });
}

/** Flags the nav once the page has scrolled so CSS can compact and frost it. */
export function navScrolledState() {
  const header = document.querySelector<HTMLElement>("[data-landing-nav]");
  if (!header) return;

  ScrollTrigger.create({
    start: 80,
    end: "max",
    onToggle: (self) => {
      header.dataset.scrolled = String(self.isActive);
    },
  });
}

/**
 * Generic scroll reveals driven by data attributes:
 * - data-reveal="lines" | "words": masked SplitText rise
 * - data-reveal="up": fade and rise
 * - data-reveal-group + data-reveal-item: staggered fade and rise
 */
export function scrollReveals() {
  all("[data-reveal='lines'], [data-reveal='words']").forEach((el) => {
    const type = el.dataset.reveal as "lines" | "words";
    SplitText.create(el, {
      type,
      mask: type,
      linesClass: "split-line",
      wordsClass: "split-word",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self[type], {
          yPercent: 110,
          duration: 1.2,
          ease: EASE_OUT,
          stagger: type === "lines" ? 0.12 : 0.05,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }),
    });
  });

  all("[data-reveal='up']").forEach((el) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: EASE_OUT,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  all("[data-reveal-group]").forEach((group) => {
    gsap.from(all("[data-reveal-item]", group), {
      y: 48,
      opacity: 0,
      duration: 1,
      ease: EASE_OUT,
      stagger: 0.1,
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    });
  });
}

/**
 * Value prop cards start stacked in the middle and spread into their row as
 * the section scrolls in ("works together"). Mobile gets a simple stagger.
 */
export function valueCards({ spread }: { spread: boolean }) {
  const grid = document.querySelector<HTMLElement>("[data-value-grid]");
  if (!grid) return;
  const cards = all("[data-value-card]", grid);
  const icons = all("[data-value-icon]", grid);

  if (spread) {
    const middle = Math.floor(cards.length / 2);
    gsap.set(cards[middle], { zIndex: 2 });
    gsap.from(cards, {
      x: (_, el: HTMLElement) =>
        grid.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2),
      y: (i) => (i === middle ? 0 : 32),
      rotate: (i) => (i - middle) * 6,
      scale: (i) => (i === middle ? 1 : 0.92),
      ease: "none",
      scrollTrigger: {
        trigger: grid,
        start: "top 85%",
        end: "top 30%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  } else {
    gsap.from(cards, {
      y: 48,
      opacity: 0,
      duration: 1,
      ease: EASE_OUT,
      stagger: 0.1,
      scrollTrigger: { trigger: grid, start: "top 85%", once: true },
    });
  }

  gsap.from(icons, {
    scale: 0,
    rotate: -30,
    duration: 0.9,
    ease: "back.out(2)",
    stagger: 0.1,
    scrollTrigger: {
      trigger: grid,
      start: spread ? "top 40%" : "top 75%",
      once: true,
    },
  });
}

/** Audience cards: the photo is unclipped bottom-up, then the copy and bullets follow. */
export function solutionCards() {
  all("[data-solution-card]").forEach((card) => {
    const media = card.querySelector("[data-solution-media]");
    const tl = gsap.timeline({
      defaults: { ease: EASE_OUT },
      scrollTrigger: { trigger: card, start: "top 80%", once: true },
    });

    if (media) {
      tl.fromTo(
        media,
        { clipPath: "inset(100% 0% 0% 0% round 16px)" },
        { clipPath: "inset(0% 0% 0% 0% round 16px)", duration: 1.4 }
      ).from(media.querySelector("img"), { scale: 1.15, duration: 1.6 }, 0);
    }

    tl.from(
      all("[data-solution-text]", card),
      { y: 20, opacity: 0, duration: 0.9, stagger: 0.08 },
      0.3
    )
      .from(
        all("[data-solution-point]", card),
        { x: -12, opacity: 0, duration: 0.8, stagger: 0.07 },
        0.5
      )
      .from(
        all("[data-solution-point] svg", card),
        { rotate: -90, duration: 0.8, stagger: 0.07 },
        0.5
      );
  });
}

/** The dark testimonials panel grows from an inset rounded card to full bleed. */
export function testimonialsExpand() {
  const section = document.querySelector("[data-testimonials]");
  if (!section) return;

  gsap.fromTo(
    section,
    { clipPath: "inset(0% 4% 0% 4% round 32px)" },
    {
      clipPath: "inset(0% 0% 0% 0% round 0px)",
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "top 25%",
        scrub: true,
      },
    }
  );
}

/** The footer wordmark rises and unclips as the page lifts off the footer. */
export function footerReveal() {
  const main = document.querySelector("[data-landing-main]");
  const wordmark = document.querySelector("[data-footer-wordmark]");
  if (!main || !wordmark) return;

  gsap.fromTo(
    wordmark,
    { yPercent: 30, clipPath: "inset(100% 0% 0% 0%)" },
    {
      yPercent: 0,
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none",
      scrollTrigger: {
        trigger: main,
        start: "bottom bottom",
        end: "max",
        scrub: true,
      },
    }
  );
}

/** Cards tilt slightly towards the cursor. Returns a cleanup for the listeners. */
export function hoverTilt() {
  const cleanups = all("[data-tilt]").map((card) => {
    gsap.set(card, { transformPerspective: 800 });
    const rotateX = gsap.quickTo(card, "rotateX", {
      duration: 0.6,
      ease: "power3.out",
    });
    const rotateY = gsap.quickTo(card, "rotateY", {
      duration: 0.6,
      ease: "power3.out",
    });
    const max = 4;

    const onMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      rotateY(px * max * 2);
      rotateX(-py * max * 2);
    };
    const onLeave = () => {
      rotateX(0);
      rotateY(0);
    };

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}

/** Buttons are pulled slightly towards the cursor. Returns a cleanup for the listeners. */
export function magneticButtons() {
  const cleanups = all("[data-magnetic]").map((button) => {
    const x = gsap.quickTo(button, "x", { duration: 0.5, ease: "power3.out" });
    const y = gsap.quickTo(button, "y", { duration: 0.5, ease: "power3.out" });
    const strength = 0.3;

    const onMove = (event: PointerEvent) => {
      const rect = button.getBoundingClientRect();
      x((event.clientX - rect.left - rect.width / 2) * strength);
      y((event.clientY - rect.top - rect.height / 2) * strength);
    };
    const onLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.9,
        ease: "elastic.out(1, 0.4)",
      });
    };

    button.addEventListener("pointermove", onMove);
    button.addEventListener("pointerleave", onLeave);
    return () => {
      button.removeEventListener("pointermove", onMove);
      button.removeEventListener("pointerleave", onLeave);
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}
