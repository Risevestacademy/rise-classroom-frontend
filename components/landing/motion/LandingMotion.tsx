"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

import {
  footerReveal,
  heroDashboardTilt,
  heroIntro,
  hoverTilt,
  magneticButtons,
  navAutoHide,
  navScrolledState,
  scrollReveals,
  solutionCards,
  testimonialsExpand,
  valueCards,
} from "./animations";
import { gsap, MEDIA, ScrollTrigger, useGSAP } from "./gsap";

/** Height of the compact nav, so anchor jumps land below it. */
const NAV_OFFSET = 72;

/**
 * Wires up smooth scrolling and every landing page animation. Sections only
 * carry data attributes; all motion lives here so the sections can stay
 * server components.
 */
export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia(MEDIA.reduce).matches) return;

    const lenis = new Lenis({ anchors: { offset: -NAV_OFFSET } });
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
      scrollReveals();
      solutionCards();
      footerReveal();
    });

    mm.add(MEDIA.desktop, () => {
      heroDashboardTilt();
      valueCards({ spread: true });
      testimonialsExpand();
      const cleanupTilt = hoverTilt();
      const cleanupMagnetic = magneticButtons();
      return () => {
        cleanupTilt();
        cleanupMagnetic();
      };
    });

    mm.add(MEDIA.mobile, () => {
      valueCards({ spread: false });
    });
  });

  return null;
}
