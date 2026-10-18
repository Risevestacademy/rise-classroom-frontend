"use client";

import {
  EASE_OUT,
  gsap,
  MEDIA,
  SplitText,
  useGSAP,
} from "@/components/landing/motion/gsap";
import { magneticButtons } from "@/components/landing/motion/interactions";

/**
 * Motion for the 404 page: the squares pop in around the text, then drift,
 * blink and follow the cursor at different depths. The page itself stays a
 * server component and only carries data attributes.
 */
export function NotFoundMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(MEDIA.motion, () => {
      gsap.set("[data-intro]", { visibility: "visible" });

      const squares = gsap.utils.toArray<HTMLElement>("[data-nf-square]");
      const code = document.querySelector<HTMLElement>("[data-nf-code]");

      const tl = gsap.timeline({ defaults: { ease: EASE_OUT, duration: 1.2 } });

      if (code) {
        SplitText.create(code, {
          type: "chars",
          mask: "chars",
          onSplit: (self) =>
            tl.from(
              self.chars,
              { yPercent: 110, rotate: 12, duration: 1.3, stagger: 0.08 },
              0,
            ),
        });
      }

      tl.from("[data-nf='title']", { y: 24, opacity: 0 }, 0.35)
        .from("[data-nf='sub']", { y: 24, opacity: 0 }, 0.45)
        .from("[data-nf='cta']", { y: 24, scale: 0.96, opacity: 0 }, 0.55)
        .from(
          squares,
          {
            scale: 0,
            rotate: -90,
            duration: 0.8,
            ease: "back.out(2)",
            stagger: { each: 0.025, from: "random" },
          },
          0.2,
        );

      // A slow, uneven drift so the pattern never looks frozen.
      squares.forEach((square) => {
        gsap.to(square, {
          yPercent: gsap.utils.random(-40, 40),
          duration: gsap.utils.random(2.5, 4.5),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: gsap.utils.random(1, 2),
        });
      });

      // Every so often a square lights up in the colour of the "404".
      const accent = code ? getComputedStyle(code).color : undefined;
      if (accent && squares.length) {
        gsap.to(
          {},
          {
            duration: 0.9,
            repeat: -1,
            delay: 1.6,
            onRepeat: () =>
              gsap.to(gsap.utils.random(squares), {
                backgroundColor: accent,
                duration: 0.25,
                repeat: 1,
                yoyo: true,
                repeatDelay: 0.4,
                ease: "power2.inOut",
              }),
          },
        );
      }
    });

    mm.add(MEDIA.finePointer, () => {
      const squares = gsap.utils.toArray<HTMLElement>("[data-nf-square]");
      const movers = squares.map((square) => ({
        depth: gsap.utils.random(10, 40),
        x: gsap.quickTo(square, "x", { duration: 1.2, ease: "power3.out" }),
        y: gsap.quickTo(square, "y", { duration: 1.2, ease: "power3.out" }),
      }));

      const onMove = (event: PointerEvent) => {
        const px = event.clientX / window.innerWidth - 0.5;
        const py = event.clientY / window.innerHeight - 0.5;
        movers.forEach(({ depth, x, y }) => {
          x(-px * depth);
          y(-py * depth);
        });
      };
      window.addEventListener("pointermove", onMove);
      const cleanupMagnetic = magneticButtons();

      return () => {
        window.removeEventListener("pointermove", onMove);
        cleanupMagnetic();
      };
    });
  });

  return null;
}
