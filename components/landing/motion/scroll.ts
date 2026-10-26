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

/**
 * Hides the nav while scrolling down and brings it back when scrolling up
 * (unless `followScroll` is off). It always stays out of the way while the
 * product tabs are stuck to the top, and once the footer is showing.
 */
export function navAutoHide({ followScroll = true } = {}) {
  const header = one("[data-landing-nav]");
  if (!header) return;

  let scrollingDown = false;
  let tabsStuck = false;
  let footerShowing = false;
  let hidden = false;

  const update = () => {
    const shouldHide = scrollingDown || tabsStuck || footerShowing;
    if (shouldHide === hidden) return;
    hidden = shouldHide;
    gsap.to(header, {
      yPercent: hidden ? -100 : 0,
      duration: followScroll ? 0.6 : 0,
      ease: EASE_OUT,
      overwrite: "auto",
    });
  };

  if (followScroll) {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        scrollingDown = self.direction === 1 && self.scroll() > 400;
        update();
      },
    });
  }

  // The tab bar is sticky, so measure from the dashboard below it instead:
  // the bar sticks about when the dashboard top passes 100px.
  const tabs = one("[data-hero-tabs]");
  const dashboard = one("[data-hero-dashboard]");
  if (tabs && dashboard) {
    ScrollTrigger.create({
      trigger: dashboard,
      start: "top 100px",
      end: "bottom 100px",
      onToggle: (self) => {
        tabsStuck = self.isActive;
        tabs.dataset.stuck = String(self.isActive);
        update();
      },
    });
  }

  const main = one("[data-landing-main]");
  if (main) {
    ScrollTrigger.create({
      trigger: main,
      start: "bottom 90%",
      end: "max",
      onToggle: (self) => {
        footerShowing = self.isActive;
        update();
      },
    });
  }
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
 * Value prop cards on smaller screens: each card, and then its icon, reveals
 * as it arrives. Desktop deals them in one at a time with valueDeal instead.
 */
export function valueCards() {
  const grid = one("[data-value-grid]");
  if (!grid) return;

  all("[data-value-card]", grid).forEach((card) => {
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
}

/**
 * "Works together", desktop: the cards are dealt in one after the other. Each
 * rises from a deck below the middle of the row, tilted, and fans out into its
 * own column; its icon pops as it lands. The first is dealt as the row scrolls
 * in, then the section holds still while the other two follow.
 */
export function valueDeal() {
  const section = one("[data-value-section]");
  const grid = one("[data-value-grid]");
  if (!section || !grid) return;
  const cards = all("[data-value-card]", grid);
  if (cards.length !== 3) return;
  const [first, middle, last] = cards;

  // Hold once the whole row is on screen: the row just clear of the bottom
  // (not the section's padding, so more of the heading stays in view on
  // short screens), or the section's centre on the centre when it fits.
  const holdAt = () => {
    if (section.offsetHeight <= window.innerHeight) return "center center";
    const below = section.getBoundingClientRect().bottom -
      grid.getBoundingClientRect().bottom;
    return `bottom-=${Math.max(0, below - 24)} bottom`;
  };

  const deal = (
    tl: gsap.core.Timeline,
    card: HTMLElement,
    tilt: number,
    at: number
  ) =>
    tl
      .fromTo(
        card,
        {
          x: () => middle.offsetLeft - card.offsetLeft,
          y: () => window.innerHeight * 0.85,
          rotate: tilt,
          autoAlpha: 0,
        },
        {
          x: 0,
          y: 0,
          rotate: 0,
          autoAlpha: 1,
          duration: 1,
          ease: "power3.out",
        },
        at
      )
      .from(
        card.querySelector("[data-value-icon]"),
        { scale: 0, rotate: -30, duration: 0.45, ease: "back.out(2)" },
        at + 0.7
      );

  deal(
    gsap.timeline({
      scrollTrigger: {
        trigger: grid,
        start: "top bottom",
        endTrigger: section,
        end: holdAt,
        // The row sits inside the section that pins next; measure it as such.
        pinnedContainer: section,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    }),
    first,
    -9,
    0
  );

  const held = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: holdAt,
      end: () => `+=${window.innerHeight * 1.4}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      // The pin adds scroll space, so it must be measured before the
      // triggers further down the page (created earlier) are.
      refreshPriority: 1,
    },
  });
  deal(held, middle, 4, 0);
  deal(held, last, 9, 1.1);
  // A beat with all three in place before the page moves on.
  held.to({}, { duration: 0.6 });
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

/**
 * The solution cards are sticky (see SolutionSection); as each next card
 * slides up over one, that card shrinks back and dims into the stack.
 */
export function solutionStack() {
  const cards = all("[data-solution-card]");
  cards.slice(0, -1).forEach((card, i) => {
    const next = cards[i + 1];
    gsap.fromTo(
      card,
      { filter: "brightness(1)" },
      {
        scale: 0.92,
        filter: "brightness(0.88)",
        ease: "none",
        scrollTrigger: {
          trigger: next,
          start: "top bottom",
          // Done once the next card reaches its own sticky position.
          end: () => `top ${parseFloat(getComputedStyle(next).top)}px`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
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

/**
 * The footer wordmark rises and unclips as the page lifts off the footer,
 * while its dot layers drift past each other.
 */
export function footerReveal() {
  const main = one("[data-landing-main]");
  const wordmark = one("[data-footer-wordmark]");
  if (!main || !wordmark) return;

  gsap.fromTo(
    wordmark,
    { yPercent: 30, clipPath: "inset(100% 0% 0% 0%)", "--dots-shift": -1 },
    {
      yPercent: 0,
      clipPath: "inset(0% 0% 0% 0%)",
      "--dots-shift": 0,
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
