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
  testimonialsExpand,
  valueCards,
} from "./scroll";

/**
 * Wires up smooth scrolling and every landing page animation. Sections only
 * carry data attributes; all motion lives here so the sections can stay
 * server components.
 */
export function LandingMotion() {
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

  useGSAP(() => {
    navScrolledState();

    const mm = gsap.matchMedia();

    mm.add(MEDIA.motion, () => {
      heroIntro();
      navAutoHide();
      backgroundMorph();
      scrollReveals();
      keywordMarquee();
      solutionCards();
      footerReveal();
    });

    mm.add(MEDIA.desktop, () => {
      heroDashboardTilt();
      valueCards({ spread: true });
      revealGroups({ perItem: false });
      pricingCards({ perItem: false });
      testimonialsExpand();
    });

    mm.add(MEDIA.mobile, () => {
      valueCards({ spread: false });
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
