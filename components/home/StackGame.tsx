"use client";

import * as React from "react";
import { CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  GRADUATION_WEEK,
  gritLevel,
  resolveDrop,
  slideSpeed,
  type Slab,
} from "@/lib/stack-game";

/** Mirrors the tokens in app/globals.css — canvas can't read Tailwind classes. */
const INK = "#111819"; // neutral-700
const WHITE = [255, 255, 255];
const TEAL_TINT = [180, 210, 213]; // decorative tint (not a design token)
const TEAL = [13, 109, 120]; // brand-primary

type Phase = "ready" | "playing" | "over" | "won";

type Falling = Slab & {
  level: number;
  y: number;
  vy: number;
  rotation: number;
  spin: number;
};

type Burst = { x: number; level: number; bornAt: number };

const BEST_KEY = "rise-stack-best";

function readBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function mix(a: number[], b: number[], t: number) {
  return a.map((channel, i) => Math.round(channel + (b[i] - channel) * t));
}

/** The tower rises through the brand teal: white → teal tint → brand-primary. */
function fillFor(level: number) {
  const t = Math.min(level / GRADUATION_WEEK, 1);
  const [r, g, b] = t < 0.5 ? mix(WHITE, TEAL_TINT, t / 0.5) : mix(TEAL_TINT, TEAL, (t - 0.5) / 0.5);
  return { fill: `rgb(${r}, ${g}, ${b})`, dark: t > 0.62 };
}

/**
 * The hidden game: stack the 52 weeks of the program. One slab per week —
 * drop it cleanly or lose whatever hangs over the edge.
 */
export function StackGame({ onClose }: { onClose: () => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [phase, setPhase] = React.useState<Phase>("ready");
  const [weeks, setWeeks] = React.useState(0);
  const [best, setBest] = React.useState(readBest);

  // The action the canvas, the buttons and Space all trigger.
  const actRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    containerRef.current?.focus();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const fontFamily = getComputedStyle(canvas).fontFamily;

    let width = 0;
    let height = 0;
    let slabHeight = 30;
    let baseWidth = 320;
    let groundY = 0;

    let tower: Slab[] = [];
    let moving: Slab | null = null;
    let direction = 1;
    let falling: Falling[] = [];
    let bursts: Burst[] = [];
    let camera = 0;
    let state: Phase = "ready";

    function layout() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      slabHeight = Math.min(Math.max(height * 0.042, 24), 34);
      baseWidth = Math.min(width * 0.5, 320);
      groundY = height * 0.86;
    }

    function reset() {
      tower = [{ x: (width - baseWidth) / 2, width: baseWidth }];
      moving = null;
      falling = [];
      bursts = [];
      camera = 0;
    }

    function bounds(slab: Slab) {
      return { min: width / 2 - baseWidth, max: width / 2 + baseWidth - slab.width };
    }

    function spawn() {
      const level = tower.length;
      const slab = { x: 0, width: tower[tower.length - 1].width };
      const { min, max } = bounds(slab);
      // Alternate the side each week slides in from.
      const fromLeft = level % 2 === 1;
      slab.x = fromLeft ? min : max;
      direction = fromLeft ? 1 : -1;
      moving = slab;
    }

    function end(next: Phase) {
      state = next;
      moving = null;
      setPhase(next);
      const reached = tower.length - 1;
      setBest((previous) => {
        const record = Math.max(previous, reached);
        try {
          window.localStorage.setItem(BEST_KEY, String(record));
        } catch {
          // Private browsing — the record just won't outlive the tab.
        }
        return record;
      });
    }

    function drop(slab: Slab, level: number) {
      falling.push({
        ...slab,
        level,
        y: 0,
        vy: -1.5,
        rotation: 0,
        spin: (slab.x + slab.width / 2 < width / 2 ? -1 : 1) * 0.035,
      });
    }

    function act() {
      if (state !== "playing") {
        reset();
        state = "playing";
        setPhase("playing");
        setWeeks(0);
        spawn();
        return;
      }

      if (!moving) return;
      const level = tower.length;
      const result = resolveDrop(tower[tower.length - 1], moving);

      if (result.kind === "miss") {
        drop(moving, level);
        end("over");
        return;
      }

      tower.push(result.placed);
      if (result.kind === "cut") {
        drop(result.offcut, level);
      } else {
        bursts.push({ x: result.placed.x + result.placed.width, level, bornAt: performance.now() });
      }

      const reached = tower.length - 1;
      setWeeks(reached);
      if (reached >= GRADUATION_WEEK) {
        end("won");
        return;
      }
      spawn();
    }
    actRef.current = act;

    /** Screen y of the top edge of a tower level. */
    function levelY(level: number) {
      return groundY - (level + 1) * slabHeight + camera;
    }

    function drawSlab(slab: Slab, level: number, y: number) {
      const isBase = level === 0;
      const { fill, dark } = isBase ? { fill: "#FFFFFF", dark: false } : fillFor(level);
      const h = slabHeight - 4;

      ctx!.beginPath();
      ctx!.roundRect(slab.x, y, slab.width, h, 8);
      ctx!.fillStyle = fill;
      ctx!.fill();
      ctx!.lineWidth = 1.5;
      ctx!.strokeStyle = INK;
      ctx!.stroke();

      const label = isBase ? "Day one" : `Week ${level}`;
      ctx!.font = `600 ${Math.round(h * 0.42)}px ${fontFamily}`;
      if (ctx!.measureText(label).width < slab.width - 16) {
        ctx!.fillStyle = dark ? "#FFFFFF" : INK;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText(label, slab.x + slab.width / 2, y + h / 2 + 1);
      }
    }

    /** The illustrations' "\ | /" marks, for a clean drop. */
    function drawBurst(burst: Burst, now: number) {
      const age = (now - burst.bornAt) / 500;
      if (age >= 1) return;
      const x = burst.x + 6;
      const y = levelY(burst.level) - 2;
      const length = 8 + age * 6;

      ctx!.save();
      ctx!.globalAlpha = 1 - age;
      ctx!.strokeStyle = INK;
      ctx!.lineWidth = 2;
      ctx!.lineCap = "round";
      for (const angle of [-0.2, -0.85, -1.5]) {
        ctx!.beginPath();
        ctx!.moveTo(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4);
        ctx!.lineTo(x + Math.cos(angle) * (4 + length), y + Math.sin(angle) * (4 + length));
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function frame(now: number, dt: number) {
      if (state === "playing" && moving) {
        moving.x += direction * slideSpeed(tower.length - 1) * dt;
        const { min, max } = bounds(moving);
        if (moving.x <= min) {
          moving.x = min;
          direction = 1;
        } else if (moving.x >= max) {
          moving.x = max;
          direction = -1;
        }
      }

      // Keep the top of the tower a little below the middle of the screen.
      const target = Math.max(0, (tower.length + 1) * slabHeight - (groundY - height * 0.5));
      camera += (target - camera) * 0.1 * dt;

      for (const piece of falling) {
        piece.vy += 0.5 * dt;
        piece.y += piece.vy * dt;
        piece.rotation += piece.spin * dt;
      }
      falling = falling.filter((piece) => levelY(piece.level) + piece.y < height + 120);
      bursts = bursts.filter((burst) => now - burst.bornAt < 500);

      ctx!.clearRect(0, 0, width, height);

      // The ground line from the illustrations; it scrolls away as you climb.
      const ground = groundY + camera;
      if (ground < height + 2) {
        ctx!.strokeStyle = INK;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(width * 0.12, ground);
        ctx!.lineTo(width * 0.88, ground);
        ctx!.stroke();
      }

      tower.forEach((slab, level) => {
        const y = levelY(level);
        if (y > -slabHeight && y < height) drawSlab(slab, level, y);
      });

      if (moving) drawSlab(moving, tower.length, levelY(tower.length));

      for (const piece of falling) {
        ctx!.save();
        ctx!.translate(piece.x + piece.width / 2, levelY(piece.level) + piece.y + slabHeight / 2);
        ctx!.rotate(piece.rotation);
        drawSlab({ x: -piece.width / 2, width: piece.width }, piece.level, -slabHeight / 2);
        ctx!.restore();
      }

      for (const burst of bursts) drawBurst(burst, now);
    }

    layout();
    reset();

    let animation = 0;
    let last = performance.now();
    function loop(now: number) {
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;
      frame(now, dt);
      animation = requestAnimationFrame(loop);
    }
    animation = requestAnimationFrame(loop);

    const resizeObserver = new ResizeObserver(() => {
      layout();
      // Resizing would misalign the tower, so a run in progress starts over.
      reset();
      if (state === "playing") {
        spawn();
        setWeeks(0);
      }
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
    };
  }, []);

  // Keys are heard on the window, not the overlay: clicking Start focuses a
  // button that disappears as play begins, which would otherwise leave focus
  // on <body> and the overlay deaf to Space.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== " " && event.key !== "Enter") return;
      // Also stops a focused button from treating the same press as a click.
      event.preventDefault();
      if (!event.repeat) actRef.current();
    }

    function onKeyUp(event: KeyboardEvent) {
      // Buttons fire their click for Space on keyup; one press, one action.
      if (event.key === " ") event.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Stack the weeks — a hidden game"
      tabIndex={-1}
      className="fixed inset-0 z-50 h-dvh bg-surface-brand outline-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={() => phase === "playing" && actRef.current()}
        className="absolute inset-0 h-full w-full touch-none select-none"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 px-6 py-5 sm:px-10 sm:py-6">
        <div className="w-full max-w-60">
          <p className="text-sm text-neutral-400">Stack the weeks</p>
          <p className="text-2xl font-bold text-neutral-800 tabular-nums">
            Week {weeks}
            <span className="font-medium text-neutral-300"> / {GRADUATION_WEEK}</span>
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-neutral-200">
            <div
              className="h-2 rounded-full bg-brand-primary transition-[width] duration-300"
              style={{ width: `${(weeks / GRADUATION_WEEK) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-400">Best: {best} weeks</p>
        </div>

        <button
          type="button"
          aria-label="Close game"
          onClick={onClose}
          className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100/60"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {phase !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-lg">
            {phase === "won" && (
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-success-badge">
                <CheckCircle2 className="h-8 w-8 text-text-success" />
              </span>
            )}

            <h2 className="text-xl font-bold text-neutral-800">
              {phase === "ready"
                ? "Stack the weeks"
                : phase === "won"
                  ? "You graduated"
                  : `${weeks} week${weeks === 1 ? "" : "s"} stacked`}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {phase === "ready"
                ? "The program runs for 52 weeks. Drop each one cleanly — whatever hangs over the edge is gone for good."
                : phase === "won"
                  ? "All 52 weeks, stacked. Ready to build the future?"
                  : gritLevel(weeks)}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                pill
                className="w-full cursor-pointer"
                onClick={() => actRef.current()}
              >
                {phase === "ready" ? "Start" : "Play again"}
              </Button>
              {phase !== "ready" && (
                <Button
                  variant="secondary"
                  size="lg"
                  pill
                  className="w-full cursor-pointer"
                  onClick={onClose}
                >
                  Back to the cohort
                </Button>
              )}
            </div>
            <p className="mt-4 text-xs text-neutral-400">
              Tap or press Space to drop · Esc to leave
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
