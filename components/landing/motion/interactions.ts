"use client";

import { gsap } from "./gsap";

const all = <T extends Element = HTMLElement>(
  selector: string,
  scope?: Element
) => gsap.utils.toArray<T>(selector, scope);

type Cleanup = () => void;

/** Adds pointer listeners and returns one function that removes them all. */
function listen(
  entries: [Element | Document, string, EventListener][]
): Cleanup {
  entries.forEach(([target, type, fn]) => target.addEventListener(type, fn));
  return () =>
    entries.forEach(([target, type, fn]) =>
      target.removeEventListener(type, fn)
    );
}

const combine =
  (cleanups: Cleanup[]): Cleanup =>
  () =>
    cleanups.forEach((cleanup) => cleanup());

/** Cards tilt slightly towards the cursor. */
export function hoverTilt(): Cleanup {
  return combine(
    all("[data-tilt]").map((card) => {
      gsap.set(card, { transformPerspective: 800 });
      const rotateX = gsap.quickTo(card, "rotationX", {
        duration: 0.6,
        ease: "power3.out",
      });
      const rotateY = gsap.quickTo(card, "rotationY", {
        duration: 0.6,
        ease: "power3.out",
      });
      const max = 4;

      return listen([
        [
          card,
          "pointermove",
          ((event: PointerEvent) => {
            const rect = card.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width - 0.5;
            const py = (event.clientY - rect.top) / rect.height - 0.5;
            rotateY(px * max * 2);
            rotateX(-py * max * 2);
          }) as EventListener,
        ],
        [
          card,
          "pointerleave",
          () => {
            rotateX(0);
            rotateY(0);
          },
        ],
      ]);
    })
  );
}

/** Buttons are pulled slightly towards the cursor. */
export function magneticButtons(): Cleanup {
  return combine(
    all("[data-magnetic]").map((button) => {
      const x = gsap.quickTo(button, "x", {
        duration: 0.5,
        ease: "power3.out",
      });
      const y = gsap.quickTo(button, "y", {
        duration: 0.5,
        ease: "power3.out",
      });
      const strength = 0.3;

      return listen([
        [
          button,
          "pointermove",
          ((event: PointerEvent) => {
            const rect = button.getBoundingClientRect();
            x((event.clientX - rect.left - rect.width / 2) * strength);
            y((event.clientY - rect.top - rect.height / 2) * strength);
          }) as EventListener,
        ],
        [
          button,
          "pointerleave",
          () => {
            gsap.to(button, {
              x: 0,
              y: 0,
              duration: 0.9,
              ease: "elastic.out(1, 0.4)",
            });
          },
        ],
      ]);
    })
  );
}
