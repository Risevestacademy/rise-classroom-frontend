"use client";

import { useEffect, useRef } from "react";

/** Every layer in the Figma motion timeline loops over 20 seconds. */
const LOOP_MS = 20_000;
/** The Figma frame the layer sizes and offsets were drawn in. */
const FRAME_WIDTH = 1440;
/** The canvas draws at a fraction of the hero's size; it's all soft light. */
const RESOLUTION = 0.35;
/** On load the beams sweep round once before the swirl and halftone fade in. */
const INTRO_SPIN_MS = 2400;
const REVEAL_DELAY_MS = 1800;
const REVEAL_MS = 1200;

/** CSS `ease-in-out`, cubic-bezier(0.42, 0, 0.58, 1). */
function easeInOut(x: number) {
  let t = x;
  for (let i = 0; i < 6; i++) {
    const bx = 3 * 0.42 * t * (1 - t) ** 2 + 3 * 0.58 * t ** 2 * (1 - t) + t ** 3;
    const dx =
      3 * 0.42 * (1 - t) ** 2 + 6 * (0.58 - 0.42) * t * (1 - t) + 3 * (1 - 0.58) * t ** 2;
    if (Math.abs(dx) < 1e-6) break;
    t -= (bx - x) / dx;
  }
  return 3 * t ** 2 * (1 - t) + t ** 3;
}

const easeOut = (x: number) => 1 - (1 - x) ** 3;

/** Values at evenly spaced keyframes (0%, 25% … 100%), eased between each. */
function track(values: number[], progress: number) {
  const segments = values.length - 1;
  const at = progress * segments;
  const index = Math.min(Math.floor(at), segments - 1);
  const t = easeInOut(at - index);
  return values[index] + (values[index + 1] - values[index]) * t;
}

const deg = (value: number) => (value * Math.PI) / 180;

type Stop = [offset: number, color: string];

/** CSS conic-gradient(from <from> at <x> <y>, …) with stops in degrees. */
function conic(ctx: CanvasRenderingContext2D, from: number, x: number, y: number, stops: Stop[]) {
  // Canvas measures from 3 o'clock, CSS from 12.
  const gradient = ctx.createConicGradient(deg(from - 90), x, y);
  for (const [offset, color] of stops) gradient.addColorStop(offset / 360, color);
  return gradient;
}

/**
 * The hero's moving indigo backdrop: a swirl photo under three rotating conic
 * "spiral arms", a breathing glow and two vignettes, seen through a halftone
 * screen. Layers, gradients and keyframes are the Figma motion timeline's;
 * they're drawn on a small canvas because the same thing as blended CSS
 * layers costs far too much to composite.
 */
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const screen = screenRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !screen || !ctx) return;

    const swirl = new Image();
    swirl.src = "/landing/hero-swirl.webp";
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * RESOLUTION));
      canvas.height = Math.max(1, Math.round(height * RESOLUTION));
    };

    /** One frame, `elapsed` ms after the page opened. */
    const draw = (elapsed: number) => {
      const p = (elapsed % LOOP_MS) / LOOP_MS;
      const w = width;
      const h = height;
      const unit = w / FRAME_WIDTH;
      const cx = w / 2;
      const cy = h / 2;
      const intro = still ? 1 : Math.min(elapsed / INTRO_SPIN_MS, 1);
      const reveal = still
        ? 1
        : easeOut(Math.min(Math.max((elapsed - REVEAL_DELAY_MS) / REVEAL_MS, 0), 1));
      // On the same clock as the canvas, which only starts once React has.
      if (screen.style.opacity !== "1") screen.style.opacity = String(reveal);

      ctx.setTransform(RESOLUTION, 0, 0, RESOLUTION, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#04040B";
      ctx.fillRect(0, 0, w, h);

      // Swirl photo: a portrait image turned on its side (w and h swap).
      if (swirl.complete && swirl.naturalWidth && reveal > 0) {
        ctx.save();
        ctx.globalAlpha = reveal;
        ctx.translate(
          cx + track([-150, 150, -150, 150, -150], p) * unit,
          cy + track([85, -85, 85, -85, 85], p) * unit
        );
        ctx.rotate(track([-1.466, -1.676, -1.466, -1.676, -1.466], p));
        ctx.scale(track([1.58, 1.7, 1.58, 1.7, 1.58], p), track([1.6, 1.58, 1.6, 1.58, 1.6], p));
        ctx.beginPath();
        ctx.rect(-h / 2, -w / 2, h, w);
        ctx.clip();
        ctx.drawImage(swirl, -h / 2, -w / 2 - 169.652 * unit, h, w * 1.2642);
        ctx.restore();
      }

      // Spiral arms and glow, screened over the swirl. They also sweep one
      // extra turn during the intro.
      const sweep = deg(-360 * (1 - easeOut(intro)));
      const layer = (
        opacity: number,
        rotate: number,
        scale: number,
        fill: CanvasGradient
      ) => {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = opacity;
        ctx.translate(cx, cy);
        ctx.rotate(sweep + rotate);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      };

      const armScale = track([1.65, 1.7, 1.65], p);
      layer(
        track([0.75, 0.58, 0.82, 0.65, 0.75], p),
        -2 * Math.PI * p,
        armScale,
        conic(ctx, 48, w * 0.35, h * 0.75, [
          [0, "rgba(26,35,126,0)"],
          [64.8, "rgba(57,73,171,0.4)"],
          [100.8, "rgba(92,107,192,0.73)"],
          [136.8, "rgba(57,73,171,0.27)"],
          [198, "rgba(26,35,126,0)"],
          [360, "rgba(0,0,0,0)"],
        ])
      );
      layer(
        track([0.65, 0.8, 0.55, 0.72, 0.65], p),
        2 * Math.PI * p,
        armScale,
        conic(ctx, 138, w * 0.7, h * 0.2, [
          [0, "rgba(0,0,0,0)"],
          [126, "rgba(26,35,126,0)"],
          [172.8, "rgba(40,53,147,0.67)"],
          [208.8, "rgba(63,81,181,0.8)"],
          [244.8, "rgba(40,53,147,0.67)"],
          [295.2, "rgba(26,35,126,0)"],
          [360, "rgba(0,0,0,0)"],
        ])
      );

      // Central glow: an ellipse, so draw a circle and stretch it.
      const glowRx = w * 0.3;
      const glowRy = h * 0.34;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = track([0.55, 0.72, 0.48, 0.65, 0.55], p);
      ctx.translate(cx, cy);
      ctx.rotate(sweep);
      ctx.scale(track([1, 1.18, 1, 1.12, 1], p), track([1, 1.12, 1, 1.18, 1], p));
      ctx.translate(-cx + w * 0.48, -cy + h * 0.52);
      ctx.scale(1, glowRy / glowRx);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRx);
      glow.addColorStop(0, "rgba(121,134,203,0.73)");
      glow.addColorStop(0.35, "rgba(92,107,192,0.33)");
      glow.addColorStop(0.6, "rgba(63,81,181,0.13)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-w * 2, -h * 4, w * 4, h * 8);
      ctx.restore();

      layer(
        track([0.7, 0.55, 0.78, 0.6, 0.7], p),
        -2 * Math.PI * p,
        armScale,
        conic(ctx, 90, w * 0.55, h * 0.45, [
          [0, "rgba(0,0,0,0)"],
          [198, "rgba(26,35,126,0)"],
          [234, "rgba(61,90,254,0.53)"],
          [259.2, "rgba(92,107,192,0.8)"],
          [288, "rgba(61,90,254,0.33)"],
          [324, "rgba(26,35,126,0)"],
          [360, "rgba(0,0,0,0)"],
        ])
      );

      // Vignettes.
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = track([0.45, 0.33, 0.45, 0.37, 0.45], p);
      ctx.fillStyle = conic(ctx, 90, cx, cy, [
        [0, "rgba(8,13,56,0.8)"],
        [79.2, "rgba(8,13,56,0.27)"],
        [151.2, "rgba(8,13,56,0.73)"],
        [223.2, "rgba(8,13,56,0.13)"],
        [288, "rgba(8,13,56,0.73)"],
        [360, "rgba(8,13,56,0.8)"],
      ]);
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = track([0.6, 0.47, 0.6, 0.5, 0.6], p);
      ctx.translate(cx, cy);
      ctx.scale(1, h / w);
      const edge = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.6);
      edge.addColorStop(0.3, "rgba(0,0,0,0)");
      edge.addColorStop(1, "rgba(8,13,56,0.73)");
      ctx.fillStyle = edge;
      ctx.fillRect(-w, -w, w * 2, w * 2);
      ctx.restore();
    };

    resize();
    const start = performance.now();
    let frame = 0;
    let visible = true;

    const loop = (now: number) => {
      draw(now - start);
      frame = visible ? requestAnimationFrame(loop) : 0;
    };
    const render = () => {
      if (still) draw(0);
      else if (!frame) frame = requestAnimationFrame(loop);
    };

    swirl.onload = render;
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (still) draw(0);
    });
    resizeObserver.observe(canvas);
    // Stop drawing once the hero has scrolled out of view.
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) render();
    });
    visibility.observe(canvas);
    render();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      swirl.onload = null;
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#04040B]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      {/* Halftone screen: dark everywhere except small holes the light shows through. */}
      <div ref={screenRef} className="absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_center,transparent_2.5px,#04040B_3px)] bg-size-[12px_12px]" />
    </div>
  );
}
