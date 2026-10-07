"use client";

import * as React from "react";

import { LOGO_VIEWBOX, renderStrip, sampleBandStrips } from "@/components/home/logo-bands";

type Slat = {
  /** Home position and size, from the mark. */
  hx: number;
  hy: number;
  w: number;
  h: number;
  /** The slice of the mark, in brand indigo and in the lighter hover indigo. */
  brand: HTMLCanvasElement;
  light: HTMLCanvasElement;
  /** Where it is now, and how fast it's moving. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  vspin: number;
};

/** How much of the canvas height the mark fills. */
const FILL = 0.8;

/**
 * The Rise mark, huge, built from the same slices the story used: side by
 * side they make the exact mark. Slices push away from the pointer and spring
 * back home. Still for reduced motion.
 */
export function FooterMark() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let slats: Slat[] = [];
    let dpr = 1;
    let width = 0;
    let height = 0;
    let reach = 0;
    const pointer = { x: 0, y: 0, active: false };

    function layout() {
      if (!canvas) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      let markH = height * FILL;
      let markW = (markH * LOGO_VIEWBOX.width) / LOGO_VIEWBOX.height;
      if (markW > width * 0.94) {
        markW = width * 0.94;
        markH = (markW * LOGO_VIEWBOX.height) / LOGO_VIEWBOX.width;
      }
      const k = markH / LOGO_VIEWBOX.height;
      const left = (width - markW) / 2;
      const top = (height - markH) / 2;
      reach = markW * 0.16;

      const counts = width < 768 ? [40, 34, 28] : [72, 60, 50];
      slats = sampleBandStrips(counts).map((seg) => {
        const hx = left + seg.x * k;
        const hy = top + seg.y * k;
        return {
          hx,
          hy,
          w: seg.w * k,
          h: seg.h * k,
          brand: renderStrip(seg, k * dpr, "#6C77E6"),
          light: renderStrip(seg, k * dpr, "#B8BFFF"),
          x: hx,
          y: hy,
          vx: 0,
          vy: 0,
          spin: 0,
          vspin: 0,
        };
      });
    }

    function draw() {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const slat of slats) {
        // Slices that have been pushed glow lighter.
        const moved = Math.min(Math.hypot(slat.x - slat.hx, slat.y - slat.hy) / (reach * 0.5), 1);
        const cos = Math.cos(slat.spin);
        const sin = Math.sin(slat.spin);
        ctx.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * slat.x, dpr * slat.y);
        ctx.globalAlpha = 1;
        // A hair wider than the slice, so no seams show between neighbours.
        ctx.drawImage(slat.brand, -slat.w / 2 - 0.35, -slat.h / 2, slat.w + 0.7, slat.h);
        if (moved > 0.01) {
          ctx.globalAlpha = moved;
          ctx.drawImage(slat.light, -slat.w / 2, -slat.h / 2, slat.w, slat.h);
        }
      }
    }

    function step() {
      for (const slat of slats) {
        if (pointer.active) {
          const dx = slat.x - pointer.x;
          const dy = slat.y - pointer.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < reach) {
            const force = (1 - d / reach) ** 2 * 3.2;
            slat.vx += (dx / d) * force;
            slat.vy += (dy / d) * force;
            slat.vspin += (dx > 0 ? 1 : -1) * force * 0.012;
          }
        }
        slat.vx = (slat.vx + (slat.hx - slat.x) * 0.045) * 0.86;
        slat.vy = (slat.vy + (slat.hy - slat.y) * 0.045) * 0.86;
        slat.vspin = (slat.vspin - slat.spin * 0.05) * 0.86;
        slat.x += slat.vx;
        slat.y += slat.vy;
        slat.spin += slat.vspin;
      }
    }

    let frame = 0;
    let visible = false;
    function loop() {
      step();
      draw();
      frame = visible ? requestAnimationFrame(loop) : 0;
    }

    layout();
    draw();

    const resize = new ResizeObserver(() => {
      layout();
      draw();
    });
    resize.observe(canvas);

    // Only animate while the footer is on screen.
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !reduced;
      if (visible && !frame) frame = requestAnimationFrame(loop);
    });
    seen.observe(canvas);

    function onMove(event: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }
    function onLeave() {
      pointer.active = false;
    }
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerup", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      seen.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerup", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="block h-[min(40vw,460px)] w-full touch-pan-y" />;
}
