"use client";

import * as React from "react";

import {
  PALETTE,
  layoutArtifacts,
  type Artifact,
  type BlockShape,
  type Rgb,
} from "@/components/home/artifacts";
import {
  STUDIO_PEOPLE,
  isStaff,
  tagFor,
  type StudioPerson,
} from "@/components/home/cohort";
import {
  LOGO_BANDS,
  LOGO_VIEWBOX,
  sampleBandSegments,
} from "@/components/home/logo-bands";

/** The mark holds together this long on arrival before the studio unpacks. */
const INTRO_MS = 1400;

/** How long one piece takes to fly between its card and the mark. */
const FLIGHT_MS = 800;

/** Each band sets off a beat after the one above, so the mark forms top-down. */
const BAND_STAGGER_MS = 240;

/** Within a band, pieces leave one after another, sweeping along it. */
const SWEEP_MS = 14;

type Piece = {
  band: number;
  /** Order along its band, for the sweep. */
  rank: number;
  shape: BlockShape;
  home: { x: number; y: number; w: number; h: number; color: Rgb };
  target: {
    x: number;
    y: number;
    w: number;
    h: number;
    angle: number;
    /** The strip of the real band this piece becomes, in logo units. */
    x0: number;
    x1: number;
  };
  /** 0 = in its card, 1 = in the mark. */
  t: number;
  goal: 0 | 1;
  /** When it's allowed to start moving towards its current goal. */
  departAt: number;
  /** Which way its flight bows, so pieces don't all fly in straight lines. */
  bow: number;
  /** Brief bump when a cursor clicks it. */
  pulseAt: number;
};

type Cursor = {
  person: StudioPerson;
  index: number;
  x: number;
  y: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  moveStart: number;
  moveDuration: number;
  restUntil: number;
  clickAt: number;
  /** The piece it's currently working on, if any. */
  piece: number | null;
};

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeOutBack = (t: number) => {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** A deterministic 0–1 value, so the page behaves the same every visit. */
const noise = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName)
  );
}

export type StudioLayout = {
  /** Vertical centre of the page's free middle area. */
  centerY: number;
  markTop: number;
  markBottom: number;
};

export function StudioField({
  paused = false,
  onMergeChange,
  onReveal,
  onLayout,
}: {
  /** Ignore input — e.g. while the hidden game is open on top. */
  paused?: boolean;
  /** True while the pieces are heading into (or sitting in) the mark. */
  onMergeChange?: (merged: boolean) => void;
  /** 0–3: how many bands of the mark have fully formed. */
  onReveal?: (level: number) => void;
  onLayout?: (layout: StudioLayout) => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Everything the animation reads from props goes through a ref, so it never
  // has to restart.
  const props = React.useRef({ paused, onMergeChange, onReveal, onLayout });
  React.useEffect(() => {
    props.current = { paused, onMergeChange, onReveal, onLayout };
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const fonts = {
      sans: getComputedStyle(canvas).fontFamily,
      mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    };

    let width = 0;
    let height = 0;
    let artifacts: Artifact[] = [];
    let pieces: Piece[] = [];
    let cursors: Cursor[] = [];
    let mark = { left: 0, top: 0, width: 0, height: 0, cx: 0, cy: 0 };

    let merged = false;
    /** Whether the visitor is pressing right now (pointer or Space). */
    let held = false;
    let revealLevel = -1;
    let formation = 0; // eased 0–1, for the card fade and the bursts
    let formedAt = 0;
    /**
     * Per band, how far the real logo shape has faded in over its pieces. The
     * pieces only approximate the mark, so once a band has landed it hands
     * over to the exact path from the SVG.
     */
    const solid = [0, 0, 0];
    const bandPaths = LOGO_BANDS.map((d) => new Path2D(d));
    const start = performance.now();

    function setMerged(next: boolean, now: number) {
      merged = next;
      props.current.onMergeChange?.(next);

      for (const piece of pieces) {
        piece.goal = next ? 1 : 0;
        piece.departAt = next
          ? now + piece.band * BAND_STAGGER_MS + piece.rank * SWEEP_MS
          : now + noise(piece.rank * 7 + piece.band) * 180;
      }

      cursors.forEach((cursor) => sendCursor(cursor, now));
    }

    function layout() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      artifacts = layoutArtifacts(width, height);

      const wide = width >= 900;
      const markWidth = Math.min(
        wide ? width * 0.32 : width * 0.62,
        height * 0.34 * (LOGO_VIEWBOX.width / LOGO_VIEWBOX.height),
        440
      );
      const scale = markWidth / LOGO_VIEWBOX.width;
      const markHeight = LOGO_VIEWBOX.height * scale;
      const cy = height * (wide ? 0.42 : 0.44);
      mark = {
        left: (width - markWidth) / 2,
        top: cy - markHeight / 2,
        width: markWidth,
        height: markHeight,
        cx: width / 2,
        cy,
      };

      const homes = artifacts.flatMap((artifact) => artifact.blocks);

      // One slot in the mark per piece of UI, split as evenly as the bands allow.
      const perBand = Math.floor(homes.length / 3);
      const extra = homes.length - perBand * 3;
      const segments = sampleBandSegments([
        perBand + (extra > 0 ? 1 : 0),
        perBand + (extra > 1 ? 1 : 0),
        perBand,
      ]);

      // Each slot owns a vertical strip of its band, from halfway to the
      // previous slot to halfway to the next — together they tile the exact
      // logo shape. A hair of overlap hides the seams while they land.
      const strips = segments.map((segment, index) => {
        const before = segments[index - 1];
        const after = segments[index + 1];
        const overlap = 0.06;
        return {
          x0: before?.band === segment.band ? (before.x + segment.x) / 2 - overlap : -1,
          x1: after?.band === segment.band ? (segment.x + after.x) / 2 + overlap : LOGO_VIEWBOX.width + 1,
        };
      });

      // Pair pieces with slots by angle around the centre, so everything
      // flies roughly straight in instead of crossing the page.
      const angleFrom = (x: number, y: number) =>
        Math.atan2(y - mark.cy, x - mark.cx);
      const homeOrder = homes
        .map((block, index) => ({ index, angle: angleFrom(block.x + block.w / 2, block.y + block.h / 2) }))
        .sort((a, b) => a.angle - b.angle);
      const slotOrder = segments
        .map((segment, index) => ({
          index,
          angle: angleFrom(mark.left + segment.x * scale, mark.top + segment.y * scale),
        }))
        .sort((a, b) => a.angle - b.angle);

      const previous = pieces;
      pieces = new Array(homes.length);
      homeOrder.forEach(({ index }, order) => {
        const block = homes[index];
        const slot = slotOrder[order]?.index ?? 0;
        const segment = segments[slot];
        const old = previous[index];
        // In flight a piece is a compact bead lined up with its band.
        const bead = segment.length * scale * 0.9;
        pieces[index] = {
          band: segment.band,
          rank: 0,
          shape: block.shape,
          home: {
            x: block.x + block.w / 2,
            y: block.y + block.h / 2,
            w: block.w,
            h: block.h,
            color: block.color,
          },
          target: {
            x: mark.left + segment.x * scale,
            y: mark.top + segment.y * scale,
            w: bead,
            h: Math.min(bead * 0.62, segment.thickness * scale),
            angle: segment.angle,
            ...strips[slot],
          },
          t: old?.t ?? 1,
          goal: old?.goal ?? 1,
          departAt: old?.departAt ?? 0,
          bow: noise(index + 1) > 0.5 ? 1 : -1,
          pulseAt: -Infinity,
        };
      });

      // Rank pieces along their band (left to right) for the sweep.
      for (let band = 0; band < 3; band++) {
        pieces
          .filter((piece) => piece.band === band)
          .sort((a, b) => a.target.x - b.target.x)
          .forEach((piece, rank) => {
            piece.rank = rank;
          });
      }

      if (cursors.length === 0) {
        cursors = STUDIO_PEOPLE.map((person, index) => ({
          person,
          index,
          x: width / 2,
          y: height / 2,
          from: { x: width / 2, y: height / 2 },
          to: { x: width / 2, y: height / 2 },
          moveStart: 0,
          moveDuration: 1,
          restUntil: 0,
          clickAt: -Infinity,
          piece: null,
        }));
      }
      const now = performance.now();
      cursors.forEach((cursor) => {
        sendCursor(cursor, now);
        if (reducedMotion || now - start < 50) {
          cursor.x = cursor.to.x;
          cursor.y = cursor.to.y;
          cursor.moveDuration = 1;
        }
      });

      props.current.onLayout?.({
        centerY: wide ? height * 0.5 : (artifacts[0].rect.y + artifacts[0].rect.h + artifacts[2].rect.y) / 2,
        markTop: mark.top,
        markBottom: mark.top + markHeight,
      });
    }

    /** Points a cursor at its next spot: a piece of work, or around the mark. */
    function sendCursor(cursor: Cursor, now: number) {
      let to: { x: number; y: number };
      cursor.piece = null;

      if (merged) {
        // Everyone gathers round to look at what they made.
        const angle = -Math.PI / 2 + (cursor.index / cursors.length) * Math.PI * 2 + 0.3;
        to = {
          x: mark.cx + Math.cos(angle) * mark.width * 0.78,
          y: mark.cy + Math.sin(angle) * mark.height * 0.92,
        };
      } else {
        // Mostly their own track's work, sometimes helping on another.
        const own = artifacts.find((artifact) => artifact.track === cursor.person.track);
        const elsewhere = noise(now * 0.001 + cursor.index) < 0.2;
        const artifact = elsewhere
          ? artifacts[Math.floor(noise(now + cursor.index * 3) * artifacts.length)]
          : own ?? artifacts[0];
        const offset = artifacts.indexOf(artifact);
        const before = artifacts
          .slice(0, offset)
          .reduce((count, item) => count + item.blocks.length, 0);
        const pick = Math.floor(noise(now * 0.37 + cursor.index * 11) * artifact.blocks.length);
        const piece = pieces[before + pick];
        cursor.piece = before + pick;
        to = {
          x: (piece?.home.x ?? artifact.rect.x) + (noise(now + cursor.index) - 0.5) * 12,
          y: (piece?.home.y ?? artifact.rect.y) + (noise(now * 2 + cursor.index) - 0.5) * 8,
        };
      }

      cursor.from = { x: cursor.x, y: cursor.y };
      cursor.to = to;
      cursor.moveStart = now;
      const distance = Math.hypot(to.x - cursor.x, to.y - cursor.y);
      cursor.moveDuration = merged ? 700 + cursor.index * 40 : Math.min(500 + distance * 1.4, 1800);
      cursor.restUntil =
        now + cursor.moveDuration + (merged ? Infinity : 900 + noise(now + cursor.index * 5) * 1800);
      cursor.clickAt = -Infinity;
    }

    function setReveal(level: number) {
      if (level === revealLevel) return;
      revealLevel = level;
      props.current.onReveal?.(level);
    }

    function step(now: number, dt: number) {
      for (const piece of pieces) {
        if (now < piece.departAt || piece.t === piece.goal) continue;
        const delta = (dt * 16.667) / FLIGHT_MS;
        piece.t = piece.goal === 1 ? Math.min(piece.t + delta, 1) : Math.max(piece.t - delta, 0);
      }

      // Bands count as formed once every piece in them has landed.
      let level = 0;
      if (merged) {
        for (let band = 0; band < 3; band++) {
          if (pieces.some((piece) => piece.band === band && piece.t < 1)) break;
          level++;
        }
      }
      setReveal(level);
      if (level === 3 && formedAt === 0) formedAt = now;
      if (level < 3) formedAt = 0;

      for (let band = 0; band < 3; band++) {
        const goal = band < level ? 1 : 0;
        // Snap in quickly once landed; let go a touch faster still.
        const rate = (dt * 16.667) / (goal ? 260 : 160);
        solid[band] = goal ? Math.min(solid[band] + rate, 1) : Math.max(solid[band] - rate, 0);
      }

      const mean = pieces.reduce((sum, piece) => sum + easeInOut(piece.t), 0) / (pieces.length || 1);
      formation = mean;

      for (const cursor of cursors) {
        const progress = Math.min((now - cursor.moveStart) / cursor.moveDuration, 1);
        const eased = easeInOut(progress);
        cursor.x = mix(cursor.from.x, cursor.to.x, eased);
        cursor.y = mix(cursor.from.y, cursor.to.y, eased);

        // Arrived: click the piece it came to work on, now and then.
        if (!merged && progress === 1 && cursor.clickAt === -Infinity && cursor.piece !== null) {
          if (noise(now + cursor.index * 13) < 0.55) {
            cursor.clickAt = now;
            const piece = pieces[cursor.piece];
            if (piece && piece.t === 0) piece.pulseAt = now;
          } else {
            cursor.clickAt = 0;
          }
        }
        if (!merged && now > cursor.restUntil) sendCursor(cursor, now);
      }
    }

    function fill(color: Rgb, toBrand: number) {
      const [r, g, b] = color.map((channel, i) => Math.round(mix(channel, PALETTE.brand[i], toBrand)));
      return `rgb(${r}, ${g}, ${b})`;
    }

    function drawPiece(piece: Piece, now: number) {
      const e = easeInOut(piece.t);
      const { home, target } = piece;

      // Fly along a gentle bow rather than a straight line.
      const dx = target.x - home.x;
      const dy = target.y - home.y;
      const distance = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(Math.PI * e) * Math.min(distance * 0.12, 60) * piece.bow;
      const x = mix(home.x, target.x, e) + (-dy / distance) * arc;
      const y = mix(home.y, target.y, e) + (dx / distance) * arc;

      const pulse = Math.max(0, 1 - (now - piece.pulseAt) / 260);
      const grow = 1 + Math.sin(pulse * Math.PI) * 0.12;
      const w = mix(home.w, target.w, e) * grow;
      const h = mix(home.h, target.h, e) * grow;
      const angle = mix(0, target.angle, e);

      const homeRadius =
        piece.shape === "rect" ? Math.min(4, Math.min(home.w, home.h) / 2) : Math.min(w, h) / 2;
      const radius = mix(homeRadius, Math.min(w, h) / 2, e);

      // Over the last stretch of the flight the bead becomes its exact strip
      // of the real band, so the mark is right while it's still assembling.
      const landing = Math.min(Math.max((e - 0.86) / 0.14, 0), 1);
      // Strips tile the exact shape, so they stay fully opaque and the solid
      // band simply seals over them; once it's fully in, they're not needed.
      if (solid[piece.band] >= 1) return;
      const visible = 1;

      if (landing < 1) {
        ctx!.save();
        ctx!.translate(x, y);
        ctx!.rotate(angle);
        ctx!.beginPath();
        ctx!.roundRect(-w / 2, -h / 2, w, h, Math.min(radius, w / 2, h / 2));
        ctx!.fillStyle = fill(home.color, e);
        ctx!.globalAlpha = visible * (1 - landing);
        ctx!.fill();
        ctx!.restore();
      }

      if (landing > 0) {
        const scale = mark.width / LOGO_VIEWBOX.width;
        const grow = mix(0.85, 1, landing);
        ctx!.save();
        ctx!.globalAlpha = visible * landing;
        ctx!.translate(x, y);
        ctx!.scale(grow, grow);
        ctx!.translate(-target.x, -target.y);
        ctx!.translate(mark.left, mark.top);
        ctx!.scale(scale, scale);
        ctx!.beginPath();
        ctx!.rect(target.x0, -1, target.x1 - target.x0, LOGO_VIEWBOX.height + 2);
        ctx!.clip();
        ctx!.fillStyle = `rgb(${PALETTE.brand.join(", ")})`;
        ctx!.fill(bandPaths[piece.band]);
        ctx!.restore();
      }
    }

    /** The exact bands from the logo SVG, faded in over the landed pieces. */
    function drawSolidMark() {
      if (solid.every((value) => value === 0)) return;
      ctx!.save();
      ctx!.translate(mark.left, mark.top);
      const scale = mark.width / LOGO_VIEWBOX.width;
      ctx!.scale(scale, scale);
      ctx!.fillStyle = `rgb(${PALETTE.brand.join(", ")})`;
      bandPaths.forEach((path, band) => {
        if (solid[band] === 0) return;
        ctx!.globalAlpha = solid[band];
        ctx!.fill(path);
      });
      ctx!.restore();
    }

    /** The "\ | /" marks the illustrations use for a moment of energy. */
    function drawBurst(now: number) {
      if (formedAt === 0) return;
      const t = Math.min((now - formedAt) / 420, 1);
      const grow = easeOutBack(t);
      const ox = mark.left + mark.width * 1.04;
      const oy = mark.top - mark.height * 0.05;
      const gap = mark.width * 0.03;
      const length = mark.width * 0.08 * grow;

      ctx!.save();
      ctx!.globalAlpha = t;
      ctx!.strokeStyle = PALETTE.ink;
      ctx!.lineWidth = 2;
      ctx!.lineCap = "round";
      for (const angle of [-0.35, -0.95, -1.55]) {
        ctx!.beginPath();
        ctx!.moveTo(ox + Math.cos(angle) * gap, oy + Math.sin(angle) * gap);
        ctx!.lineTo(ox + Math.cos(angle) * (gap + length), oy + Math.sin(angle) * (gap + length));
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawCursor(cursor: Cursor, now: number) {
      const staff = isStaff(cursor.person);
      const color = staff ? `rgb(${PALETTE.brand.join(",")})` : PALETTE.ink;

      // Click ripple.
      const ripple = (now - cursor.clickAt) / 450;
      if (ripple >= 0 && ripple < 1) {
        ctx!.beginPath();
        ctx!.arc(cursor.x, cursor.y, 6 + ripple * 14, 0, Math.PI * 2);
        ctx!.globalAlpha = 1 - ripple;
        ctx!.strokeStyle = color;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      ctx!.save();
      ctx!.translate(cursor.x, cursor.y);

      // Arrow.
      ctx!.beginPath();
      ctx!.moveTo(0, 0);
      ctx!.lineTo(0, 16);
      ctx!.lineTo(4.2, 12.2);
      ctx!.lineTo(7, 18.5);
      ctx!.lineTo(9.6, 17.4);
      ctx!.lineTo(6.9, 11.3);
      ctx!.lineTo(12.2, 11.3);
      ctx!.closePath();
      ctx!.fillStyle = color;
      ctx!.fill();
      ctx!.lineWidth = 1.25;
      ctx!.strokeStyle = PALETTE.white;
      ctx!.lineJoin = "round";
      ctx!.stroke();

      // Name tag.
      const label = tagFor(cursor.person);
      ctx!.font = `600 12px ${fonts.sans}`;
      const tagW = ctx!.measureText(label).width + 14;
      const tagH = 22;
      ctx!.beginPath();
      ctx!.roundRect(10, 18, tagW, tagH, 6);
      ctx!.fillStyle = staff ? color : PALETTE.white;
      ctx!.fill();
      if (!staff) {
        ctx!.lineWidth = 1.25;
        ctx!.strokeStyle = PALETTE.ink;
        ctx!.stroke();
      }
      ctx!.fillStyle = staff ? PALETTE.white : PALETTE.ink;
      ctx!.textAlign = "left";
      ctx!.textBaseline = "middle";
      ctx!.fillText(label, 17, 18 + tagH / 2 + 0.5);

      ctx!.restore();
    }

    function draw(now: number) {
      ctx!.clearRect(0, 0, width, height);

      // Cards and their labels fade back while their pieces are away.
      const cardAlpha = 1 - formation * 0.82;
      for (const artifact of artifacts) {
        ctx!.save();
        ctx!.globalAlpha = cardAlpha;
        ctx!.font = `500 11px ${fonts.mono}`;
        ctx!.fillStyle = PALETTE.muted;
        ctx!.textAlign = "left";
        ctx!.textBaseline = "alphabetic";
        ctx!.fillText(artifact.label, artifact.rect.x + 2, artifact.rect.y - 9);
        artifact.decorate(ctx!, fonts);
        ctx!.restore();
      }

      // Pieces in flight on top of everything at rest.
      const resting = pieces.filter((piece) => piece.t === 0);
      const moving = pieces.filter((piece) => piece.t > 0);
      for (const piece of resting) drawPiece(piece, now);
      for (const piece of moving) drawPiece(piece, now);
      drawSolidMark();

      drawBurst(now);
      for (const cursor of cursors) drawCursor(cursor, now);
    }

    function hold() {
      if (props.current.paused) return;
      held = true;
      if (merged) return;
      setMerged(true, performance.now());
      canvas!.style.cursor = "grabbing";
      if (reducedMotion) settle();
    }

    function release() {
      held = false;
      // During the opening the intro timer unpacks the studio itself.
      if (!merged || performance.now() - start < INTRO_MS) return;
      setMerged(false, performance.now());
      canvas!.style.cursor = "grab";
      if (reducedMotion) settle();
    }

    /** Reduced motion: jump straight to the end state, no flight. */
    function settle() {
      const now = performance.now();
      for (const piece of pieces) {
        piece.t = piece.goal;
        piece.departAt = now;
      }
      for (const cursor of cursors) {
        cursor.x = cursor.to.x;
        cursor.y = cursor.to.y;
        cursor.moveDuration = 1;
      }
      step(now, 0);
      solid.fill(merged ? 1 : 0);
      draw(now);
    }

    function onPointerDown(event: PointerEvent) {
      canvas!.setPointerCapture(event.pointerId);
      hold();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== " " || event.repeat || isTypingTarget(event.target)) return;
      if (props.current.paused) return;
      event.preventDefault();
      hold();
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === " ") release();
    }

    layout();

    let frame = 0;
    let last = performance.now();
    function loop(now: number) {
      // Measured in 60fps frames, capped so a backgrounded tab doesn't jump.
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;
      step(now, dt);
      draw(now);
      frame = requestAnimationFrame(loop);
    }

    let introTimer = 0;
    if (reducedMotion) {
      setMerged(false, start);
      settle();
    } else {
      // Arrive as the exact mark, then unpack into the studio.
      merged = true;
      solid.fill(1);
      props.current.onMergeChange?.(true);
      introTimer = window.setTimeout(() => {
        // Someone already pressing gets to keep the mark.
        if (!held) setMerged(false, performance.now());
      }, INTRO_MS);
      frame = requestAnimationFrame(loop);
    }

    const resizeObserver = new ResizeObserver(() => {
      layout();
      if (reducedMotion) settle();
    });
    resizeObserver.observe(canvas);

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", release);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(introTimer);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", release);
      canvas.removeEventListener("pointercancel", release);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", release);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="The Rise studio: a design file, a web page, a code editor and a phone app, each being worked on by instructors, mentors and students. Press and hold, or hold Space, to bring all the work together into the Rise logo."
      className="absolute inset-0 h-full w-full touch-none select-none"
    />
  );
}
