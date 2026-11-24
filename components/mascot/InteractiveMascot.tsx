"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Mascot, type MascotMood, type MascotProps } from "./Mascot";

type InteractiveMascotProps = MascotProps & {
  /** Face shown briefly after a tap. */
  reaction?: MascotMood;
  onPoke?: () => void;
};

type Look = { x: number; y: number } | undefined;

const REACTION_MS = 1200;
/** Eyes follow only while the pointer is within this many mascot-widths. */
const NEAR_RADIUS = 1.5;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const round = (v: number) => Math.round(v * 10) / 10;
const sameLook = (a: Look, b: Look) =>
  a === b || (!!a && !!b && a.x === b.x && a.y === b.y);

/**
 * Eyes follow the pointer (or finger while it's down) when it comes near;
 * a tap or click squishes the mascot and shows a short reaction before
 * returning to `mood`. Pointer work is limited to one update per frame and
 * stops, along with the looping animations, while the mascot is off screen
 * or the tab is hidden.
 */
export function InteractiveMascot({
  mood = "happy",
  reaction = "celebrate",
  onPoke,
  className,
  label = "Rise Classroom mascot. Tap to say hi.",
  paused,
  ...props
}: InteractiveMascotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const frame = useRef(0);
  const pointer = useRef<{ x: number; y: number }>(undefined);
  const [look, setLook] = useState<Look>();
  const [pokeKey, setPokeKey] = useState(0);
  const [reacting, setReacting] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const active = onScreen && tabVisible;

  const update = useCallback((next: Look) => {
    setLook((prev) => (sameLook(prev, next) ? prev : next));
  }, []);

  const lookAt = useCallback(
    (clientX: number, clientY: number) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const dx = clientX - (box.left + box.width / 2);
      const dy = clientY - (box.top + box.height * 0.45);
      const radius = box.width * NEAR_RADIUS;
      if (Math.hypot(dx, dy) > radius) {
        update(undefined);
        return;
      }
      update({
        x: round(clamp(dx / (radius / 2))),
        y: round(clamp(dy / (radius / 2))),
      });
    },
    [update],
  );

  // Pause when scrolled away or the tab is in the background.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    );
    observer.observe(el);
    const onVisibility = () =>
      setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.buttons === 0) return;
      pointer.current = { x: e.clientX, y: e.clientY };
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (pointer.current) lookAt(pointer.current.x, pointer.current.y);
      });
    };
    const reset = () => update(undefined);
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") setTimeout(reset, 800);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, [active, lookAt, update]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const poke = () => {
    setPokeKey((k) => k + 1);
    setReacting(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReacting(false), REACTION_MS);
    onPoke?.();
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerDown={(e) => {
        lookAt(e.clientX, e.clientY);
        poke();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          poke();
        }
      }}
      className={cn(
        "inline-block cursor-pointer touch-manipulation rounded-2xl outline-none select-none focus-visible:ring-2 focus-visible:ring-border-focus",
        className,
      )}
    >
      <Mascot
        {...props}
        label={label}
        mood={reacting ? reaction : mood}
        look={reacting ? undefined : look}
        pokeKey={pokeKey}
        paused={paused ?? !active}
      />
    </div>
  );
}
