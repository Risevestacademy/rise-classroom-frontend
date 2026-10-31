"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

import { gsap, MEDIA, ScrollTrigger, useGSAP } from "./gsap";
import { hoverTilt, magneticButtons } from "./interactions";
import { heroDashboardTilt, heroIntro } from "./intro";
import {
  backgroundMorph,
  footerReveal,
  keywordMarquee,
  navAutoHide,
  navScrolledState,
  pricingCards,
  revealGroups,
  scrollReveals,
  solutionCards,
  solutionStack,
  testimonialsExpand,
  valueCards,
  valueDeal,
} from "./scroll";

/**
 * Wires up smooth scrolling and every landing page animation. Sections only
 * carry data attributes; all motion lives here so the sections can stay
 * server components.
 */
/* Pages that reuse the landing nav and footer (like the privacy policy) pass
   sections={false}: they keep the smooth scrolling, nav and footer motion but
   skip the hero intro and the home page's section animations. */
export function LandingMotion({ sections = true }: { sections?: boolean }) {
  useEffect(() => {
    if (window.matchMedia(MEDIA.reduce).matches) return;

    // lerp 0.15 follows the wheel closely: smooth, but not floaty. Anchor
    // jumps respect the scroll-padding-top set in globals.css.
    const lenis = new Lenis({ lerp: 0.15, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker so scroll-linked tweens stay in sync.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  // A sticky footer taller than the screen never shows its top, so pull its
  // pinned edge down by the overflow.
  useEffect(() => {
    const footer = document.querySelector<HTMLElement>("[data-landing-footer]");
    if (!footer) return;

    const fit = () => {
      // The strip tucked under main (negative margin) doesn't need to show.
      const tucked = -parseFloat(getComputedStyle(footer).marginTop) || 0;
      const overflow = Math.min(
        0,
        window.innerHeight - (footer.offsetHeight - tucked),
      );
      footer.style.setProperty("--footer-offset", `${overflow}px`);
    };
    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(footer);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  useGSAP(() => {
    navScrolledState();

    const mm = gsap.matchMedia();

    if (!sections) {
      mm.add(MEDIA.motion, () => {
        navAutoHide();
        footerReveal();
      });
      mm.add(MEDIA.reduce, () => navAutoHide({ followScroll: false }));
      return;
    }

    mm.add(MEDIA.motion, () => {
      heroIntro();
      navAutoHide();
      backgroundMorph();
      scrollReveals();
      keywordMarquee();
      solutionCards();
      solutionStack();
      footerReveal();
    });

    // Without motion the nav still gets out of the way of the stuck tabs and
    // the footer, just instantly.
    mm.add(MEDIA.reduce, () => navAutoHide({ followScroll: false }));

    mm.add(MEDIA.desktop, () => {
      heroDashboardTilt();
      valueDeal();
      revealGroups({ perItem: false });
      pricingCards({ perItem: false });
      testimonialsExpand();
    });

    mm.add(MEDIA.mobile, () => {
      valueCards();
      revealGroups({ perItem: true });
      pricingCards({ perItem: true });
    });

    mm.add(MEDIA.finePointer, () => {
      const cleanups = [hoverTilt(), magneticButtons()];
      return () => cleanups.forEach((cleanup) => cleanup());
    });
  });

  return null;
}
