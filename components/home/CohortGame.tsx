"use client";

import * as React from "react";
import { ArrowRight, Bug, MousePointer2, RotateCcw, Users, X } from "lucide-react";

import { LOGO_VIEWBOX, renderStrip, sampleBandStrips, type BandStrip } from "@/components/home/logo-bands";
import {
  CLASSMATES,
  SPACING,
  alongPath,
  bugCount,
  formatTime,
  noticeRadius,
  scattered,
  touching,
  trimPath,
  type Point,
} from "@/lib/cohort-game";

/** Mirrors the brand tokens in app/globals.css; canvas can't read Tailwind classes. */
const NAVY = "#080D38"; // brand-950
const LAVENDER: Rgb = [184, 191, 255]; // brand-300
const WHITE: Rgb = [255, 255, 255];
const BUG = "#FF6B81";

type Rgb = [number, number, number];
type Phase = "ready" | "playing" | "forming" | "won";

type Mate = { x: number; y: number; vx: number; vy: number; inLine: boolean; bob: number };
type Critter = { x: number; y: number; vx: number; vy: number; seed: number };
type Spark = { x: number; y: number; vx: number; vy: number; born: number };
type Popup = { x: number; y: number; born: number };

const BEST_KEY = "rise-cohort-best";

function readBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function mix(a: Rgb, b: Rgb, t: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",");
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);

/**
 * The hidden game: gather your cohort. You're the bright piece; steer with
 * the mouse, a finger or the arrow keys, and every classmate you touch joins
 * the line behind you. Bugs knock a few people loose, but nobody loses. Once
 * all 60 of you are together, the line flies into place as the Rise mark,
 * one person per slice: the landing page's story in a minute.
 */
export function CohortGame({ onClose }: { onClose: () => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timeRef = React.useRef<HTMLSpanElement>(null);

  const [phase, setPhase] = React.useState<Phase>("ready");
  const [gathered, setGathered] = React.useState(0);
  const [result, setResult] = React.useState<{ time: number; best: number; record: boolean } | null>(null);
  // The game only mounts in the browser, after a click, so storage is there.
  const [best, setBest] = React.useState(readBest);

  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  const startRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    containerRef.current?.focus();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const font = getComputedStyle(canvas).fontFamily;

    let w = 0;
    let h = 0;
    let dpr = 1;
    /** Size unit: people, speeds and reach all scale with the screen. */
    let u = 1;
    let grid: HTMLCanvasElement | null = null;

    // The mark the cohort forms at the end: 60 slices, one per person.
    const strips: BandStrip[] = sampleBandStrips([24, 20, 16]);
    let sprites: HTMLCanvasElement[] = [];
    let mark = { x: 0, y: 0, k: 1 };

    let phaseNow: Phase = "ready";
    let head: Point = { x: 0, y: 0 };
    let target: Point = { x: 0, y: 0 };
    let path: Point[] = [];
    let mates: Mate[] = [];
    let line: Mate[] = [];
    let bugs: Critter[] = [];
    let sparks: Spark[] = [];
    let popups: Popup[] = [];
    let elapsed = 0;
    let clock = 0;
    let invulnerable = 0;
    let shake = 0;
    let forming = 0;
    let formFrom: Point[] = [];
    let steered = false;
    const keys = new Set<string>();

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      u = Math.min(Math.max(Math.min(w, h) / 820, 0.75), 1.2);

      // A faint dot grid, painted once per size.
      grid = document.createElement("canvas");
      grid.width = canvas!.width;
      grid.height = canvas!.height;
      const g = grid.getContext("2d");
      if (g) {
        g.fillStyle = "rgba(255,255,255,0.07)";
        const step = 34 * u * dpr;
        for (let x = step / 2; x < grid.width; x += step)
          for (let y = step / 2; y < grid.height; y += step) g.fillRect(x, y, 1.6 * dpr, 1.6 * dpr);
      }

      // High on the screen, clear of the cards that sit at the bottom.
      const height = Math.min(h * 0.24, ((w * 0.5) / LOGO_VIEWBOX.width) * LOGO_VIEWBOX.height);
      const k = height / LOGO_VIEWBOX.height;
      mark = { x: w / 2 - (LOGO_VIEWBOX.width * k) / 2, y: h * 0.28 - height / 2, k };
      sprites = strips.map((strip) => renderStrip(strip, k * dpr, "#FFFFFF"));
    }

    /** The play area starts under the score. */
    const top = () => 140 * u;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function spawnBug(): Critter {
      // From the edge furthest from you, so a bug never lands on top of you.
      const edges: Point[] = [
        { x: rand(0, w), y: top() },
        { x: rand(0, w), y: h - 10 },
        { x: 10, y: rand(top(), h) },
        { x: w - 10, y: rand(top(), h) },
      ];
      const at = edges.reduce((far, p) =>
        Math.hypot(p.x - head.x, p.y - head.y) > Math.hypot(far.x - head.x, far.y - head.y) ? p : far
      );
      return { ...at, vx: 0, vy: 0, seed: Math.random() * 100 };
    }

    function start() {
      head = { x: w / 2, y: h * 0.55 };
      target = { ...head };
      path = [{ ...head }];
      mates = Array.from({ length: CLASSMATES }, () => {
        // Scattered round the room, never right next to you.
        let x = 0;
        let y = 0;
        do {
          x = rand(40, w - 40);
          y = rand(top() + 20, h - 40);
        } while (Math.hypot(x - head.x, y - head.y) < 140 * u);
        return { x, y, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), inLine: false, bob: Math.random() * 6 };
      });
      line = [];
      bugs = [];
      sparks = [];
      popups = [];
      elapsed = 0;
      invulnerable = 0;
      forming = 0;
      steered = false;
      phaseNow = "playing";
      setPhase("playing");
      setGathered(0);
      setResult(null);
    }
    startRef.current = start;

    function finish() {
      phaseNow = "forming";
      setPhase("forming");
      forming = 0;
      formFrom = [head, ...line].map((p) => ({ x: p.x, y: p.y }));
      const previous = readBest();
      const record = previous === 0 || elapsed < previous;
      const bestNow = record ? elapsed : previous;
      try {
        window.localStorage.setItem(BEST_KEY, String(bestNow));
      } catch {
        // Private mode: the best time just isn't kept.
      }
      setBest(bestNow);
      setResult({ time: elapsed, best: bestNow, record });
    }

    function step(dt: number) {
      clock += dt / 60;
      shake *= 0.86 ** dt;
      if (phaseNow === "playing") play(dt);
      if (phaseNow === "forming") {
        forming += dt / 60 / 2.4;
        if (forming >= 1.15) {
          phaseNow = "won";
          setPhase("won");
        }
      }
      sparks = sparks.filter((s) => clock - s.born < 0.7);
      for (const s of sparks) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= 0.93 ** dt;
        s.vy *= 0.93 ** dt;
      }
      popups = popups.filter((p) => clock - p.born < 0.8);
    }

    function play(dt: number) {
      elapsed += dt / 60;
      invulnerable = Math.max(0, invulnerable - dt / 60);

      // Keys steer by pointing the target ahead of you.
      const kx = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
      const ky = (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
      if (kx || ky) {
        const n = Math.hypot(kx, ky);
        target = { x: head.x + (kx / n) * 160 * u, y: head.y + (ky / n) * 160 * u };
        steered = true;
      }
      target.x = Math.min(Math.max(target.x, 16), w - 16);
      target.y = Math.min(Math.max(target.y, top()), h - 16);

      const dx = target.x - head.x;
      const dy = target.y - head.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.5) {
        const speed = Math.min(d * 0.14, 7.5 * u) * dt;
        head = { x: head.x + (dx / d) * Math.min(speed, d), y: head.y + (dy / d) * Math.min(speed, d) };
      }
      if (Math.hypot(head.x - path[0].x, head.y - path[0].y) > 2) path.unshift({ ...head });
      trimPath(path, (line.length + 2) * SPACING * u);

      line.forEach((mate, k) => {
        const at = alongPath(path, (k + 1) * SPACING * u);
        const pull = 1 - 0.55 ** dt;
        mate.x += (at.x - mate.x) * pull;
        mate.y += (at.y - mate.y) * pull;
      });

      for (const mate of mates) {
        if (mate.inLine) continue;
        // Classmates wander, and drift your way when you're close: easy to pick up.
        mate.vx += rand(-0.06, 0.06) * dt;
        mate.vy += rand(-0.06, 0.06) * dt;
        const toYou = Math.hypot(head.x - mate.x, head.y - mate.y);
        const notice = noticeRadius(CLASSMATES - line.length) * u;
        if (toYou < notice && toYou > 0) {
          mate.vx += ((head.x - mate.x) / toYou) * 0.12 * dt;
          mate.vy += ((head.y - mate.y) / toYou) * 0.12 * dt;
        }
        const v = Math.hypot(mate.vx, mate.vy);
        const max = (toYou < notice ? 2.4 : 0.7) * u;
        if (v > max) {
          mate.vx *= max / v;
          mate.vy *= max / v;
        }
        mate.x += mate.vx * dt;
        mate.y += mate.vy * dt;
        if (mate.x < 20 || mate.x > w - 20) mate.vx *= -1;
        if (mate.y < top() || mate.y > h - 20) mate.vy *= -1;
        mate.x = Math.min(Math.max(mate.x, 20), w - 20);
        mate.y = Math.min(Math.max(mate.y, top()), h - 20);

        if (touching(head, mate, 26 * u)) {
          mate.inLine = true;
          line.push(mate);
          setGathered(line.length);
          popups.push({ x: mate.x, y: mate.y, born: clock });
          for (let s = 0; s < 8; s++) {
            const a = (s / 8) * Math.PI * 2 + Math.random();
            sparks.push({ x: mate.x, y: mate.y, vx: Math.cos(a) * 3 * u, vy: Math.sin(a) * 3 * u, born: clock });
          }
          if (line.length >= CLASSMATES) {
            finish();
            return;
          }
        }
      }

      while (bugs.length < bugCount(line.length)) bugs.push(spawnBug());
      const bugSpeed = (1.25 + line.length * 0.012) * u;
      for (const bug of bugs) {
        const bd = Math.hypot(head.x - bug.x, head.y - bug.y) || 1;
        bug.vx += ((head.x - bug.x) / bd) * 0.05 * dt + Math.sin(clock * 3 + bug.seed) * 0.05 * dt;
        bug.vy += ((head.y - bug.y) / bd) * 0.05 * dt + Math.cos(clock * 2.6 + bug.seed) * 0.05 * dt;
        const v = Math.hypot(bug.vx, bug.vy);
        if (v > bugSpeed) {
          bug.vx *= bugSpeed / v;
          bug.vy *= bugSpeed / v;
        }
        bug.x = Math.min(Math.max(bug.x + bug.vx * dt, 10), w - 10);
        bug.y = Math.min(Math.max(bug.y + bug.vy * dt, top()), h - 10);

        if (invulnerable <= 0 && touching(head, bug, 22 * u)) {
          // A bug knocks the last few people loose; they scatter back into the room.
          const lost = line.splice(line.length - scattered(line.length));
          for (const mate of lost) {
            mate.inLine = false;
            const a = Math.random() * Math.PI * 2;
            mate.vx = Math.cos(a) * 5 * u;
            mate.vy = Math.sin(a) * 5 * u;
          }
          setGathered(line.length);
          invulnerable = 2;
          shake = reduced ? 0 : 1;
          bug.vx = -bug.vx * 4;
          bug.vy = -bug.vy * 4;
        }
      }
    }

    function pill(x: number, y: number, pw: number, ph: number, color: string) {
      ctx!.beginPath();
      ctx!.roundRect(x - pw / 2, y - ph / 2, pw, ph, pw / 2);
      ctx!.fillStyle = color;
      ctx!.fill();
    }

    function draw() {
      const c = ctx!;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = NAVY;
      c.fillRect(0, 0, w, h);
      if (shake > 0.01) c.translate((Math.random() - 0.5) * 10 * shake, (Math.random() - 0.5) * 10 * shake);
      if (grid) {
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 0.9;
        c.drawImage(grid, 0, 0);
        c.restore();
      }

      if (phaseNow === "ready") {
        drawMark(1, clock);
        return;
      }

      const forming_ = phaseNow === "forming" || phaseNow === "won";
      // A soft light follows you around the room.
      const light = c.createRadialGradient(head.x, head.y, 0, head.x, head.y, 280 * u);
      light.addColorStop(0, `rgba(146,155,255,${forming_ ? 0.05 : 0.14})`);
      light.addColorStop(1, "rgba(146,155,255,0)");
      c.fillStyle = light;
      c.fillRect(0, 0, w, h);

      if (forming_) {
        drawForming();
        drawEffects();
        return;
      }

      const pw = 7 * u;
      const ph = 19 * u;

      for (const mate of mates) {
        if (mate.inLine) continue;
        pill(mate.x, mate.y + Math.sin(clock * 3 + mate.bob) * 2 * u, pw, ph, "rgba(255,255,255,0.5)");
      }

      // The line: a faint thread through everyone, brightest at the front.
      if (line.length) {
        c.beginPath();
        c.moveTo(head.x, head.y);
        for (const mate of line) c.lineTo(mate.x, mate.y);
        c.strokeStyle = "rgba(184,191,255,0.22)";
        c.lineWidth = 2 * u;
        c.lineJoin = "round";
        c.stroke();
      }
      for (let k = line.length - 1; k >= 0; k--) {
        const t = 1 - k / Math.max(line.length, 1);
        pill(line[k].x, line[k].y, pw, ph, `rgb(${mix(LAVENDER, WHITE, t * 0.7)})`);
      }

      for (const bug of bugs) drawBug(bug);

      // You.
      const blink = invulnerable > 0 && Math.floor(clock * 10) % 2 === 0;
      c.save();
      c.globalAlpha = blink ? 0.35 : 1;
      c.shadowColor = "rgba(184,191,255,0.9)";
      c.shadowBlur = 22 * u;
      pill(head.x, head.y, 10 * u, 26 * u, "#FFFFFF");
      c.restore();
      const tw = 32 * u;
      const th = 17 * u;
      c.beginPath();
      c.roundRect(head.x - tw / 2, head.y - 13 * u - 10 * u - th, tw, th, th / 2);
      c.fillStyle = `rgb(${LAVENDER.join(",")})`;
      c.fill();
      c.font = `700 ${10 * u}px ${font}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = NAVY;
      c.fillText("You", head.x, head.y - 23 * u - th / 2 + 0.5);

      // Until you move, a nudge to.
      if (!steered && elapsed < 6) {
        c.globalAlpha = 1 - clamp01((elapsed - 4) / 2);
        c.font = `500 ${14 * u}px ${font}`;
        c.fillStyle = "rgba(255,255,255,0.7)";
        c.fillText("Move to steer", head.x, head.y + 44 * u);
        c.globalAlpha = 1;
      }
      drawEffects();
    }

    function drawBug(bug: Critter) {
      const c = ctx!;
      const s = 4.2 * u;
      // A glitch: a few squares that won't sit still, with a colour split.
      for (let k = 0; k < 6; k++) {
        const a = bug.seed + k * 1.7 + (reduced ? 0 : clock * 9);
        const r = (k === 0 ? 0 : 7) * u;
        const x = bug.x + Math.cos(a) * r * (0.6 + 0.4 * Math.sin(clock * 13 + k));
        const y = bug.y + Math.sin(a * 1.3) * r;
        c.fillStyle = "rgba(108,119,230,0.8)";
        c.fillRect(x - s / 2 - 1.5 * u, y - s / 2, s, s);
        c.fillStyle = BUG;
        c.fillRect(x - s / 2, y - s / 2, s, s);
      }
      c.beginPath();
      c.arc(bug.x, bug.y, 16 * u, 0, Math.PI * 2);
      c.strokeStyle = "rgba(255,107,129,0.25)";
      c.lineWidth = 1.2 * u;
      c.stroke();
    }

    function drawEffects() {
      const c = ctx!;
      for (const s of sparks) {
        const age = (clock - s.born) / 0.7;
        c.globalAlpha = 1 - age;
        c.fillStyle = `rgb(${LAVENDER.join(",")})`;
        c.fillRect(s.x - 1.5 * u, s.y - 1.5 * u, 3 * u, 3 * u);
      }
      c.font = `700 ${13 * u}px ${font}`;
      c.textAlign = "center";
      for (const p of popups) {
        const age = (clock - p.born) / 0.8;
        c.globalAlpha = 1 - age;
        c.fillStyle = "#FFFFFF";
        c.fillText("+1", p.x, p.y - 18 * u - age * 26 * u);
      }
      c.globalAlpha = 1;
    }

    /** The whole cohort as the Rise mark, a slow wave running through it. */
    function drawMark(alpha: number, time: number) {
      const c = ctx!;
      strips.forEach((strip, k) => {
        const sprite = sprites[k];
        if (!sprite) return;
        const lift = reduced ? 0 : Math.sin(time * 1.8 - strip.x * 0.32) * 1.6 * u;
        c.globalAlpha = alpha;
        c.drawImage(
          sprite,
          mark.x + (strip.x - strip.w / 2) * mark.k,
          mark.y + (strip.y - strip.h / 2) * mark.k + lift,
          strip.w * mark.k + 0.6,
          strip.h * mark.k
        );
      });
      c.globalAlpha = 1;
    }

    /** Everyone flies into their slice of the mark, front of the line first. */
    function drawForming() {
      const c = ctx!;
      const glow = clamp01((forming - 0.6) / 0.4);
      if (glow > 0) {
        const cx = mark.x + (LOGO_VIEWBOX.width * mark.k) / 2;
        const cy = mark.y + (LOGO_VIEWBOX.height * mark.k) / 2;
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, LOGO_VIEWBOX.width * mark.k);
        g.addColorStop(0, `rgba(146,155,255,${0.25 * glow})`);
        g.addColorStop(1, "rgba(146,155,255,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }
      if (forming >= 1) {
        drawMark(1, clock);
        return;
      }
      formFrom.forEach((from, k) => {
        const strip = strips[k];
        const sprite = sprites[k];
        if (!strip || !sprite) return;
        const order = k / formFrom.length;
        const t = ease(clamp01((forming - order * 0.45) / 0.55));
        const to = { x: mark.x + strip.x * mark.k, y: mark.y + strip.y * mark.k };
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 60 * u;
        const sw = strip.w * mark.k;
        const sh = strip.h * mark.k;
        c.globalAlpha = 1 - t;
        pill(x, y, 7 * u, 19 * u, k === 0 ? "#FFFFFF" : `rgb(${mix(LAVENDER, WHITE, 0.5)})`);
        c.globalAlpha = t;
        c.drawImage(sprite, x - sw / 2, y - sh / 2, sw + 0.6, sh);
        c.globalAlpha = 1;
      });
    }

    let frame = 0;
    let last = performance.now();
    function loop(now: number) {
      const dt = Math.min((now - last) / (1000 / 60), 3);
      last = now;
      step(dt);
      draw();
      if (timeRef.current && phaseNow === "playing") timeRef.current.textContent = formatTime(elapsed);
      frame = requestAnimationFrame(loop);
    }

    function onPointer(event: PointerEvent) {
      const box = canvas!.getBoundingClientRect();
      target = { x: event.clientX - box.left, y: event.clientY - box.top };
      if (phaseNow === "playing" && Math.hypot(target.x - head.x, target.y - head.y) > 12) steered = true;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key.startsWith("Arrow") || "wasd".includes(key)) {
        event.preventDefault();
        keys.add(key);
      }
      if ((event.key === "Enter" || event.key === " ") && phaseNow !== "playing" && phaseNow !== "forming") {
        event.preventDefault();
        start();
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      keys.delete(key);
      if (!keys.size) target = { ...head };
    }

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const playing = phase === "playing";

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Gather your cohort, a hidden game"
      tabIndex={-1}
      className="fixed inset-0 z-50 h-dvh overflow-hidden bg-brand-950 text-white outline-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none select-none" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 px-6 py-5 sm:px-10 sm:py-6">
        <div
          className={`transition-opacity duration-500 ${playing || phase === "forming" ? "opacity-100" : "opacity-0"}`}
        >
          <p className="text-[11px] font-medium tracking-[0.18em] text-brand-300 uppercase">Gather your cohort</p>
          <p className="mt-1 text-3xl font-bold tracking-[-0.03em] tabular-nums">
            {gathered}
            <span className="text-white/35"> / {CLASSMATES}</span>
          </p>
          <div className="mt-2 h-1 w-44 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-300 transition-[width] duration-300 ease-out"
              style={{ width: `${(gathered / CLASSMATES) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/50 tabular-nums">
            <span ref={timeRef}>0:00</span>
            {best > 0 && <span> · Best {formatTime(best)}</span>}
          </p>
        </div>

        <button
          type="button"
          aria-label="Close game"
          onClick={onClose}
          className="pointer-events-auto grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:outline-none"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {phase === "ready" && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-6 pb-[max(2rem,8vh)]">
          <div className="w-full max-w-md text-center">
            <p className="text-[11px] font-medium tracking-[0.18em] text-brand-300 uppercase">A hidden game</p>
            <h2 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] leading-[0.95] font-bold tracking-[-0.04em]">
              Gather your cohort.
            </h2>
            <ul className="mx-auto mt-6 grid max-w-sm gap-2.5 text-left text-sm text-white/75">
              <li className="flex items-center gap-3">
                <MousePointer2 aria-hidden className="h-4 w-4 shrink-0 text-brand-300" />
                Steer with your mouse, a finger or the arrow keys.
              </li>
              <li className="flex items-center gap-3">
                <Users aria-hidden className="h-4 w-4 shrink-0 text-brand-300" />
                Touch all {CLASSMATES} classmates to bring them along.
              </li>
              <li className="flex items-center gap-3">
                <Bug aria-hidden className="h-4 w-4 shrink-0 text-[#FF6B81]" />
                Dodge the bugs. They scatter a few people, nothing worse.
              </li>
            </ul>
            <button
              type="button"
              onClick={() => startRef.current()}
              className="group pointer-events-auto mt-8 inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-brand-950 transition-transform outline-none hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-brand-300/50"
            >
              Start
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <p className="mt-3 text-xs text-white/40">Enter to start · Esc to leave</p>
          </div>
        </div>
      )}

      {phase === "won" && result && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-6 pb-[max(2rem,8vh)]">
          <div className="w-full max-w-md animate-[game-rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both] text-center">
            <p className="text-[11px] font-medium tracking-[0.18em] text-brand-300 uppercase">
              {result.record ? "New best" : `Best ${formatTime(result.best)}`}
            </p>
            <h2 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] leading-[0.95] font-bold tracking-[-0.04em]">
              Cohort complete.
            </h2>
            <p className="mt-3 text-white/70">
              All 60 of you, together in <span className="font-bold text-white tabular-nums">{formatTime(result.time)}</span>.
              That&apos;s week one.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => startRef.current()}
                className="pointer-events-auto inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-brand-950 transition-transform outline-none hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-brand-300/50"
              >
                <RotateCcw className="h-4 w-4" />
                Play again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="pointer-events-auto inline-flex h-12 cursor-pointer items-center rounded-full border border-white/20 px-6 text-sm font-bold text-white transition-colors outline-none hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-brand-300/50"
              >
                Back to the story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
