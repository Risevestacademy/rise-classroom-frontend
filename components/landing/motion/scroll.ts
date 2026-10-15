"use client";

import { EASE_OUT, gsap, ScrollTrigger, SplitText } from "./gsap";

const all = <T extends Element = HTMLElement>(
  selector: string,
  scope?: Element
) => gsap.utils.toArray<T>(selector, scope);

const one = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector);

const STROKES = "[data-stroke] path";

/** Slowly draws in any hand-drawn strokes inside `scope`, if it has some. */
function drawStrokes(tl: gsap.core.Timeline, scope: Element, position: number) {
  const paths = scope.querySelectorAll(STROKES);
  if (paths.length) {
    tl.fromTo(
      paths,
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: 2.4, ease: "power1.inOut" },
      position
    );
  }
  return tl;
}

/** Hides the nav while scrolling down and brings it back when scrolling up. */
export function navAutoHide() {
  const header = one("[data-landing-nav]");
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
  const header = one("[data-landing-nav]");
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
 * One background for the whole page that blends to each section's colour as
 * it takes over the viewport, instead of hard edges between sections.
 * Sections marked data-bg-keep hold on to their own background.
 */
export function backgroundMorph() {
  const main = one("[data-landing-main]");
  if (!main) return;
  const sections = all("[data-bg]", main);
  if (!sections.length) return;

  gsap.set(
    sections.filter((section) => !section.hasAttribute("data-bg-keep")),
    { backgroundColor: "transparent" }
  );
  gsap.set(main, { backgroundColor: sections[0].dataset.bg });

  sections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => {
        if (!self.isActive) return;
        gsap.to(main, {
          backgroundColor: section.dataset.bg,
          duration: 0.9,
          ease: "power2.out",
          overwrite: "auto",
        });
      },
    });
  });
}

/**
 * Scroll reveals driven by data attributes:
 * - data-reveal="lines" | "words": masked rise, then any hand-drawn stroke draws in
 * - data-reveal="chars": letters flip up one by one
 * - data-reveal="fill": words brighten in step with the scroll
 * - data-reveal="scramble": text decodes from random letters
 * - data-reveal="up": fade and rise
 * (data-reveal-group is handled by revealGroups.)
 */
export function scrollReveals() {
  all("[data-reveal='lines'], [data-reveal='words']").forEach((el) => {
    const type = el.dataset.reveal as "lines" | "words";
    SplitText.create(el, {
      type,
      mask: type,
      linesClass: "split-line",
      wordsClass: "split-word",
      // Keep circled words whole so the stroke stays with them on any line.
      ignore: "[data-hand-drawn]",
      autoSplit: true,
      onSplit: (self) =>
        drawStrokes(
          gsap
            .timeline({
              scrollTrigger: { trigger: el, start: "top 85%", once: true },
            })
            .from(self[type], {
              yPercent: 110,
              duration: 1.2,
              ease: EASE_OUT,
              stagger: type === "lines" ? 0.12 : 0.05,
            }),
          el,
          0.9
        ),
    });
  });

  all("[data-reveal='chars']").forEach((el) => {
    gsap.set(el, { perspective: 600 });
    SplitText.create(el, {
      type: "words,chars",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.chars, {
          rotateX: -90,
          yPercent: 40,
          opacity: 0,
          transformOrigin: "50% 100%",
          duration: 1,
          ease: EASE_OUT,
          stagger: 0.025,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }),
    });
  });

  all("[data-reveal='fill']").forEach((el) => {
    SplitText.create(el, {
      type: "words",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.words, {
          opacity: 0.15,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 45%",
            scrub: true,
          },
        }),
    });
  });

  all("[data-reveal='scramble']").forEach((el) => {
    gsap
      .timeline({
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      })
      .from(el, { opacity: 0, duration: 0.3 })
      .to(
        el,
        {
          duration: 1.4,
          scrambleText: {
            text: el.textContent ?? "",
            chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            revealDelay: 0.3,
            speed: 0.5,
          },
        },
        0
      );
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
}

/**
 * Staggered fade-and-rise for data-reveal-group / data-reveal-item. On mobile
 * the items stack far apart, so each one gets its own trigger instead of the
 * whole group firing at once (which would finish the lower items off-screen).
 */
export function revealGroups({ perItem }: { perItem: boolean }) {
  all("[data-reveal-group]").forEach((group) => {
    const items = all("[data-reveal-item]", group);
    if (perItem) {
      items.forEach((item) =>
        gsap.from(item, {
          y: 32,
          opacity: 0,
          duration: 0.9,
          ease: EASE_OUT,
          scrollTrigger: { trigger: item, start: "top 90%", once: true },
        })
      );
      return;
    }
    gsap.from(items, {
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
 * Endless keyword strip. Scrolling speeds it up in the scroll direction, then
 * it eases back to its idle drift.
 */
export function keywordMarquee() {
  const track = one("[data-marquee-track]");
  if (!track) return;

  const loop = gsap
    .timeline({ repeat: -1 })
    .to(track, { xPercent: -50, duration: 40, ease: "none" }, 0)
    .to(
      all("[data-marquee-icon]", track),
      { rotate: 360 * 4, duration: 40, ease: "none" },
      0
    );
  // Start deep into the loop so it can run backwards without hitting zero.
  loop.totalTime(loop.duration() * 1000);

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 8);
      loop.timeScale(self.direction * boost);
      gsap.to(loop, {
        timeScale: self.direction,
        duration: 1.2,
        ease: "power3.out",
        overwrite: true,
      });
    },
  });
}

/**
 * Value prop cards start stacked in the middle and spread into their row as
 * the section scrolls in ("works together"). Mobile gets a simple stagger.
 */
export function valueCards({ spread }: { spread: boolean }) {
  const grid = one("[data-value-grid]");
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
    // Stacked on mobile: each card, and then its icon, reveals as it arrives.
    cards.forEach((card) => {
      gsap
        .timeline({
          scrollTrigger: { trigger: card, start: "top 88%", once: true },
        })
        .from(card, { y: 32, opacity: 0, duration: 0.9, ease: EASE_OUT })
        .from(
          card.querySelector("[data-value-icon]"),
          { scale: 0, rotate: -30, duration: 0.8, ease: "back.out(2)" },
          0.3
        );
    });
    return;
  }

  gsap.from(icons, {
    scale: 0,
    rotate: -30,
    duration: 0.9,
    ease: "back.out(2)",
    stagger: 0.1,
    scrollTrigger: {
      trigger: grid,
      start: "top 40%",
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
  const section = one("[data-testimonials]");
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

/**
 * Pricing cards are unclipped from the bottom as they rise. On mobile they
 * stack, so each card triggers on its own.
 */
export function pricingCards({ perItem }: { perItem: boolean }) {
  const cards = all("[data-pricing-card]");
  if (!cards.length) return;

  const groups = perItem ? cards.map((card) => [card]) : [cards];
  groups.forEach((group) =>
    gsap.fromTo(
      group,
      { y: 80, clipPath: "inset(100% 0% 0% 0% round 16px)" },
      {
        y: 0,
        clipPath: "inset(0% 0% 0% 0% round 16px)",
        duration: 1.3,
        ease: EASE_OUT,
        stagger: 0.12,
        // Drop the clip afterwards so it doesn't cut off the card shadow.
        clearProps: "clipPath",
        scrollTrigger: { trigger: group[0], start: "top 85%", once: true },
      }
    )
  );
}

/** The footer wordmark rises and unclips as the page lifts off the footer. */
export function footerReveal() {
  const main = one("[data-landing-main]");
  const wordmark = one("[data-footer-wordmark]");
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
