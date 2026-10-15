"use client";

import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(
  useGSAP,
  DrawSVGPlugin,
  Flip,
  ScrambleTextPlugin,
  ScrollTrigger,
  SplitText
);

/** Shared motion tokens so every section moves with the same feel. */
export const EASE_OUT = "expo.out";
export const EASE_IN_OUT = "power3.inOut";

/** Breakpoint conditions used with gsap.matchMedia across the landing page. */
export const MEDIA = {
  desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  /** A real mouse, for hover-only effects. */
  finePointer:
    "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;

export { Flip, gsap, ScrollTrigger, SplitText, useGSAP };
