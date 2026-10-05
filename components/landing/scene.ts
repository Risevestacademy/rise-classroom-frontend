/**
 * The landing page canvas. One teal piece is the student: it starts inside
 * the Rise mark, joins a grey cohort, picks a track, becomes a design file, a
 * web page, an API and an app, gets taught, gets a mentor, gets paid, ships
 * with the other tracks, and finally flies home into the mark.
 *
 * Everything drawn is a pure function of scroll progress (0..1), plus a little
 * idle motion from `time` that is switched off for reduced motion.
 */

import {
  LOGO_BANDS,
  LOGO_VIEWBOX,
  renderStrip,
  sampleBandStrips,
  type BandStrip,
} from "@/components/home/logo-bands";
import {
  chapterSpans,
  clamp01,
  easeInOutCubic,
  easeInOutSine,
  easeOutBack,
  easeOutCubic,
  lerp,
  locate,
  ramp,
  stagger,
  staggerAt,
} from "@/lib/landing-timeline";

import { CHAPTERS, type ChapterId, type CopyAlign } from "./story";

export type Scene = {
  resize(): void;
  draw(progress: number, time: number): void;
  /**
   * Where the mark should land at the very end: the logo-sized gap in the
   * application heading, as its centre and height in canvas pixels.
   */
  setSlot(slot: { x: number; y: number; height: number } | null): void;
};

/* ------------------------------------------------------------------ */
/* Story position                                                     */
/* ------------------------------------------------------------------ */

export const SPANS = chapterSpans(CHAPTERS.map((chapter) => chapter.screens));

/**
 * Where reduced motion parks each chapter: the logo whole in the hero, the
 * mark sealed in week 52, and everything else fully built with its copy up.
 */
const REST: Partial<Record<ChapterId, number>> = { hero: 0, home: 0.95, end: 1 };

/** Which chapter we're in and how far through it, for the canvas and copy. */
export function storyPosition(progress: number, reduced: boolean) {
  const { index, local } = locate(SPANS, progress);
  if (!reduced) return { index, local };
  return { index, local: REST[CHAPTERS[index].id] ?? 0.75 };
}

const INDEX = Object.fromEntries(CHAPTERS.map((chapter, i) => [chapter.id, i])) as Record<
  ChapterId,
  number
>;

/* ------------------------------------------------------------------ */
/* Colours                                                            */
/* ------------------------------------------------------------------ */

type RGB = readonly [number, number, number];

const INK: RGB = [17, 24, 25];
const TEAL: RGB = [13, 109, 120];
const GREY: RGB = [203, 213, 214];
const WHITE: RGB = [255, 255, 255];

const C = {
  ink: "#111819",
  ink2: "#344043",
  muted: "#647274",
  line: "#CBD5D6",
  faint: "#E2E8E8",
  wash: "#F1F4F4",
  paper: "#F8FAFA",
  teal: "#0D6D78",
  tint: "#E8F5F6",
  tint2: "#B4D2D5",
  white: "#FFFFFF",
} as const;

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

function rgba(c: RGB, a: number) {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp01(a)})`;
}

function mixRGB(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

type Point = { x: number; y: number };
/** Where the logo sits: top-left corner and viewBox-to-pixel scale. */
type Frame = { x: number; y: number; k: number };
type Box = { x: number; y: number; w: number; h: number; r: number };

type Layout = {
  w: number;
  h: number;
  mobile: boolean;
  /** The unit everything on stage is sized in. */
  s: number;
  /** Scale for strokes and canvas type. */
  px: number;
  hero: Frame;
  end: Frame;
  anchors: Record<CopyAlign, Point>;
};

function logoFrame(cx: number, cy: number, height: number): Frame {
  const k = height / LOGO_VIEWBOX.height;
  return { x: cx - (LOGO_VIEWBOX.width * k) / 2, y: cy - height / 2, k };
}

function computeLayout(w: number, h: number): Layout {
  const mobile = w < 768;
  const ratio = LOGO_VIEWBOX.height / LOGO_VIEWBOX.width;
  const s = mobile ? Math.min(w * 0.36, h * 0.19) : Math.min(w * 0.17, h * 0.27);
  const px = Math.min(Math.max(Math.min(w, h) / 900, 0.7), 1.3);

  const centre = { x: w / 2, y: h * 0.36 };
  return {
    w,
    h,
    mobile,
    s,
    px,
    // The hero copy sits left on desktop and at the bottom on phones, so the
    // mark takes the other side and never runs under the type.
    hero: mobile
      ? logoFrame(w / 2, h * 0.3, Math.min(h * 0.2, w * 0.55 * ratio))
      : logoFrame(w * 0.71, h * 0.5, Math.min(h * 0.5, w * 0.34 * ratio)),
    end: mobile
      ? logoFrame(w / 2, h * 0.33, Math.min(h * 0.2, w * 0.5 * ratio))
      : logoFrame(w / 2, h * 0.38, Math.min(h * 0.34, w * 0.3 * ratio)),
    // Copy on the left puts the student on the right, and so on.
    anchors: mobile
      ? { left: centre, right: centre, top: centre, bottom: centre }
      : {
          left: { x: w * 0.69, y: h * 0.53 },
          right: { x: w * 0.31, y: h * 0.53 },
          top: { x: w * 0.5, y: h * 0.62 },
          bottom: { x: w * 0.5, y: h * 0.42 },
        },
  };
}

/* ------------------------------------------------------------------ */
/* Pieces                                                             */
/* ------------------------------------------------------------------ */

/** Pieces 0..COHORT-1 are the cohort; piece 0 is the student. */
const COHORT = 60;

type Piece = {
  /** The slice of the mark this piece is. */
  seg: BandStrip;
  /** Five stable random numbers. */
  r: [number, number, number, number, number];
  /** Place in line when the mark bursts, from the centre outwards. */
  order: number;
  teal: boolean;
  dot: boolean;
};

type Pose = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rotation, radians. */
  a: number;
  /** Corner radius as a share of the short side (0.5 is a capsule). */
  r: number;
  c: RGB;
  o: number;
  /** 1 draws the piece as its slice of the mark, 0 as a plain capsule. */
  m: number;
};

function rand(i: number, salt: number) {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function buildPieces(segments: BandStrip[]): Piece[] {
  const cx = LOGO_VIEWBOX.width / 2;
  const cy = LOGO_VIEWBOX.height / 2;
  const far = Math.hypot(cx, cy);

  return segments.map((seg, i) => {
    const r: Piece["r"] = [rand(i, 1), rand(i, 2), rand(i, 3), rand(i, 4), rand(i, 5)];
    const distance = Math.hypot(seg.x - cx, seg.y - cy) / far;
    return {
      seg,
      r,
      order: clamp01(distance * 0.85 + r[0] * 0.15),
      teal: i === 0 || r[1] < 0.32,
      dot: r[2] < 0.3,
    };
  });
}

function mixPose(a: Pose | null, b: Pose | null, t: number): Pose | null {
  if (!a && !b) return null;
  if (!a) return { ...b!, o: b!.o * t };
  if (!b) return { ...a, o: a.o * (1 - t) };
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    w: lerp(a.w, b.w, t),
    h: lerp(a.h, b.h, t),
    a: lerp(a.a, b.a, t),
    r: lerp(a.r, b.r, t),
    c: mixRGB(a.c, b.c, t),
    o: lerp(a.o, b.o, t),
    m: lerp(a.m, b.m, t),
  };
}

/* ------------------------------------------------------------------ */
/* Drawing helpers                                                    */
/* ------------------------------------------------------------------ */

type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (w <= 0 || h <= 0) return;
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

function fillRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function quad(a: Point, c: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

/** Strokes the first `reveal` of a quadratic curve. */
function strokeQuad(ctx: Ctx, a: Point, c: Point, b: Point, reveal: number) {
  if (reveal <= 0) return;
  const steps = 32;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  for (let k = 1; k <= steps; k++) {
    const p = quad(a, c, b, (k / steps) * reveal);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

function strokeLine(ctx: Ctx, a: Point, b: Point) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

/* ------------------------------------------------------------------ */
/* The scene                                                          */
/* ------------------------------------------------------------------ */

/** The student's own shape, in units of `s` from the chapter's anchor. */
type Form = { device: boolean; x: number; y: number; w: number; h: number; r: number };

const PERSON = { w: 0.07, h: 0.18 };

/** The three doors after graduation, in units of `s`: size, spacing, and where the student stands. */
const DOOR = { w: 0.54, h: 0.82, gap: 0.7, studentY: 0.56 };

/** Which door each chapter is about; -1 is none yet. */
const DOOR_FOCUS: Partial<Record<ChapterId, number>> = { next: -1, rise: 0, partner: 1, own: 2 };

function formFor(id: ChapterId, local: number): Form | null {
  const person = (x: number, y: number, w = PERSON.w, h = PERSON.h): Form => ({
    device: false,
    x,
    y,
    w,
    h,
    r: 0.5,
  });
  const device = (x: number, y: number, w: number, h: number, r: number): Form => ({
    device: true,
    x,
    y,
    w,
    h,
    r,
  });

  switch (id) {
    case "join":
      return person(0, 0);
    case "track":
      return person(0, 0.62);
    case "design":
    case "frontend":
      return device(0, 0, 1.5, 1, 0.045);
    case "backend":
      return device(0, -0.45, 1.15, 0.72, 0.04);
    case "mobile":
      return device(0, 0, 0.56, 1.12, 0.09);
    case "taught":
      return person(0.42, 0.3, 0.1, 0.26);
    case "mentor":
      return person(0.12 + easeInOutCubic(ramp(local, 0.3, 1)) * 0.35, 0.2, 0.1, 0.26);
    // The student walks up to whichever door the copy is about.
    case "next":
    case "partner":
      return person(0, DOOR.studentY, 0.08, 0.2);
    case "rise":
      return person(-DOOR.gap, DOOR.studentY, 0.08, 0.2);
    case "own":
      return person(DOOR.gap, DOOR.studentY, 0.08, 0.2);
    default:
      return null;
  }
}

type Painter = (ctx: Ctx, box: Box, build: number, alpha: number, time: number) => void;

type EnvArgs = { A: Point; alpha: number; local: number; time: number };

export function createScene(canvas: HTMLCanvasElement, { reduced }: { reduced: boolean }): Scene | null {
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) return null;
  const ctx: Ctx = maybeCtx;

  const sans = getComputedStyle(canvas).fontFamily || "system-ui, sans-serif";
  const bandPaths = LOGO_BANDS.map((d) => new Path2D(d));

  let dpr = 1;
  let L: Layout = computeLayout(1, 1);
  const pieceSets: Partial<Record<"mobile" | "desktop", Piece[]>> = {};
  let pieces: Piece[] = [];
  /** Each piece's slice of the mark, painted once per size, in teal and grey. */
  let sprites: { teal: HTMLCanvasElement; grey: HTMLCanvasElement }[] = [];

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    L = computeLayout(w, h);

    const key = L.mobile ? "mobile" : "desktop";
    pieceSets[key] ??= buildPieces(sampleBandStrips(L.mobile ? [40, 32, 26] : [64, 52, 42]));
    pieces = pieceSets[key];
    const unit = Math.max(L.hero.k, L.end.k) * dpr;
    sprites = pieces.map((piece) => ({
      teal: renderStrip(piece.seg, unit, C.teal),
      grey: renderStrip(piece.seg, unit, C.line),
    }));
  }

  function anchor(index: number): Point {
    return L.anchors[CHAPTERS[index].align];
  }

  function font(size: number, weight = 600, family = sans) {
    return `${weight} ${size * L.px}px ${family}`;
  }

  function text(
    value: string,
    x: number,
    y: number,
    size: number,
    color: string,
    { weight = 600, align = "left", family = sans }: { weight?: number; align?: CanvasTextAlign; family?: string } = {}
  ) {
    ctx.font = font(size, weight, family);
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  function drawLogo(frame: Frame, fill: string) {
    ctx.save();
    ctx.translate(frame.x, frame.y);
    ctx.scale(frame.k, frame.k);
    ctx.fillStyle = fill;
    for (const path of bandPaths) ctx.fill(path);
    ctx.restore();
  }

  /* ---------------- particle poses ---------------- */

  function logoPose(p: Piece, frame: Frame): Pose {
    const { seg } = p;
    return {
      x: frame.x + seg.x * frame.k,
      y: frame.y + seg.y * frame.k,
      w: seg.w * frame.k,
      h: seg.h * frame.k,
      a: 0,
      r: 0,
      c: TEAL,
      o: 1,
      m: 1,
    };
  }

  /** A loose shard of the mark, smaller, tilted and floating free. */
  function scatterPose(p: Piece, drift: number): Pose {
    const [r0, r1, r2, r3, r4] = p.r;
    const shrink = 0.28 + r3 * 0.32;
    return {
      x: (0.04 + r4 * 0.92) * L.w,
      y: (0.06 + r2 * 0.88) * L.h - drift * L.h * 0.22 * (0.4 + r0),
      w: p.seg.w * L.hero.k * shrink * 1.5,
      h: p.seg.h * L.hero.k * shrink,
      a: (r0 - 0.5) * 1.4 + (r1 - 0.5) * 0.4,
      r: 0.3,
      c: p.teal ? TEAL : GREY,
      o: 0.92,
      m: 1,
    };
  }

  function heroPose(i: number, local: number, time: number): Pose {
    const p = pieces[i];
    const logo = logoPose(p, L.hero);
    // First the solid mark loosens into slats (the gaps open slowly), then
    // they drift apart from the centre outwards. Long, overlapping windows
    // so it never snaps.
    const loosen = easeInOutSine(ramp(local, 0.02, 0.2));
    logo.w *= lerp(1, 0.72, loosen);
    const burst = easeInOutSine(staggerAt(ramp(local, 0.12, 0.88), p.order, 0.55));
    const scatter = scatterPose(p, easeInOutSine(ramp(local, 0.3, 1)) * 0.6);
    scatter.y += Math.sin(time * 1.2 + p.r[0] * 6) * 3 * L.px;

    const pose = mixPose(logo, scatter, burst)!;
    pose.y -= Math.sin(burst * Math.PI) * L.s * 0.35 * (0.3 + p.r[3]);
    pose.a += burst * (1 - burst) * (p.r[4] - 0.5) * 4;
    return pose;
  }

  function crowdPose(i: number, time: number, A: Point): Pose | null {
    const s = L.s;
    // The student is the card, standing in the middle.
    if (i === 0) return null;
    // A golden-angle spiral, with a little room left around the student.
    const radius = Math.sqrt((i + 0.8) / (COHORT + 0.8)) * s * (L.mobile ? 1 : 1.05);
    const angle = i * 2.39996;
    return {
      x: A.x + Math.cos(angle) * radius * 1.3,
      y: A.y + Math.sin(angle) * radius * 0.85 + Math.sin(time * 1.5 + i) * 0.8 * L.px,
      w: 0.05 * s,
      h: 0.13 * s,
      a: 0,
      r: 0.5,
      c: GREY,
      o: 1,
      m: 0,
    };
  }

  function forkPoints(A: Point) {
    const s = L.s;
    const origin = { x: A.x, y: A.y + 0.62 * s };
    return [-1.2, -0.4, 0.4, 1.2].map((dx) => {
      const end = { x: A.x + dx * 0.85 * s, y: A.y - 0.62 * s };
      const control = { x: A.x + dx * 0.85 * s * 0.1, y: A.y };
      return { origin, control, end };
    });
  }

  function trackPose(i: number, local: number, A: Point): Pose {
    const p = pieces[i];
    const fork = forkPoints(A)[i % 4];
    const along = ramp(local, 0.1 + p.r[0] * 0.2, 0.7 + p.r[0] * 0.2) * (0.3 + 0.65 * p.r[1]);
    const at = quad(fork.origin, fork.control, fork.end, along);
    const side = (p.r[2] - 0.5) * 0.14 * L.s;
    return {
      x: at.x + side,
      y: at.y + (p.r[3] - 0.5) * 0.08 * L.s,
      w: 0.035 * L.s,
      h: 0.09 * L.s,
      a: 0,
      r: 0.5,
      c: GREY,
      o: 1,
      m: 0,
    };
  }

  function instructorAt(A: Point): Point {
    return { x: A.x - 0.5 * L.s, y: A.y - 0.12 * L.s };
  }

  function listenPose(i: number, A: Point): Pose {
    const I = instructorAt(A);
    const row = i % 3;
    const seat = Math.floor(i / 3) / Math.ceil(COHORT / 3);
    const radius = (0.62 + row * 0.2) * L.s;
    const angle = lerp(-0.25, 1.85, seat);
    return {
      x: I.x + Math.cos(angle) * radius * 1.15,
      y: I.y + 0.1 * L.s + Math.sin(angle) * radius * 0.75,
      w: 0.035 * L.s,
      h: 0.09 * L.s,
      a: 0,
      r: 0.5,
      c: GREY,
      o: 1,
      m: 0,
    };
  }

  /** Where piece `i` rests in chapter `index` at `local`; null if it's off stage. */
  function settled(index: number, i: number, local: number, time: number): Pose | null {
    const id = CHAPTERS[index].id;
    const A = anchor(index);
    switch (id) {
      case "hero":
        return heroPose(i, local, time);
      case "join":
        return i < COHORT ? crowdPose(i, time, A) : null;
      case "track":
        return i > 0 && i < COHORT ? trackPose(i, local, A) : null;
      case "taught":
        return i > 0 && i < COHORT ? listenPose(i, A) : null;
      default:
        return null;
    }
  }

  /** The doors break into pieces, and the pieces fly home into the mark. */
  function homePose(i: number, local: number): Pose | null {
    const p = pieces[i];
    const [r0, r1, r2, r3, r4] = p.r;
    const B = anchor(INDEX.own);
    const s = L.s;

    const appear = ramp(local, r2 * 0.1, 0.08 + r2 * 0.1);
    // The pieces stay until the solid mark has fully faded in over them.
    const fade = 1 - ramp(local, 0.82, 0.94);
    if (appear * fade <= 0) return null;

    // Start inside one of the three doors.
    const door = i % 3;
    const start: Pose = {
      x: B.x + (door - 1) * DOOR.gap * s + (r0 - 0.5) * DOOR.w * s * 0.9,
      y: B.y + (r1 - 0.5) * DOOR.h * s * 0.9,
      w: p.seg.w * L.end.k * (0.7 + r3 * 0.4),
      h: p.seg.h * L.end.k * (0.35 + r3 * 0.25),
      a: (r4 - 0.5) * 0.6,
      r: 0.4,
      c: door === 0 || p.teal ? TEAL : GREY,
      o: 1,
      m: 1,
    };
    const fly = easeInOutSine(staggerAt(ramp(local, 0.08, 0.74), p.order, 0.55));
    const pose = mixPose(start, logoPose(p, L.end), fly)!;
    pose.c = mixRGB(start.c, TEAL, fly);
    pose.y -= Math.sin(fly * Math.PI) * 0.45 * s * (r3 - 0.25);
    pose.a += Math.sin(fly * Math.PI) * (r4 - 0.5) * 1.6;
    pose.o = appear * fade;
    return pose;
  }

  function drawPose(pose: Pose, i: number) {
    if (pose.o <= 0.003 || pose.w <= 0 || pose.h <= 0) return;
    const cos = Math.cos(pose.a);
    const sin = Math.sin(pose.a);
    ctx.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * pose.x, dpr * pose.y);

    // As a slice of the mark: its real shape, blended from grey to teal.
    const sprite = sprites[i];
    if (pose.m > 0.01 && sprite) {
      const teal = clamp01((GREY[1] - pose.c[1]) / (GREY[1] - TEAL[1]));
      const x = -pose.w / 2;
      const y = -pose.h / 2;
      if (teal < 0.99) {
        ctx.globalAlpha = pose.o * pose.m * (1 - teal);
        ctx.drawImage(sprite.grey, x, y, pose.w, pose.h);
      }
      if (teal > 0.01) {
        ctx.globalAlpha = pose.o * pose.m * teal;
        ctx.drawImage(sprite.teal, x, y, pose.w, pose.h);
      }
      ctx.globalAlpha = 1;
    }
    // As a plain capsule, for the cohort.
    if (pose.m < 0.99) {
      const alpha = pose.o * (1 - pose.m);
      fillRound(ctx, -pose.w / 2, -pose.h / 2, pose.w, pose.h, Math.min(pose.w, pose.h) * pose.r, rgba(pose.c, alpha));
    }
  }

  function drawPieces(index: number, local: number, time: number) {
    const id = CHAPTERS[index].id;
    if (id === "end") return;

    for (let i = 0; i < pieces.length; i++) {
      let pose: Pose | null;
      if (id === "home") pose = homePose(i, local);
      else if (index === 0) pose = settled(0, i, local, time);
      else {
        const t = easeInOutSine(staggerAt(ramp(local, 0, 0.6), pieces[i].order, 0.5));
        pose = mixPose(settled(index - 1, i, 1, time), settled(index, i, local, time), t);
      }
      if (pose) drawPose(pose, i);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------------- the student card ---------------- */

  function youLabel(x: number, top: number, alpha: number) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const w = 34 * L.px;
    const h = 18 * L.px;
    const y = top - 10 * L.px - h;
    fillRound(ctx, x - w / 2, y, w, h, h / 2, C.teal);
    text("You", x, y + h / 2 + 0.5, 10.5, C.white, { align: "center" });
    ctx.restore();
  }

  function absForm(form: Form, A: Point): Box {
    const s = L.s;
    const w = form.w * s;
    const h = form.h * s;
    return { x: A.x + form.x * s - w / 2, y: A.y + form.y * s - h / 2, w, h, r: form.r * Math.min(w, h) };
  }

  function drawCard(index: number, local: number, time: number) {
    if (index < INDEX.track) return;
    const prevId = CHAPTERS[index - 1].id;
    const id = CHAPTERS[index].id;
    const fa = formFor(prevId, 1);
    const fb = formFor(id, local);
    if (!fa && !fb) return;

    const e = easeInOutSine(ramp(local, 0, 0.5));
    const ba = fa && absForm(fa, anchor(index - 1));
    const bb = fb && absForm(fb, anchor(index));

    let box: Box;
    let device: number;
    let alpha = 1;
    if (ba && bb) {
      box = { x: lerp(ba.x, bb.x, e), y: lerp(ba.y, bb.y, e), w: lerp(ba.w, bb.w, e), h: lerp(ba.h, bb.h, e), r: lerp(ba.r, bb.r, e) };
      device = lerp(fa!.device ? 1 : 0, fb!.device ? 1 : 0, e);
    } else if (ba) {
      box = ba;
      device = fa!.device ? 1 : 0;
      alpha = 1 - e;
    } else {
      box = bb!;
      device = fb!.device ? 1 : 0;
      alpha = e;
    }
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (device > 0.01) {
      ctx.save();
      ctx.shadowColor = rgba(INK, 0.12 * device);
      ctx.shadowBlur = 40 * L.px * device;
      ctx.shadowOffsetY = 18 * L.px * device;
      fillRound(ctx, box.x, box.y, box.w, box.h, box.r, rgba(mixRGB(TEAL, WHITE, device), 1));
      ctx.restore();
    } else {
      fillRound(ctx, box.x, box.y, box.w, box.h, box.r, C.teal);
    }
    if (device > 0.01) {
      roundRect(ctx, box.x, box.y, box.w, box.h, box.r);
      ctx.strokeStyle = rgba(INK, 0.9 * device);
      ctx.lineWidth = 1.5 * L.px;
      ctx.stroke();
    }

    // What's on the screen: the last chapter's work fades as the new one builds.
    ctx.save();
    roundRect(ctx, box.x, box.y, box.w, box.h, box.r);
    ctx.clip();
    const before = CONTENT[prevId];
    const now = CONTENT[id];
    if (before) before(ctx, box, 1, 1 - ramp(local, 0, 0.22), time);
    if (now) now(ctx, box, ramp(local, 0.36, 0.9), ramp(local, 0.3, 0.48), time);
    ctx.restore();

    if (id === "design") frameLabel(box, ramp(local, 0.3, 0.48));
    // At the doors the student stands right under them, so no tag there.
    if (device < 0.99 && DOOR_FOCUS[id] === undefined) youLabel(box.x + box.w / 2, box.y, 1 - device);

    ctx.restore();
  }

  function frameLabel(box: Box, alpha: number) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    text("Home — Desktop", box.x, box.y - 12 * L.px, 11, C.muted, { weight: 500 });
    ctx.restore();
  }

  /* ---------------- what the student builds ---------------- */

  function chrome(box: Box, url?: string) {
    const bar = Math.max(box.h * 0.1, 14 * L.px);
    ctx.fillStyle = C.wash;
    ctx.fillRect(box.x, box.y, box.w, bar);
    ctx.fillStyle = C.faint;
    ctx.fillRect(box.x, box.y + bar - 1, box.w, 1);
    const dot = bar * 0.16;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(box.x + bar * 0.5 + k * dot * 3, box.y + bar / 2, dot, 0, Math.PI * 2);
      ctx.fillStyle = C.line;
      ctx.fill();
    }
    if (url) {
      const w = box.w * 0.34;
      fillRound(ctx, box.x + box.w / 2 - w / 2, box.y + bar * 0.2, w, bar * 0.6, bar * 0.3, C.white);
      text(url, box.x + box.w / 2, box.y + bar / 2, Math.min(10, (bar * 0.42) / L.px), C.muted, {
        weight: 500,
        align: "center",
      });
    }
    return bar;
  }

  const design: Painter = (ctx, box, b, alpha, time) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const { x, y, w, h } = box;
    const pad = w * 0.06;

    const parts: Box[] = [
      { x: x + pad, y: y + pad, w: w - pad * 2, h: h * 0.07, r: 3 },
      { x: x + pad, y: y + h * 0.24, w: w * 0.44, h: h * 0.08, r: 3 },
      { x: x + pad, y: y + h * 0.35, w: w * 0.32, h: h * 0.08, r: 3 },
      { x: x + pad, y: y + h * 0.5, w: w * 0.18, h: h * 0.08, r: h * 0.04 },
      { x: x + w * 0.58, y: y + h * 0.22, w: w * 0.36, h: h * 0.38, r: 6 },
      { x: x + pad, y: y + h * 0.7, w: w * 0.27, h: h * 0.2, r: 6 },
      { x: x + pad + w * 0.3, y: y + h * 0.7, w: w * 0.27, h: h * 0.2, r: 6 },
      { x: x + pad + w * 0.6, y: y + h * 0.7, w: w * 0.28, h: h * 0.2, r: 6 },
    ];
    const fills = [C.wash, C.ink2, C.line, C.teal, C.tint, C.wash, C.wash, C.wash];

    parts.forEach((part, k) => {
      const g = easeOutCubic(stagger(b, k, parts.length, 0.7));
      fillRound(ctx, part.x, part.y, part.w * g, part.h, part.r * L.px, fills[k]);
    });

    // The image placeholder gets selected, the way it would in Figma.
    const sel = ramp(b, 0.55, 0.7);
    if (sel > 0) {
      const img = parts[4];
      ctx.globalAlpha = alpha * sel;
      ctx.strokeStyle = C.teal;
      ctx.lineWidth = 1.2 * L.px;
      ctx.strokeRect(img.x, img.y, img.w, img.h);
      const hs = 5 * L.px;
      for (const [hx, hy] of [
        [img.x, img.y],
        [img.x + img.w, img.y],
        [img.x, img.y + img.h],
        [img.x + img.w, img.y + img.h],
      ]) {
        ctx.fillStyle = C.white;
        ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
      }
      ctx.globalAlpha = alpha;
    }

    // The cursor follows the build from one element to the next.
    const step = Math.min(b * parts.length, parts.length - 0.001);
    const k = Math.floor(step);
    const from = parts[Math.max(k - 1, 0)];
    const to = parts[k];
    const t = easeInOutCubic(step - k);
    const cx = lerp(from.x + from.w, to.x + to.w, t) + Math.sin(time * 2) * 2 * L.px;
    const cy = lerp(from.y + from.h, to.y + to.h, t) + Math.cos(time * 1.7) * 2 * L.px;
    cursor(cx, cy);
    ctx.restore();
  };

  function cursor(x: number, y: number) {
    const u = L.px;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 16 * u);
    ctx.lineTo(x + 4.5 * u, y + 12 * u);
    ctx.lineTo(x + 11 * u, y + 12 * u);
    ctx.closePath();
    ctx.fillStyle = C.teal;
    ctx.fill();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1.2 * u;
    ctx.stroke();
    const tw = 30 * u;
    const th = 16 * u;
    fillRound(ctx, x + 10 * u, y + 15 * u, tw, th, th / 2, C.teal);
    text("You", x + 10 * u + tw / 2, y + 15 * u + th / 2 + 0.5, 9.5, C.white, { align: "center" });
  }

  const CODE: [number, string][][] = [
    [[0.18, C.tint2], [0.3, "#E2E8E8"]],
    [[0.08, C.line], [0.22, C.tint2], [0.2, "#7FC4CB"]],
    [[0.12, C.line], [0.4, "#E2E8E8"]],
    [[0.12, C.line], [0.18, "#7FC4CB"], [0.24, C.tint2]],
    [[0.2, C.line], [0.3, "#E2E8E8"]],
    [[0.12, C.line], [0.16, C.tint2], [0.34, "#7FC4CB"]],
    [[0.08, C.line], [0.26, "#E2E8E8"]],
    [[0.18, C.tint2]],
  ];

  const frontend: Painter = (ctx, box, b, alpha, time) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const bar = chrome(box, "rise.academy");
    const top = box.y + bar;
    const h = box.h - bar;
    const codeW = box.w * 0.4;

    // Code on the left, typing itself out.
    ctx.fillStyle = C.ink;
    ctx.fillRect(box.x, top, codeW, h);
    const lineH = h / (CODE.length + 2);
    const typed = b * CODE.length * 1.1;
    let caret: Point | null = null;
    CODE.forEach((tokens, row) => {
      const shown = clamp01(typed - row);
      if (shown <= 0) return;
      const indent = row > 0 && row < CODE.length - 1 ? codeW * 0.08 : 0;
      let cx = box.x + codeW * 0.1 + indent;
      const cy = top + lineH * (row + 1);
      const total = tokens.reduce((sum, [width]) => sum + width, 0);
      let left = shown * total;
      for (const [width, colour] of tokens) {
        const part = Math.min(width, left);
        if (part <= 0) break;
        fillRound(ctx, cx, cy, part * codeW, lineH * 0.42, 2, colour);
        cx += part * codeW + codeW * 0.03;
        left -= width;
      }
      caret = { x: cx, y: cy };
    });
    const at = caret as Point | null;
    if (at && b < 1 && Math.sin(time * 8) > -0.2) {
      ctx.fillStyle = "#7FC4CB";
      ctx.fillRect(at.x, at.y - lineH * 0.05, 1.5 * L.px, lineH * 0.52);
    }

    // The preview on the right pops in as the code lands.
    const px0 = box.x + codeW;
    const pw = box.w - codeW;
    const pop = (k: number) => easeOutBack(stagger(ramp(b, 0.15, 1), k, 6, 0.6));
    const item = (k: number, x: number, y: number, w: number, hh: number, r: number, fill: string) => {
      const g = pop(k);
      if (g <= 0) return;
      const cx = x + w / 2;
      const cy = y + hh / 2;
      fillRound(ctx, cx - (w * g) / 2, cy - (hh * g) / 2, w * g, hh * g, r, fill);
    };
    item(0, px0 + pw * 0.08, top + h * 0.08, pw * 0.84, h * 0.08, 3, C.wash);
    item(1, px0 + pw * 0.08, top + h * 0.24, pw * 0.6, h * 0.09, 3, C.ink2);
    item(2, px0 + pw * 0.08, top + h * 0.37, pw * 0.42, h * 0.07, 3, C.line);
    item(3, px0 + pw * 0.08, top + h * 0.5, pw * 0.26, h * 0.1, h * 0.05, C.teal);
    item(4, px0 + pw * 0.08, top + h * 0.68, pw * 0.4, h * 0.24, 6, C.tint);
    item(5, px0 + pw * 0.52, top + h * 0.68, pw * 0.4, h * 0.24, 6, C.wash);
    ctx.restore();
  };

  const backend: Painter = (ctx, box, b, alpha, time) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const bar = chrome(box, "rise.academy/cohort");
    const top = box.y + bar;
    const h = box.h - bar;
    const rows = 5;
    const rowH = h / (rows + 1);
    for (let k = 0; k < rows; k++) {
      const y = top + rowH * (k + 0.6);
      const loaded = ramp(b, 0.35 + k * 0.1, 0.45 + k * 0.1);
      const shimmer = 0.6 + 0.4 * Math.sin(time * 3 - k * 0.6);
      const r = rowH * 0.24;
      const cx = box.x + box.w * 0.08 + r;

      ctx.beginPath();
      ctx.arc(cx, y + rowH * 0.3, r, 0, Math.PI * 2);
      ctx.fillStyle = loaded > 0.5 ? (k === 0 ? C.teal : C.tint2) : rgba(GREY, 0.5 + 0.3 * shimmer);
      ctx.fill();

      const w1 = box.w * (0.32 + ((k * 37) % 20) / 100);
      const w2 = box.w * 0.22;
      const bx = cx + r * 2;
      fillRound(ctx, bx, y + rowH * 0.08, w1, rowH * 0.18, 2, rgba(GREY, (0.5 + 0.3 * shimmer) * (1 - loaded)));
      fillRound(ctx, bx, y + rowH * 0.36, w2, rowH * 0.14, 2, rgba(GREY, (0.4 + 0.3 * shimmer) * (1 - loaded)));
      if (loaded > 0) {
        fillRound(ctx, bx, y + rowH * 0.08, w1 * loaded, rowH * 0.18, 2, rgba([52, 64, 67], loaded));
        fillRound(ctx, bx, y + rowH * 0.36, w2 * loaded, rowH * 0.14, 2, rgba(GREY, loaded));
      }
    }
    ctx.restore();
  };

  const mobile: Painter = (ctx, box, b, alpha) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const { x, y, w, h } = box;
    const pad = w * 0.1;

    fillRound(ctx, x + w * 0.35, y + h * 0.025, w * 0.3, h * 0.03, h * 0.015, C.ink);
    // Header: greeting and avatar.
    fillRound(ctx, x + pad, y + h * 0.1, w * 0.42, h * 0.035, 3, C.ink2);
    ctx.beginPath();
    ctx.arc(x + w - pad - w * 0.06, y + h * 0.115, w * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = C.tint2;
    ctx.fill();

    // Progress through the year. No money on this screen, on purpose.
    const cardY = y + h * 0.19;
    const cardH = h * 0.2;
    fillRound(ctx, x + pad, cardY, w - pad * 2, cardH, 10 * L.px, C.teal);
    fillRound(ctx, x + pad * 1.6, cardY + cardH * 0.22, w * 0.3, cardH * 0.13, 2, "rgba(255,255,255,0.75)");
    const track = w - pad * 3.2;
    fillRound(ctx, x + pad * 1.6, cardY + cardH * 0.66, track, cardH * 0.1, cardH * 0.05, "rgba(255,255,255,0.25)");
    fillRound(ctx, x + pad * 1.6, cardY + cardH * 0.66, track * (0.15 + 0.85 * easeOutCubic(b)), cardH * 0.1, cardH * 0.05, C.white);

    // Four tiles, one per track.
    const tw = (w - pad * 2 - w * 0.06) / 2;
    const th = h * 0.17;
    for (let k = 0; k < 4; k++) {
      const g = easeOutBack(stagger(ramp(b, 0.2, 0.9), k, 4, 0.5));
      if (g <= 0) continue;
      const tx = x + pad + (k % 2) * (tw + w * 0.06);
      const ty = y + h * 0.45 + Math.floor(k / 2) * (th + w * 0.06);
      const cx = tx + tw / 2;
      const cy = ty + th / 2;
      fillRound(ctx, cx - (tw * g) / 2, cy - (th * g) / 2, tw * g, th * g, 8 * L.px, k === 0 ? C.tint : C.wash);
    }

    // Tab bar.
    ctx.fillStyle = C.faint;
    ctx.fillRect(x, y + h * 0.9, w, 1);
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(x + w * (0.2 + k * 0.2), y + h * 0.95, w * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = k === 0 ? C.teal : C.line;
      ctx.fill();
    }
    ctx.restore();
  };

  const CONTENT: Partial<Record<ChapterId, Painter>> = { design, frontend, backend, mobile };

  /* ---------------- the world around the student ---------------- */

  function withAlpha(alpha: number, paint: () => void) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    paint();
    ctx.restore();
  }

  function trackEnv({ A, alpha, local, time }: EnvArgs) {
    withAlpha(alpha, () => {
      const forks = forkPoints(A);
      const reveal = easeInOutCubic(ramp(local, 0.02, 0.4));
      const chosen = reduced ? 0 : Math.floor(time * 0.8 + local * 4) % 4;
      const labels = ["Design", "Frontend", "Backend", "Mobile"];
      forks.forEach((fork, k) => {
        const on = k === chosen;
        ctx.setLineDash([2 * L.px, 7 * L.px]);
        ctx.lineDashOffset = on ? -(time * 24 + local * 120) : 0;
        ctx.strokeStyle = on ? C.teal : C.line;
        ctx.lineWidth = (on ? 2.2 : 1.6) * L.px;
        ctx.lineCap = "round";
        strokeQuad(ctx, fork.origin, fork.control, fork.end, reveal);
        ctx.setLineDash([]);

        const tag = ramp(local, 0.3 + k * 0.04, 0.45 + k * 0.04);
        if (tag > 0) {
          ctx.save();
          ctx.globalAlpha *= tag;
          ctx.beginPath();
          ctx.arc(fork.end.x, fork.end.y, 4 * L.px, 0, Math.PI * 2);
          ctx.fillStyle = on ? C.teal : C.line;
          ctx.fill();
          text(labels[k], fork.end.x, fork.end.y - 18 * L.px, L.mobile ? 11 : 14, on ? C.teal : C.muted, {
            align: "center",
          });
          ctx.restore();
        }
      });
    });
  }

  function backendEnv({ A, alpha, local, time }: EnvArgs) {
    withAlpha(alpha, () => {
      const s = L.s;
      const b = ramp(local, 0.36, 0.9);
      const deviceBottom = A.y - 0.45 * s + 0.36 * s;
      const api = { x: A.x, y: A.y + 0.14 * s };
      const nodes = [
        { x: A.x - 0.72 * s, y: A.y + 0.58 * s, label: "auth" },
        { x: A.x, y: A.y + 0.58 * s, label: "postgres" },
        { x: A.x + 0.72 * s, y: A.y + 0.58 * s, label: "cache" },
      ];

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.4 * L.px;
      strokeLine(ctx, { x: A.x, y: deviceBottom }, api);
      for (const node of nodes) strokeLine(ctx, api, { x: node.x, y: node.y - 0.12 * s });

      // Packets run down to the data and back up with the answer.
      const lines: [Point, Point][] = [
        [{ x: A.x, y: deviceBottom }, api],
        ...nodes.map((node): [Point, Point] => [api, { x: node.x, y: node.y - 0.12 * s }]),
      ];
      lines.forEach(([from, to], k) => {
        const phase = (b * 4 + time * 0.4 + k * 0.27) % 1;
        const back = Math.floor(b * 4 + time * 0.4 + k * 0.27) % 2 === 1;
        const t = back ? 1 - phase : phase;
        ctx.beginPath();
        ctx.arc(lerp(from.x, to.x, t), lerp(from.y, to.y, t), 3.2 * L.px, 0, Math.PI * 2);
        ctx.fillStyle = C.teal;
        ctx.fill();
      });

      const pw = 0.42 * s;
      const ph = 0.13 * s;
      fillRound(ctx, api.x - pw / 2, api.y - ph / 2, pw, ph, ph / 2, C.ink);
      text("API", api.x, api.y + 0.5, L.mobile ? 10 : 12, C.white, { align: "center", family: MONO });

      const request = "GET /cohort → 200";
      const typed = request.slice(0, Math.round(request.length * ramp(b, 0.05, 0.5)));
      if (typed) text(typed, api.x + pw / 2 + 12 * L.px, api.y, L.mobile ? 9.5 : 11.5, C.muted, { family: MONO, weight: 500 });

      for (const node of nodes) {
        const w = 0.36 * s;
        const h = 0.24 * s;
        const x = node.x - w / 2;
        const y = node.y - 0.12 * s;
        if (node.label === "postgres") {
          const ry = h * 0.16;
          fillRound(ctx, x, y, w, h, 0, C.white);
          ctx.beginPath();
          ctx.ellipse(node.x, y + h, w / 2, ry, 0, 0, Math.PI);
          ctx.fillStyle = C.white;
          ctx.fill();
          ctx.strokeStyle = C.ink2;
          ctx.lineWidth = 1.4 * L.px;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + h);
          ctx.ellipse(node.x, y + h, w / 2, ry, 0, Math.PI, 0, true);
          ctx.lineTo(x + w, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(node.x, y, w / 2, ry, 0, 0, Math.PI * 2);
          ctx.fillStyle = C.tint;
          ctx.fill();
          ctx.stroke();
        } else {
          for (let k = 0; k < 2; k++) {
            const ry = y + k * (h / 2 + 2 * L.px);
            fillRound(ctx, x, ry, w, h / 2 - 2 * L.px, 4 * L.px, C.white);
            roundRect(ctx, x, ry, w, h / 2 - 2 * L.px, 4 * L.px);
            ctx.strokeStyle = C.ink2;
            ctx.lineWidth = 1.4 * L.px;
            ctx.stroke();
            const blink = reduced || Math.sin(time * 5 + k * 2 + node.x) > 0;
            ctx.beginPath();
            ctx.arc(x + w * 0.16, ry + (h / 2 - 2 * L.px) / 2, 2.6 * L.px, 0, Math.PI * 2);
            ctx.fillStyle = blink ? C.teal : C.line;
            ctx.fill();
          }
        }
        text(node.label, node.x, y + h + 0.16 * s, L.mobile ? 9.5 : 11.5, C.muted, { family: MONO, weight: 500, align: "center" });
      }
    });
  }

  function taughtEnv({ A, alpha, local, time }: EnvArgs) {
    withAlpha(alpha, () => {
      const s = L.s;
      const I = instructorAt(A);

      // The whiteboard behind the instructor.
      const bw = 0.82 * s;
      const bh = 0.5 * s;
      const bx = I.x - bw * 0.72;
      const by = I.y - 0.62 * s;
      fillRound(ctx, bx, by, bw, bh, 6 * L.px, C.white);
      roundRect(ctx, bx, by, bw, bh, 6 * L.px);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.4 * L.px;
      ctx.stroke();
      const write = ramp(local, 0.25, 0.8);
      [
        [0.1, 0.3, 0.5, C.ink2],
        [0.1, 0.48, 0.34, C.line],
        [0.1, 0.64, 0.42, C.line],
        [0.62, 0.3, 0.28, C.teal],
      ].forEach(([fx, fy, fw, fill], k) => {
        const g = stagger(write, k, 4, 0.5);
        fillRound(ctx, bx + bw * (fx as number), by + bh * (fy as number), bw * (fw as number) * g, bh * 0.07, 2, fill as string);
      });

      // Live chip.
      const pulse = reduced ? 1 : 0.55 + 0.45 * Math.sin(time * 4);
      const cw = 46 * L.px;
      const ch = 18 * L.px;
      fillRound(ctx, bx + 8 * L.px, by - ch - 8 * L.px, cw, ch, ch / 2, C.ink);
      ctx.beginPath();
      ctx.arc(bx + 8 * L.px + ch * 0.55, by - ch / 2 - 8 * L.px, 3.2 * L.px, 0, Math.PI * 2);
      ctx.fillStyle = rgba([127, 196, 203], pulse);
      ctx.fill();
      text("LIVE", bx + 8 * L.px + cw * 0.6, by - ch / 2 - 8 * L.px + 0.5, 9.5, C.white, { align: "center" });

      // The instructor.
      const iw = 0.1 * s;
      const ih = 0.28 * s;
      fillRound(ctx, I.x - iw / 2, I.y - ih / 2, iw, ih, iw / 2, C.ink);

      // Teaching reaches the student.
      const student = { x: A.x + 0.42 * s, y: A.y + 0.3 * s };
      const reach = easeOutCubic(ramp(local, 0.3, 0.6));
      if (reach > 0) {
        ctx.setLineDash([3 * L.px, 8 * L.px]);
        ctx.lineDashOffset = -(local * 160 + time * 30);
        ctx.strokeStyle = C.teal;
        ctx.lineWidth = 1.8 * L.px;
        ctx.lineCap = "round";
        strokeLine(ctx, { x: I.x + iw, y: I.y }, { x: lerp(I.x + iw, student.x - 0.08 * s, reach), y: lerp(I.y, student.y - 0.04 * s, reach) });
        ctx.setLineDash([]);
      }
    });
  }

  function mentorEnv({ A, alpha, local }: EnvArgs) {
    withAlpha(alpha, () => {
      const s = L.s;
      const form = formFor("mentor", local)!;
      const student = { x: A.x + form.x * s, y: A.y + form.y * s };
      const mw = 0.1 * s;
      const mh = 0.3 * s;
      const startX = A.x - 1.5 * s;
      const mx = lerp(startX, student.x - 0.3 * s, easeInOutCubic(ramp(local, 0.04, 0.3)));
      const my = student.y - 0.02 * s;
      const ground = student.y + 0.15 * s;

      // Where they've walked.
      ctx.setLineDash([2 * L.px, 8 * L.px]);
      ctx.strokeStyle = rgba(TEAL, 0.45);
      ctx.lineWidth = 2 * L.px;
      ctx.lineCap = "round";
      strokeLine(ctx, { x: startX, y: ground }, { x: student.x + 0.05 * s, y: ground });
      ctx.setLineDash([]);

      fillRound(ctx, mx - mw / 2, my - mh / 2, mw, mh, mw / 2, C.white);
      roundRect(ctx, mx - mw / 2, my - mh / 2, mw, mh, mw / 2);
      ctx.strokeStyle = C.teal;
      ctx.lineWidth = 2 * L.px;
      ctx.stroke();

      const bubble = easeOutBack(ramp(local, 0.38, 0.52));
      if (bubble > 0) {
        const label = "You've got this.";
        ctx.font = font(L.mobile ? 11 : 13, 600);
        const tw = ctx.measureText(label).width + 22 * L.px;
        const th = 30 * L.px;
        const bx = mx - tw / 2;
        const by = my - mh / 2 - th - 16 * L.px;
        ctx.save();
        ctx.translate(mx, by + th);
        ctx.scale(bubble, bubble);
        ctx.translate(-mx, -(by + th));
        fillRound(ctx, bx, by, tw, th, th / 2, C.white);
        roundRect(ctx, bx, by, tw, th, th / 2);
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1.2 * L.px;
        ctx.stroke();
        text(label, mx, by + th / 2 + 0.5, L.mobile ? 11 : 13, C.ink, { align: "center" });
        ctx.restore();
      }
    });
  }

  function piece(kind: number, box: Box, initial: string) {
    const { x, y, w, h } = box;
    ctx.save();
    ctx.shadowColor = rgba(INK, 0.1);
    ctx.shadowBlur = 30 * L.px;
    ctx.shadowOffsetY = 12 * L.px;
    fillRound(ctx, x, y, w, h, box.r, C.white);
    ctx.restore();
    roundRect(ctx, x, y, w, h, box.r);
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 1.3 * L.px;
    ctx.stroke();

    ctx.save();
    roundRect(ctx, x, y, w, h, box.r);
    ctx.clip();
    const pad = w * 0.08;
    if (kind === 0) {
      // A design frame.
      fillRound(ctx, x + pad, y + h * 0.16, w * 0.46, h * 0.1, 3, C.ink2);
      fillRound(ctx, x + pad, y + h * 0.32, w * 0.32, h * 0.08, 3, C.line);
      fillRound(ctx, x + pad, y + h * 0.5, w * 0.2, h * 0.12, h * 0.06, C.teal);
      fillRound(ctx, x + w * 0.6, y + h * 0.16, w * 0.32, h * 0.66, 6, C.tint);
    } else if (kind === 1) {
      // A browser.
      chrome(box);
      fillRound(ctx, x + pad, y + h * 0.3, w * 0.55, h * 0.1, 3, C.ink2);
      fillRound(ctx, x + pad, y + h * 0.46, w * 0.4, h * 0.08, 3, C.line);
      fillRound(ctx, x + pad, y + h * 0.64, w * 0.26, h * 0.14, 6, C.wash);
      fillRound(ctx, x + pad + w * 0.3, y + h * 0.64, w * 0.26, h * 0.14, 6, C.wash);
    } else if (kind === 2) {
      // A server rack.
      for (let k = 0; k < 3; k++) {
        const ry = y + h * (0.14 + k * 0.26);
        fillRound(ctx, x + pad, ry, w - pad * 2, h * 0.2, 4, C.wash);
        ctx.beginPath();
        ctx.arc(x + pad * 2, ry + h * 0.1, 2.6 * L.px, 0, Math.PI * 2);
        ctx.fillStyle = k === 1 ? C.teal : C.tint2;
        ctx.fill();
        fillRound(ctx, x + pad * 3, ry + h * 0.08, w * 0.3, h * 0.04, 2, C.line);
      }
    } else {
      // A phone on a wash.
      ctx.fillStyle = C.paper;
      ctx.fillRect(x, y, w, h);
      const pw = h * 0.46;
      const ph = h * 0.8;
      const px0 = x + w / 2 - pw / 2;
      const py0 = y + h * 0.1;
      fillRound(ctx, px0, py0, pw, ph, pw * 0.16, C.white);
      roundRect(ctx, px0, py0, pw, ph, pw * 0.16);
      ctx.strokeStyle = C.ink2;
      ctx.stroke();
      fillRound(ctx, px0 + pw * 0.12, py0 + ph * 0.16, pw * 0.76, ph * 0.22, 5, C.teal);
      fillRound(ctx, px0 + pw * 0.12, py0 + ph * 0.46, pw * 0.34, ph * 0.18, 4, C.wash);
      fillRound(ctx, px0 + pw * 0.54, py0 + ph * 0.46, pw * 0.34, ph * 0.18, 4, C.wash);
    }
    ctx.restore();

    // Who made it.
    const r = Math.max(10 * L.px, w * 0.07);
    ctx.beginPath();
    ctx.arc(x + w - r * 0.4, y + r * 0.4, r, 0, Math.PI * 2);
    ctx.fillStyle = C.teal;
    ctx.fill();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2 * L.px;
    ctx.stroke();
    text(initial, x + w - r * 0.4, y + r * 0.4 + 0.5, (r * 0.95) / L.px, C.white, { align: "center", weight: 700 });
  }

  function togetherEnv({ A, alpha, local }: EnvArgs) {
    withAlpha(alpha, () => {
      const s = L.s;
      const cw = 0.95 * s;
      const ch = 0.62 * s;
      // Gaps close as the four pieces lock into one product.
      const lock = easeInOutCubic(ramp(local, 0.45, 0.62));
      const gap = lerp(0.08 * s, 0, lock);
      const corners = [
        { x: -0.25 * L.w, y: -0.25 * L.h },
        { x: 1.25 * L.w, y: -0.25 * L.h },
        { x: -0.25 * L.w, y: 1.25 * L.h },
        { x: 1.25 * L.w, y: 1.25 * L.h },
      ];
      // Design, Frontend, Backend, Mobile, laid out as one screen.
      const kinds = [0, 1, 2, 3];
      const initials = ["D", "F", "B", "M"];

      kinds.forEach((kind, k) => {
        const t = reduced ? 1 : easeOutBack(stagger(ramp(local, 0.04, 0.42), k, 4, 0.5));
        const col = k % 2;
        const row = Math.floor(k / 2);
        const home = {
          x: A.x + (col === 0 ? -cw - gap / 2 : gap / 2),
          y: A.y + (row === 0 ? -ch - gap / 2 : gap / 2),
        };
        const x = lerp(corners[k].x, home.x, t);
        const y = lerp(corners[k].y, home.y, t);
        const spin = (1 - clamp01(t)) * (k % 2 === 0 ? -0.5 : 0.5);
        ctx.save();
        ctx.translate(x + cw / 2, y + ch / 2);
        ctx.rotate(spin);
        ctx.translate(-(x + cw / 2), -(y + ch / 2));
        piece(kind, { x, y, w: cw, h: ch, r: lerp(10 * L.px, 4 * L.px, lock) }, initials[k]);
        ctx.restore();
      });

      // Once locked, it reads as one thing.
      if (lock > 0) {
        ctx.save();
        ctx.globalAlpha *= lock;
        roundRect(ctx, A.x - cw - 6 * L.px, A.y - ch - 6 * L.px, cw * 2 + 12 * L.px, ch * 2 + 12 * L.px, 14 * L.px);
        ctx.strokeStyle = C.teal;
        ctx.lineWidth = 2 * L.px;
        ctx.stroke();
        ctx.restore();
      }

      const badge = easeOutBack(ramp(local, 0.6, 0.72));
      if (badge > 0) {
        const bw = 92 * L.px;
        const bh = 30 * L.px;
        const bx = A.x + cw - bw * 0.7;
        const by = A.y + ch - bh * 0.3;
        ctx.save();
        ctx.translate(bx + bw / 2, by + bh / 2);
        ctx.scale(badge, badge);
        ctx.translate(-(bx + bw / 2), -(by + bh / 2));
        fillRound(ctx, bx, by, bw, bh, bh / 2, C.teal);
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 2 * L.px;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(bx + 14 * L.px, by + bh / 2);
        ctx.lineTo(bx + 18 * L.px, by + bh / 2 + 4 * L.px);
        ctx.lineTo(bx + 25 * L.px, by + bh / 2 - 4 * L.px);
        ctx.stroke();
        text("Shipped", bx + bw / 2 + 9 * L.px, by + bh / 2 + 0.5, 12, C.white, { align: "center" });
        ctx.restore();
      }
    });
  }

  const ENV: Partial<Record<ChapterId, (args: EnvArgs) => void>> = {
    track: trackEnv,
    backend: backendEnv,
    taught: taughtEnv,
    mentor: mentorEnv,
    together: togetherEnv,
  };

  /* ---------------- the three doors ---------------- */

  const DOOR_LABELS = ["Risevest", "Hiring partners", "Your own path"];

  function door(k: number, A: Point, enter: number, focus: number, dim: number, time: number) {
    const s = L.s;
    const rise = easeOutCubic(stagger(enter, k, 3, 0.5));
    if (rise <= 0) return;
    const w = DOOR.w * s;
    const h = DOOR.h * s;
    const cx = A.x + (k - 1) * DOOR.gap * s;
    const cy = A.y + (1 - rise) * 40 * L.px - focus * 8 * L.px;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const arch = w / 2;
    const radii = [arch, arch, 10 * L.px, 10 * L.px];

    ctx.save();
    ctx.globalAlpha *= rise * dim;
    ctx.translate(cx, cy);
    ctx.scale(1 + focus * 0.06, 1 + focus * 0.06);
    ctx.translate(-cx, -cy);

    // The chosen door glows and gets a ring.
    ctx.save();
    ctx.shadowColor = rgba(TEAL, 0.35 * focus);
    ctx.shadowBlur = 50 * L.px * focus;
    ctx.shadowOffsetY = 20 * L.px * focus;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radii);
    ctx.fillStyle = k === 0 ? C.teal : C.white;
    ctx.fill();
    ctx.restore();
    if (k !== 0) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radii);
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 1.5 * L.px;
      ctx.stroke();
    }
    if (focus > 0) {
      const o = 7 * L.px;
      ctx.beginPath();
      ctx.roundRect(x - o, y - o, w + o * 2, h + o * 2, [arch + o, arch + o, 14 * L.px, 14 * L.px]);
      ctx.strokeStyle = rgba(TEAL, focus);
      ctx.lineWidth = 2 * L.px;
      ctx.stroke();
    }

    // What's behind each door.
    const icon = { x: cx, y: y + h * 0.5 };
    if (k === 0) {
      const lw = w * 0.5;
      const lk = lw / LOGO_VIEWBOX.width;
      ctx.save();
      ctx.translate(icon.x - lw / 2, icon.y - (LOGO_VIEWBOX.height * lk) / 2);
      ctx.scale(lk, lk);
      ctx.fillStyle = C.white;
      for (const path of bandPaths) ctx.fill(path);
      ctx.restore();
    } else if (k === 1) {
      // Placeholder partner marks until the real partners are announced.
      const u = w * 0.13;
      const spots = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ];
      spots.forEach(([dx, dy], m) => {
        const px = icon.x + dx * u * 1.25;
        const py = icon.y + dy * u * 1.25;
        ctx.fillStyle = m === 0 ? C.ink2 : C.line;
        ctx.beginPath();
        if (m === 0) ctx.arc(px, py, u * 0.8, 0, Math.PI * 2);
        else if (m === 1) ctx.roundRect(px - u * 0.8, py - u * 0.8, u * 1.6, u * 1.6, u * 0.35);
        else if (m === 2) {
          ctx.moveTo(px, py - u * 0.85);
          ctx.lineTo(px + u * 0.85, py + u * 0.7);
          ctx.lineTo(px - u * 0.85, py + u * 0.7);
          ctx.closePath();
        } else ctx.roundRect(px - u * 0.9, py - u * 0.45, u * 1.8, u * 0.9, u * 0.45);
        ctx.fill();
      });
    } else {
      // Something of your own, taking off.
      const cw = w * 0.56;
      const ch = w * 0.42;
      const left = icon.x - cw / 2;
      const base = icon.y + ch / 2;
      const grow = reduced ? 1 : 0.85 + 0.15 * Math.sin(time * 1.4);
      const pts = [0.1, 0.18, 0.14, 0.38, 0.5, 0.82].map((v, m, all) => ({
        x: left + (m / (all.length - 1)) * cw,
        y: base - v * ch * grow,
      }));
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.2 * L.px;
      strokeLine(ctx, { x: left, y: base }, { x: left + cw, y: base });
      ctx.beginPath();
      pts.forEach((pt, m) => (m ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      ctx.strokeStyle = C.teal;
      ctx.lineWidth = 2.4 * L.px;
      ctx.lineJoin = "round";
      ctx.stroke();
      const tip = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4 * L.px, 0, Math.PI * 2);
      ctx.fillStyle = C.teal;
      ctx.fill();
    }
    ctx.restore();

    // Name above the door.
    ctx.save();
    ctx.globalAlpha *= rise * lerp(dim, 1, focus);
    text(DOOR_LABELS[k], cx, y - 22 * L.px, L.mobile ? 10.5 : 13, focus > 0.5 ? C.teal : C.muted, { align: "center" });
    ctx.restore();
  }

  function doors(A: Point, alpha: number, enter: number, from: number, to: number, t: number, time: number) {
    withAlpha(alpha, () => {
      const any = (from >= 0 ? 1 - t : 0) + (to >= 0 ? t : 0);
      for (let k = 0; k < 3; k++) {
        const focus = (from === k ? 1 - t : 0) + (to === k ? t : 0);
        door(k, A, enter, focus, 1 - 0.55 * any * (1 - focus), time);
      }
    });
  }

  function drawEnv(index: number, local: number, time: number) {
    const prevId = index > 0 ? CHAPTERS[index - 1].id : undefined;
    const id = CHAPTERS[index].id;
    const prevFocus = prevId ? DOOR_FOCUS[prevId] : undefined;
    const focus = DOOR_FOCUS[id];

    // The doors are one continuous scene across their four chapters: only
    // the focus moves, so nothing fades out and back in.
    if (focus !== undefined) {
      if (prevFocus !== undefined) {
        doors(anchor(index), 1, 1, prevFocus, focus, easeInOutSine(ramp(local, 0, 0.5)), time);
        return;
      }
      doors(anchor(index), 1, easeInOutSine(ramp(local, 0.12, 0.6)), -1, -1, 0, time);
    } else if (prevFocus !== undefined) {
      // Home: the doors dissolve into the pieces that fly back to the mark.
      doors(anchor(index - 1), 1 - ramp(local, 0.02, 0.18), 1, prevFocus, prevFocus, 1, time);
      return;
    }

    const prev = prevId ? ENV[prevId] : undefined;
    if (prev) prev({ A: anchor(index - 1), alpha: 1 - easeInOutSine(ramp(local, 0, 0.3)), local: 1, time });

    const now = ENV[id];
    // The build pieces time their own entrance, flying in from the corners.
    const alpha = id === "together" ? 1 : easeInOutSine(ramp(local, 0.12, 0.42));
    if (now) now({ A: anchor(index), alpha, local, time });
  }

  /* ---------------- the stipend ---------------- */

  function envelope(E: Point, alpha: number, local: number, time: number) {
    if (alpha <= 0) return;
    const s = L.s;
    const w = 1.3 * s;
    const h = 0.85 * s;
    const grow = lerp(0.9, 1, easeOutCubic(ramp(local, 0.15, 0.4)));
    const float = Math.sin(time * 1.1) * 5 * L.px;
    const tilt = Math.sin(time * 0.8) * 0.03;

    ctx.save();
    ctx.globalAlpha = alpha;

    // A soft teal glow under it.
    const glow = ctx.createRadialGradient(E.x, E.y, 0, E.x, E.y, s * 1.3);
    glow.addColorStop(0, rgba(TEAL, 0.28));
    glow.addColorStop(1, rgba(TEAL, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(E.x - s * 1.4, E.y - s * 1.4, s * 2.8, s * 2.8);

    ctx.translate(E.x, E.y + float);
    ctx.rotate(tilt);
    ctx.scale(grow, grow);

    const x = -w / 2;
    const y = -h / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 50 * L.px;
    ctx.shadowOffsetY = 24 * L.px;
    fillRound(ctx, x, y, w, h, 0.03 * s, C.white);
    ctx.restore();

    // Folds.
    ctx.strokeStyle = C.faint;
    ctx.lineWidth = 1.4 * L.px;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(0, h * 0.05);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.strokeStyle = C.line;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(0, h * 0.05);
    ctx.lineTo(x + w - 2, y + 2);
    ctx.stroke();

    // The seal, with the mark pressed into it.
    const sr = 0.15 * s;
    ctx.beginPath();
    ctx.arc(0, h * 0.05, sr, 0, Math.PI * 2);
    ctx.fillStyle = C.teal;
    ctx.fill();
    const lw = sr * 1.1;
    const k = lw / LOGO_VIEWBOX.width;
    ctx.save();
    ctx.translate(-lw / 2, h * 0.05 - (LOGO_VIEWBOX.height * k) / 2);
    ctx.scale(k, k);
    ctx.fillStyle = C.white;
    for (const path of bandPaths) ctx.fill(path);
    ctx.restore();

    text("For: You", x + w * 0.07, y + h * 0.14, L.mobile ? 11 : 13, C.ink, { weight: 600 });
    text("Open on payday", x + w * 0.93, y + h * 0.86, L.mobile ? 9 : 10.5, C.muted, { weight: 500, align: "right" });
    ctx.restore();
  }

  function drawStipend(index: number, local: number, time: number) {
    const id = CHAPTERS[index].id;
    let dark = 0;
    let shown = 0;
    let at = local;
    if (id === "stipend") {
      dark = easeInOutSine(ramp(local, 0, 0.32));
      shown = easeInOutSine(ramp(local, 0.14, 0.4));
    } else if (index === INDEX.stipend + 1) {
      dark = 1 - easeInOutSine(ramp(local, 0.04, 0.32));
      shown = 1 - easeInOutSine(ramp(local, 0, 0.26));
      at = 1;
    }
    if (dark <= 0 && shown <= 0) return;

    // The whole room goes dark, so the white copy reads cleanly...
    ctx.fillStyle = rgba(INK, dark);
    ctx.fillRect(0, 0, L.w, L.h);

    // ...and a soft pool of light falls on the envelope from above.
    const E = anchor(INDEX.stipend);
    const light = shown * easeOutCubic(ramp(at, 0.1, 0.4));
    if (light > 0) {
      ctx.save();
      ctx.translate(E.x, E.y);
      ctx.scale(1.6, 1);
      const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, L.s * 1.05);
      pool.addColorStop(0, rgba(WHITE, 0.09 * light));
      pool.addColorStop(1, rgba(WHITE, 0));
      ctx.fillStyle = pool;
      ctx.fillRect(-L.s * 1.1, -L.s * 1.1, L.s * 2.2, L.s * 2.2);
      ctx.restore();
    }
    envelope(E, shown, at, time);
  }

  /* ---------------- the mark ---------------- */

  let slot: { x: number; y: number; height: number } | null = null;

  function drawMark(index: number, local: number) {
    const id = CHAPTERS[index].id;

    // The solid mark holds the opening screen until the slats take over.
    if (id === "hero") {
      const rest = 1 - easeInOutSine(ramp(local, 0.03, 0.16));
      if (rest <= 0) return;
      ctx.save();
      ctx.globalAlpha = rest;
      drawLogo(L.hero, C.teal);
      ctx.restore();
      return;
    }

    // The solid mark fades in slowly over the landed pieces, so the switch
    // from pieces to mark is never visible as a cut.
    const seal = id === "end" ? 1 : id === "home" ? easeInOutSine(ramp(local, 0.68, 0.88)) : 0;
    if (seal <= 0) return;

    // At the end the mark shrinks into its place beside the application
    // heading, then scrolls away with it.
    let frame = L.end;
    if (id === "end" && slot) {
      const target = logoFrame(slot.x, slot.y, slot.height);
      const t = easeInOutSine(ramp(local, 0, 0.55));
      frame = { x: lerp(frame.x, target.x, t), y: lerp(frame.y, target.y, t), k: lerp(frame.k, target.k, t) };
    }
    ctx.save();
    ctx.globalAlpha = seal;
    drawLogo(frame, C.teal);
    ctx.restore();
  }

  /* ---------------- frame ---------------- */

  function draw(progress: number, rawTime: number) {
    const time = reduced ? 0 : rawTime;
    const { index, local } = storyPosition(progress, reduced);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, L.w, L.h);

    drawEnv(index, local, time);
    drawPieces(index, local, time);
    drawCard(index, local, time);
    drawMark(index, local);
    drawStipend(index, local, time);
  }

  resize();
  return {
    resize,
    draw,
    setSlot(next) {
      slot = next;
    },
  };
}
