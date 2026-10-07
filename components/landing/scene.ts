/**
 * The landing page canvas. One teal piece is the student: it starts inside
 * the Rise mark, joins a grey cohort, picks a track, becomes a design file, a
 * web page, an API and an app, gets taught, gets a mentor, gets paid, ships
 * with the other tracks, and finally flies home into the mark. Then the mark
 * becomes the Rise Classroom app icon and opens into the app where all of it
 * happens.
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
  easeOutQuart,
  lerp,
  locate,
  ramp,
  stagger,
  staggerAt,
} from "@/lib/landing-timeline";

import type { LandingPeople, Person, Track } from "@/lib/people";

import { CHAPTERS, type ChapterId, type CopyAlign } from "./story";

export type Scene = {
  resize(): void;
  /** `intro` runs 0..1 once on load while the mark assembles; 1 after. */
  draw(progress: number, time: number, intro?: number): void;
  /** Real people for the story: faces in the mark, the cohort and the staff. */
  setPeople(people: LandingPeople): void;
  /**
   * The box the hero lays out for the mark, in canvas pixels. The mark fits
   * inside it, sitting on its bottom-right corner.
   */
  setHeroBox(box: { x: number; y: number; w: number; h: number } | null): void;
  /**
   * Which hero portrait the mark is showing: `index`, the `next` one, and how
   * far the crossfade to it has got (0..1). Drives the photo caption.
   */
  heroSlide(): { index: number; next: number; t: number };
  /** Resolves once the first hero portrait has loaded (or failed), so the intro can wait for it. */
  heroReady(): Promise<void>;
  /** The pointer over the stage, in canvas pixels; null when it leaves. */
  setPointer(pointer: { x: number; y: number } | null): void;
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
const REST: Partial<Record<ChapterId, number>> = { hero: 0, home: 0.95, classroom: 0.62, end: 1 };

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
      ? logoFrame(w / 2, h * 0.34, Math.min(h * 0.32, w * 0.84 * ratio))
      : logoFrame(w * 0.665, h * 0.52, Math.min(h * 0.64, w * 0.4 * ratio)),
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
  /** How much of the slice shows the photo inside the mark rather than teal. */
  ph?: number;
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
    ph: lerp(a.ph ?? 0, b.ph ?? 0, t),
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

function fillRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
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

/**
 * On a door's own chapter it steps forward: this much bigger, alone on the
 * copy's opposite side, with the student standing under it.
 */
const DOOR_FOCUSED = { scale: 1.35, studentY: 0.69 };

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
    // Payday: the student is a phone, and the credit alert lands on it.
    // Big enough to read the alert: it is the picture on this screen.
    case "stipend":
      return device(0, 0, 1.25, 2.5, 0.16);
    case "taught":
      return person(0.42, 0.3, 0.1, 0.26);
    case "mentor":
      return person(0.12 + easeInOutCubic(ramp(local, 0.3, 1)) * 0.35, 0.2, 0.1, 0.26);
    // The student waits under the row of doors, then stands under
    // whichever door has stepped forward.
    case "next":
      return person(0, DOOR.studentY, 0.08, 0.2);
    case "rise":
    case "partner":
    case "own":
      return person(0, DOOR_FOCUSED.studentY, 0.08, 0.2);
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
  /** Per slice: flat teal, flat grey, and its part of each hero portrait. */
  let sprites: { teal: HTMLCanvasElement; grey: HTMLCanvasElement; photos: (HTMLCanvasElement | null)[] }[] = [];

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    // Phones resize constantly as the browser bar slides in and out. Only
    // touch the canvas when its size really changed: reallocating it wipes it.
    const width = Math.round(w * nextDpr);
    const height = Math.round(h * nextDpr);
    if (width === canvas.width && height === canvas.height && nextDpr === dpr && pieces.length) return;
    dpr = nextDpr;
    canvas.width = width;
    canvas.height = height;
    L = computeLayout(w, h);
    fitHero();

    const key = L.mobile ? "mobile" : "desktop";
    pieceSets[key] ??= buildPieces(sampleBandStrips(L.mobile ? [40, 32, 26] : [64, 52, 42]));
    if (pieces !== pieceSets[key]) {
      pieces = pieceSets[key];
      offsets = pieces.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, spin: 0, vspin: 0 }));
    }
    paintSprites();
  }

  let spriteUnit = 0;
  let spritePhotos = "";
  function paintSprites() {
    const unit = Math.max(L.hero.k, L.end.k) * dpr;
    const photos = heroPhotos.map((photo) => (ready(photo.img) ? photo.img.src : "")).join("|");
    if (pieces.length === 0) return;
    // drawImage scales slices smoothly, so small size changes (a phone's
    // browser bar) reuse them. Re-cutting hundreds of canvases mid-scroll is
    // what hits iOS's canvas memory limit and makes the page flicker.
    const closeEnough = spriteUnit > 0 && unit <= spriteUnit * 1.15 && unit >= spriteUnit * 0.6;
    if (closeEnough && photos === spritePhotos && sprites.length === pieces.length) return;
    spriteUnit = unit;
    spritePhotos = photos;
    // Give the old slices' memory back now rather than whenever GC runs; iOS
    // counts it against the page until then.
    for (const sprite of sprites) {
      for (const old of [sprite.teal, sprite.grey, ...sprite.photos]) {
        if (!old) continue;
        old.width = 0;
        old.height = 0;
      }
    }

    // Each portrait fills the whole mark, like a face seen through blinds:
    // eyes in the top band, mouth in the middle, chin in the bottom. The face
    // is framed at the same size every time, centred under the dip.
    const mark = { x: 0, y: 0, w: LOGO_VIEWBOX.width, h: LOGO_VIEWBOX.height };
    const frames = heroPhotos.map((photo) => {
      if (!ready(photo.img)) return null;
      const fit = Math.max(mark.w / photo.img.naturalWidth, mark.h / photo.img.naturalHeight);
      const face = (photo.focus.w ?? 0.3) * photo.img.naturalWidth * fit;
      return { photo, zoom: Math.max(1, (mark.w * 0.44) / face) };
    });

    sprites = pieces.map((piece) => ({
      teal: renderStrip(piece.seg, unit, C.teal),
      grey: renderStrip(piece.seg, unit, C.line),
      photos: frames.map((frame) =>
        frame
          ? renderStrip(piece.seg, unit, (c) =>
              duotone(c, mark, () =>
                cover(c, frame.photo.img, mark, frame.photo.focus, { zoom: frame.zoom, at: { x: 0.5, y: 0.35 } })
              )
            )
          : null
      ),
    }));
  }

  /* ---------------- the hero portraits ---------------- */

  /** Seconds each portrait holds, and how long the crossfade takes. */
  const HOLD = 5.5;
  const FADE = 1.4;
  let slideClock: number | null = null;

  let markHeroReady: () => void = () => {};
  const heroReadyPromise = new Promise<void>((resolve) => {
    markHeroReady = resolve;
  });
  let slide = { index: 0, next: 0, t: 0 };

  /** Advances the slow portrait cycle; it starts once the intro has landed. */
  function stepSlide(time: number) {
    const count = heroPhotos.length;
    if (reduced || count < 2 || intro < 1) {
      slide = { index: 0, next: 0, t: 0 };
      return;
    }
    slideClock ??= time;
    const elapsed = time - slideClock;
    const period = HOLD + FADE;
    const index = Math.floor(elapsed / period) % count;
    const into = elapsed % period;
    slide = { index, next: (index + 1) % count, t: easeInOutSine(ramp(into, HOLD, period)) };
  }

  let heroBox: { x: number; y: number; w: number; h: number } | null = null;

  /** Fits the hero mark inside the box the page laid out for it. */
  function fitHero() {
    if (!heroBox || heroBox.w <= 0 || heroBox.h <= 0) return;
    const ratio = LOGO_VIEWBOX.height / LOGO_VIEWBOX.width;
    const height = Math.min(heroBox.h, heroBox.w * ratio);
    const width = height / ratio;
    L.hero = logoFrame(heroBox.x + heroBox.w - width / 2, heroBox.y + heroBox.h - height / 2, height);
  }

  /* ---------------- people ---------------- */

  type Photo = { img: HTMLImageElement; focus: Person["focus"]; person?: Person };
  let heroPhotos: Photo[] = [];
  let cohortPhotos: HTMLImageElement[] = [];
  let instructor: Photo | null = null;
  let mentor: Photo | null = null;

  function ready(img: HTMLImageElement) {
    return img.complete && img.naturalWidth > 0;
  }

  /**
   * Loads a photo through Next's image optimizer at the width it's drawn at
   * (one of the default sizes; quality 75 is the only one Next 16 allows by
   * default), so the canvas gets a small webp rather than the original.
   */
  function load(src: string, width: 256 | 1200) {
    const img = new Image();
    img.decoding = "async";
    img.src = `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
    // Repaint the slices once the hero photos arrive.
    img.onload = () => paintSprites();
    return img;
  }

  function photoOf(person: Person, width: 256 | 1200 = 256): Photo {
    return { img: load(person.photo, width), focus: person.focus, person };
  }

  /**
   * Draws `img` to cover `box`, zoomed by `zoom`, with the photo's `focus`
   * point (0..1) placed at `at` (0..1) within the box where the crop allows.
   */
  function cover(
    c: CanvasRenderingContext2D,
    img: HTMLImageElement,
    box: { x: number; y: number; w: number; h: number },
    focus = { x: 0.5, y: 0.4 },
    { zoom = 1, at = { x: 0.5, y: 0.5 } } = {}
  ) {
    const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = Math.min(box.x, Math.max(box.x + box.w - w, box.x + at.x * box.w - focus.x * w));
    const y = Math.min(box.y, Math.max(box.y + box.h - h, box.y + at.y * box.h - focus.y * h));
    c.drawImage(img, x, y, w, h);
  }

  /**
   * Turns whatever was just drawn in `box` into a teal duotone: deep teal
   * shadows, pale teal highlights. Every photo on the page shares it, so the
   * people read as part of the brand rather than pasted in.
   */
  function duotone(c: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }, paint: () => void) {
    c.save();
    c.filter = "grayscale(1) contrast(1.22) brightness(1.08)";
    paint();
    c.restore();
    c.save();
    c.globalCompositeOperation = "multiply";
    c.fillStyle = "#C2E7EA";
    c.fillRect(box.x, box.y, box.w, box.h);
    c.globalCompositeOperation = "screen";
    c.fillStyle = "#03292E";
    c.fillRect(box.x, box.y, box.w, box.h);
    c.restore();
  }

  /** A round portrait with a white ring; falls back to `fallback` until it loads. */
  /**
   * Each face, cropped and teal-toned once into its own small canvas. Canvas
   * filters are slow on Safari, so doing this every frame for a dozen faces
   * made iPhones stutter.
   */
  const faceCache = new Map<HTMLImageElement, HTMLCanvasElement>();
  const FACE_PX = 192;

  function faceSprite(img: HTMLImageElement, focus?: Person["focus"]) {
    let sprite = faceCache.get(img);
    if (!sprite) {
      sprite = document.createElement("canvas");
      sprite.width = FACE_PX;
      sprite.height = FACE_PX;
      const c = sprite.getContext("2d");
      if (c) {
        const box = { x: 0, y: 0, w: FACE_PX, h: FACE_PX };
        duotone(c, box, () => cover(c, img, box, focus, { zoom: 1.6 }));
      }
      faceCache.set(img, sprite);
    }
    return sprite;
  }

  function face(photo: Photo | HTMLImageElement | null, x: number, y: number, r: number, fallback: string) {
    const img = photo instanceof HTMLImageElement ? photo : photo?.img;
    const focus = photo instanceof HTMLImageElement ? undefined : photo?.focus;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fallback;
    ctx.fill();
    if (img && ready(img)) {
      ctx.clip();
      ctx.drawImage(faceSprite(img, focus), x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2.5 * L.px;
    ctx.stroke();
  }

  /* ---------------- the hero ---------------- */

  /** Springy offsets that push the hero's slices away from the pointer. */
  let offsets: { x: number; y: number; vx: number; vy: number; spin: number; vspin: number }[] = [];
  let pointer: { x: number; y: number } | null = null;
  let lastTime = 0;

  function stepOffsets(time: number, active: boolean) {
    const dt = Math.min(Math.max((time - lastTime) * 60, 0), 3);
    lastTime = time;
    if (reduced || dt === 0) return;
    const reach = LOGO_VIEWBOX.width * L.hero.k * 0.17;
    for (let i = 0; i < pieces.length; i++) {
      const o = offsets[i];
      if (active && pointer) {
        const home = logoPose(pieces[i], L.hero);
        const dx = home.x + o.x - pointer.x;
        const dy = home.y + o.y - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < reach) {
          const force = (1 - d / reach) ** 2 * 3 * dt;
          o.vx += (dx / d) * force;
          o.vy += (dy / d) * force;
          o.vspin += (dx > 0 ? 1 : -1) * force * 0.012;
        }
      }
      const damp = 0.86 ** dt;
      o.vx = (o.vx - o.x * 0.045 * dt) * damp;
      o.vy = (o.vy - o.y * 0.045 * dt) * damp;
      o.vspin = (o.vspin - o.spin * 0.05 * dt) * damp;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.spin += o.vspin * dt;
    }
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
    let logo = logoPose(p, L.hero);
    // Whole, the mark is three windows onto real people. Until the photos
    // arrive it shows pale, so it never vanishes into the teal field.
    logo.ph = 1;
    logo.c = GREY;

    // On load the slices fly in from all over the screen and lock into the
    // mark, centre first: the story's ending, played as its opening.
    if (intro < 1) {
      const arrive = staggerAt(intro, p.order, 0.6);
      const from = scatterPose(p, 0);
      from.x = lerp(L.w / 2, from.x, 1.35);
      from.y = lerp(L.h / 2, from.y, 1.35);
      from.a *= 2.2;
      from.c = GREY;
      const pose = mixPose(from, logo, easeOutQuart(arrive))!;
      pose.o = ramp(arrive, 0, 0.12);
      logo = pose;
    }

    // Pushed around by the pointer while it's still whole.
    const offset = offsets[i];
    if (offset) {
      logo.x += offset.x;
      logo.y += offset.y;
      logo.a += offset.spin;
    }
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
    // The inner rings are real faces, drawn by the join scene.
    if (cohortPhotos.length && radius < 0.66 * s) return null;
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
      case "stipend":
        return confettiPose(i, local, A);
      default:
        return null;
    }
  }

  /**
   * When the credit alert lands, shards of the mark burst up from it like
   * confetti and fall away.
   */
  function confettiPose(i: number, local: number, A: Point): Pose | null {
    if (i >= 48 || reduced) return null;
    const p = pieces[i];
    const [r0, r1, r2, r3] = p.r;
    // Starts the moment the alert lands on the phone.
    const t = ramp(local, 0.58 + r3 * 0.04, 1);
    if (t <= 0) return null;
    const s = L.s;
    const from = { x: A.x + (r0 - 0.5) * 0.8 * s, y: A.y - 0.3 * s };
    return {
      x: from.x + (r0 - 0.5) * 3.2 * s * t,
      y: from.y - (0.9 + r1 * 1.1) * s * t + 2.6 * s * t * t,
      w: p.seg.w * L.end.k * 0.8,
      h: p.seg.h * L.end.k * 0.45,
      a: (r2 - 0.5) * 9 * t,
      r: 0.3,
      c: r3 < 0.5 ? WHITE : [154, 211, 216],
      o: 1 - ramp(t, 0.55, 1),
      m: 1,
    };
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

    // Start inside the last door, the one still standing.
    const size = DOOR_FOCUSED.scale * s * 0.9;
    const start: Pose = {
      x: B.x + (r0 - 0.5) * DOOR.w * size,
      y: B.y + (r1 - 0.5) * DOOR.h * size,
      w: p.seg.w * L.end.k * (0.7 + r3 * 0.4),
      h: p.seg.h * L.end.k * (0.35 + r3 * 0.25),
      a: (r4 - 0.5) * 0.6,
      r: 0.4,
      c: p.teal ? TEAL : GREY,
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
      // A hair wider than the slice, so neighbours never show a seam.
      const w = pose.w + 0.7;
      const x = -w / 2;
      const y = -pose.h / 2;
      const current = sprite.photos[slide.index];
      const next = sprite.photos[slide.next];
      const photo = current ? clamp01(pose.ph ?? 0) : 0;
      const flat = 1 - photo;
      if (flat > 0.01 && teal < 0.99) {
        ctx.globalAlpha = pose.o * pose.m * flat * (1 - teal);
        ctx.drawImage(sprite.grey, x, y, w, pose.h);
      }
      if (flat > 0.01 && teal > 0.01) {
        ctx.globalAlpha = pose.o * pose.m * flat * teal;
        ctx.drawImage(sprite.teal, x, y, w, pose.h);
      }
      if (photo > 0.01 && current) {
        ctx.globalAlpha = pose.o * pose.m * photo;
        ctx.drawImage(current, x, y, w, pose.h);
        if (next && slide.t > 0.01) {
          ctx.globalAlpha = pose.o * pose.m * photo * slide.t;
          ctx.drawImage(next, x, y, w, pose.h);
        }
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

    if (id === "stipend" && !reduced) {
      // Buzzes as the alert lands.
      const buzz = ramp(local, 0.57, 0.6) * (1 - ramp(local, 0.6, 0.74));
      box = { ...box, x: box.x + Math.sin(time * 70) * 3.5 * L.px * buzz };
    }

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

  /**
   * Payday on the student's phone: a lock screen, then a credit alert from
   * Rise drops in. The amount is a shimmering blur, never a number: students
   * find out what it is when the first one arrives.
   */
  const lockScreen: Painter = (ctx, box, b, alpha, time) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const { x, y, w, h } = box;
    // Sizes are shares of the phone's width, so it scales as one object.
    const size = (share: number) => (w * share) / L.px;

    const wall = ctx.createLinearGradient(x, y, x, y + h);
    wall.addColorStop(0, "#0A4E56");
    wall.addColorStop(1, "#11818D");
    ctx.fillStyle = wall;
    ctx.fillRect(x, y, w, h);

    // The Rise mark, faint, as the wallpaper.
    const mk = (w * 0.8) / LOGO_VIEWBOX.width;
    ctx.save();
    ctx.globalAlpha *= 0.1;
    ctx.translate(x + w * 0.1, y + h * 0.56);
    ctx.scale(mk, mk);
    ctx.fillStyle = C.white;
    for (const path of bandPaths) ctx.fill(path);
    ctx.restore();

    fillRound(ctx, x + w * 0.36, y + h * 0.022, w * 0.28, h * 0.028, h * 0.014, "#06343A");
    text("Payday", x + w / 2, y + h * 0.12, size(0.055), "rgba(255,255,255,0.75)", { align: "center", weight: 500 });
    text("11:00", x + w / 2, y + h * 0.2, size(0.2), C.white, { align: "center", weight: 700 });

    // The credit alert slides down and settles with a small bounce.
    const drop = easeOutBack(ramp(b, 0.15, 0.42));
    if (drop > 0) {
      const nx = x + w * 0.06;
      const nw = w * 0.88;
      const nh = h * 0.21;
      const ny = lerp(y - nh, y + h * 0.31, drop);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 24 * L.px;
      ctx.shadowOffsetY = 10 * L.px;
      fillRound(ctx, nx, ny, nw, nh, w * 0.06, "rgba(255,255,255,0.96)");
      ctx.restore();

      const pad = nw * 0.07;
      const icon = nw * 0.12;
      fillRound(ctx, nx + pad, ny + pad, icon, icon, icon * 0.26, C.teal);
      const ik = (icon * 0.66) / LOGO_VIEWBOX.width;
      ctx.save();
      ctx.translate(nx + pad + icon * 0.17, ny + pad + (icon - LOGO_VIEWBOX.height * ik) / 2);
      ctx.scale(ik, ik);
      ctx.fillStyle = C.white;
      for (const path of bandPaths) ctx.fill(path);
      ctx.restore();

      const tx = nx + pad + icon + nw * 0.05;
      text("RISE CLASSROOM", tx, ny + pad + icon * 0.3, size(0.036), C.muted, { weight: 600 });
      text("now", nx + nw - pad, ny + pad + icon * 0.3, size(0.036), C.muted, { weight: 500, align: "right" });
      text("Credit alert", tx, ny + pad + icon * 0.95, size(0.055), C.ink, { weight: 700 });
      text("Your stipend has landed.", tx, ny + nh * 0.6, size(0.045), C.ink2, { weight: 500 });

      // The amount stays a surprise: a blurred bar with a light passing over it.
      const ay = ny + nh * 0.79;
      text("Amount", tx, ay, size(0.04), C.muted, { weight: 500 });
      const bx = tx + nw * 0.2;
      const bw = nw * 0.34;
      const bh = nh * 0.13;
      const sweep = reduced ? 0.5 : (time * 0.45) % 1.4 - 0.2;
      const shine = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      shine.addColorStop(0, "#CBD5D6");
      shine.addColorStop(Math.min(Math.max(sweep - 0.15, 0), 1), "#CBD5D6");
      shine.addColorStop(Math.min(Math.max(sweep, 0), 1), "#EEF3F3");
      shine.addColorStop(Math.min(Math.max(sweep + 0.15, 0), 1), "#CBD5D6");
      shine.addColorStop(1, "#CBD5D6");
      // Soft-edged with a matching shadow rather than a blur filter, which
      // is slow on Safari.
      ctx.save();
      ctx.shadowColor = "#CBD5D6";
      ctx.shadowBlur = Math.max(2, w * 0.012);
      fillRound(ctx, bx, ay - bh / 2, bw, bh, bh / 2, shine);
      ctx.restore();
    }

    // "Open to see how much", the nudge every lock screen has.
    const nudge = ramp(b, 0.5, 0.75);
    if (nudge > 0) {
      ctx.save();
      ctx.globalAlpha *= nudge;
      text("Open on payday to see how much", x + w / 2, y + h * 0.86, size(0.042), "#ffffff", {
        align: "center",
        weight: 500,
      });
      ctx.restore();
    }
    fillRound(ctx, x + w * 0.35, y + h * 0.94, w * 0.3, h * 0.008, h * 0.004, "rgba(255,255,255,0.7)");
    ctx.restore();
  };

  const CONTENT: Partial<Record<ChapterId, Painter>> = { design, frontend, backend, mobile, stipend: lockScreen };

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

      // The instructor, a real face, named.
      const iw = 0.13 * s;
      face(instructor, I.x, I.y, iw, C.ink);
      if (instructor?.person) {
        text(instructor.person.name, I.x, I.y + iw + 16 * L.px, L.mobile ? 10.5 : 12.5, C.ink, { align: "center", weight: 700 });
        text("Instructor", I.x, I.y + iw + 31 * L.px, L.mobile ? 9.5 : 11, C.muted, { align: "center", weight: 500 });
      }

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

      // The mentor, a real face, named.
      face(mentor, mx, my, mw * 0.95, C.white);
      ctx.beginPath();
      ctx.arc(mx, my, mw * 0.95 + 3 * L.px, 0, Math.PI * 2);
      ctx.strokeStyle = C.teal;
      ctx.lineWidth = 2 * L.px;
      ctx.stroke();
      if (mentor?.person) {
        text(mentor.person.name, mx, my + mw + 18 * L.px, L.mobile ? 10.5 : 12.5, C.ink, { align: "center", weight: 700 });
      }

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

  /** Week one: the faces of the cohort pop in around the student. */
  function joinEnv({ A, alpha, local, time }: EnvArgs) {
    withAlpha(alpha, () => {
      const s = L.s;
      const count = cohortPhotos.length;
      // Two rings of real faces around the student: five close, the rest
      // further out.
      const inner = Math.min(5, count);
      cohortPhotos.forEach((img, k) => {
        const ring = k < inner ? 0 : 1;
        const slot = ring === 0 ? k / inner : (k - inner) / Math.max(count - inner, 1);
        const angle = slot * Math.PI * 2 - Math.PI / 2 + ring * 0.35;
        const radius = (ring === 0 ? 0.36 : 0.6) * s;
        const x = A.x + Math.cos(angle) * radius * 1.3;
        const y = A.y + Math.sin(angle) * radius * 0.92 + Math.sin(time * 1.5 + k) * 0.8 * L.px;
        const pop = easeOutBack(stagger(ramp(local, 0.12, 0.6), k, count, 0.6));
        if (pop <= 0) return;
        face(img, x, y, (ring === 0 ? 0.115 : 0.1) * s * pop, C.line);
      });
    });
  }

  const ENV: Partial<Record<ChapterId, (args: EnvArgs) => void>> = {
    join: joinEnv,
    track: trackEnv,
    backend: backendEnv,
    taught: taughtEnv,
    mentor: mentorEnv,
    together: togetherEnv,
  };

  /* ---------------- the three doors ---------------- */

  const DOOR_LABELS = ["Risevest", "Hiring partners", "Your own path"];

  /** Where door `k` sits: its centre, size and opacity. */
  type DoorPlace = { cx: number; cy: number; scale: number; alpha: number };

  /**
   * Blends the doors between two layouts. `m` 0 is the row of three under the
   * graduation copy; `m` 1 is one door at a time, stepped forward on the
   * left, with `f` (0..2, fractional mid-move) saying which. Neighbours wait
   * off to the sides, hidden, and slide through as `f` changes.
   */
  function doorPlace(k: number, row: Point, stage: Point, m: number, f: number): DoorPlace {
    const s = L.s;
    const d = k - f;
    const away = Math.min(Math.abs(d), 1);
    // Neighbours only drift a little and fade fast, so they never pass under
    // the copy on the other side; mid-move the two doors cross-fade.
    const slot = L.mobile ? L.w * 0.5 : L.w * 0.16;
    const solo = {
      cx: stage.x + d * slot,
      cy: stage.y,
      scale: DOOR_FOCUSED.scale * (1 - 0.3 * away),
      alpha: 1 - Math.min(Math.abs(d) * 1.25, 1),
    };
    const lined = { cx: row.x + (k - 1) * DOOR.gap * s, cy: row.y, scale: 1, alpha: 1 };
    return {
      cx: lerp(lined.cx, solo.cx, m),
      cy: lerp(lined.cy, solo.cy, m),
      scale: lerp(lined.scale, solo.scale, m),
      // The row thins out early as one door steps forward.
      alpha: lerp(lined.alpha, solo.alpha, Math.sqrt(m)),
    };
  }

  function door(k: number, place: DoorPlace, enter: number, focus: number, time: number) {
    const s = L.s;
    const rise = easeOutCubic(stagger(enter, k, 3, 0.5));
    if (rise <= 0 || place.alpha <= 0.01) return;
    const w = DOOR.w * s * place.scale;
    const h = DOOR.h * s * place.scale;
    const cx = place.cx;
    const cy = place.cy + (1 - rise) * 40 * L.px;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const arch = w / 2;
    const radii = [arch, arch, 10 * L.px, 10 * L.px];

    ctx.save();
    ctx.globalAlpha *= rise * place.alpha;

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
    ctx.globalAlpha *= rise * place.alpha;
    text(DOOR_LABELS[k], cx, y - 22 * L.px, L.mobile ? 10.5 : 13, focus > 0.5 ? C.teal : C.muted, { align: "center" });
    ctx.restore();
  }

  function doors(alpha: number, enter: number, m: number, f: number, time: number) {
    const row = anchor(INDEX.next);
    const stage = anchor(INDEX.rise);
    withAlpha(alpha, () => {
      // Furthest first, so the door in front is drawn on top.
      [0, 1, 2]
        .sort((a, b) => Math.abs(b - f) - Math.abs(a - f))
        .forEach((k) => {
          const focus = m * Math.max(0, 1 - Math.abs(k - f));
          door(k, doorPlace(k, row, stage, m, f), enter, focus, time);
        });
    });
  }

  function drawEnv(index: number, local: number, time: number) {
    const prevId = index > 0 ? CHAPTERS[index - 1].id : undefined;
    const id = CHAPTERS[index].id;
    const prevFocus = prevId ? DOOR_FOCUS[prevId] : undefined;
    const focus = DOOR_FOCUS[id];

    // The doors are one continuous scene across their four chapters, so
    // nothing fades out and back in. Graduation shows the row of three; on
    // each door's chapter that door steps forward on the left while the
    // others slide away, and moving on slides the next one into its place.
    if (focus !== undefined) {
      const move = easeInOutSine(ramp(local, 0, 0.5));
      if (prevFocus === undefined) {
        doors(1, easeInOutSine(ramp(local, 0.12, 0.6)), 0, 0, time);
        // Graduation follows the build, which still fades out underneath.
      } else if (prevFocus < 0) {
        doors(1, 1, move, focus, time);
        return;
      } else {
        doors(1, 1, 1, lerp(prevFocus, focus, move), time);
        return;
      }
    } else if (prevFocus !== undefined) {
      // Home: the last door dissolves into the pieces that fly back to the mark.
      doors(1 - ramp(local, 0.02, 0.18), 1, 1, prevFocus, time);
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

  /**
   * Payday turns the whole stage brand teal, like the opening screen: a
   * celebration, with the phone glowing softly in the middle of it.
   */
  function drawStipendField(index: number, local: number) {
    const field =
      CHAPTERS[index].id === "stipend"
        ? easeInOutSine(ramp(local, 0, 0.3))
        : index === INDEX.stipend + 1
          ? 1 - easeInOutSine(ramp(local, 0.04, 0.32))
          : 0;
    if (field <= 0) return;
    ctx.fillStyle = rgba(TEAL, field);
    ctx.fillRect(0, 0, L.w, L.h);
    const P = anchor(INDEX.stipend);
    const glow = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, L.s * 2.2);
    glow.addColorStop(0, rgba(WHITE, 0.14 * field));
    glow.addColorStop(1, rgba(WHITE, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(P.x - L.s * 2.3, P.y - L.s * 2.3, L.s * 4.6, L.s * 4.6);
  }

  /* ---------------- the mark ---------------- */

  let slot: { x: number; y: number; height: number } | null = null;

  function drawMark(index: number, local: number) {
    const id = CHAPTERS[index].id;

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

  /* ---------------- Rise Classroom ---------------- */

  /**
   * Rise Classroom's screens are drawn in iPhone points (390 × 844), laid out
   * from the app's Figma, then scaled onto the phone as one object.
   */
  const APP = { w: 390, h: 844, r: 55, bezel: 11 } as const;

  const UI = {
    bg: "#F7F9F9",
    card: "#EEF2F2",
    ink: "#111819",
    ink2: "#3D4A4D",
    muted: "#6B787A",
    hint: "#8A9597",
    chip: "#E3F3F4",
    banner: "#E3F2F3",
    green: "#2E7D32",
    grey: "#A3ABB0",
    blue: "#1D5BA6",
    blueBg: "#E6F0FB",
    blueLine: "#B9D3F0",
    amber: "#8A6400",
    amberBg: "#FBF1CF",
    amberLine: "#EED58A",
    tab: "#5D6B6E",
    red: "#D92D20",
  } as const;

  /** The app's body type; headings use the page's own face, as in the Figma. */
  const work = (() => {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-work-sans").trim();
    return family ? `${family}, ${sans}` : sans;
  })();

  /** What's in the student's Rise Classroom this week, by track. Mock content. */
  type AppContent = {
    next: string;
    course: string;
    lesson: string;
    latest: [string, string];
    due: string;
    submit: string;
  };

  const APP_CONTENT: Record<Track, AppContent> = {
    Design: {
      next: "Design Systems & Components",
      course: "Design Systems",
      lesson: "Buttons & Text Input",
      latest: ["Auto layout in Figma", "Colour and typography"],
      due: "Landing page wireframe",
      submit: "Submit a Figma link",
    },
    Frontend: {
      next: "React: State & Effects",
      course: "React",
      lesson: "Forms that feel right",
      latest: ["Fetching data in React", "Accessible components"],
      due: "Build a pricing page",
      submit: "Submit a GitHub link",
    },
    Backend: {
      next: "APIs & Authentication",
      course: "Databases",
      lesson: "SQL joins in practice",
      latest: ["REST APIs with Node", "Caching with Redis"],
      due: "Build a login API",
      submit: "Submit a GitHub link",
    },
    Mobile: {
      next: "Navigation in Flutter",
      course: "Flutter",
      lesson: "Layouts that adapt",
      latest: ["State with Riverpod", "Lists that scroll fast"],
      due: "Build a habit tracker",
      submit: "Submit a GitHub link",
    },
  };

  let student: Photo | null = null;

  /** Where the app icon sits on the phone's home screen, in points. */
  const ICON = { x: 195, y: 372, size: 84 };
  /** How far the home screen scrolls to show what's due. */
  const HOME_SCROLL = 96;

  type Rect = { x: number; y: number; w: number; h: number };

  /**
   * Notes that point into the app, one beat of the scroll each, tying it back
   * to the story: the classes, the progress, the deadlines, the recordings
   * and the mentor. `view` 0 is the home screen, 1 the lessons screen.
   */
  type Callout = {
    from: number;
    to: number;
    view: 0 | 1;
    /** Stays put while the home screen scrolls (the tab bar). */
    fixed?: boolean;
    title: string;
    body: string;
    /** The one-line version for phones. */
    short: string;
    target: Rect;
    r: number;
  };

  const CALLOUTS: Callout[] = [
    {
      from: 0.45,
      to: 0.58,
      view: 0,
      title: "Live classes",
      body: "Join in one tap, wherever you are.",
      short: "Join live classes in one tap",
      target: { x: 32, y: 251, w: 326, h: 40 },
      r: 10,
    },
    {
      from: 0.53,
      to: 0.67,
      view: 0,
      title: "Your progress",
      body: "See exactly how far you've come.",
      short: "See how far you've come",
      target: { x: 16, y: 399, w: 358, h: 197 },
      r: 20,
    },
    {
      from: 0.59,
      to: 0.67,
      view: 0,
      title: "Deadlines",
      body: "Every assignment, never a surprise.",
      short: "Never miss a deadline",
      target: { x: 16, y: 652, w: 358, h: 92 },
      r: 20,
    },
    {
      from: 0.73,
      to: 0.87,
      view: 1,
      title: "Every class, recorded",
      body: "Missed one? Catch up any time.",
      short: "Every class, recorded",
      target: { x: 16, y: 211, w: 358, h: 208 },
      r: 14,
    },
    {
      from: 0.79,
      to: 0.87,
      view: 1,
      fixed: true,
      title: "Your mentor",
      body: "A message away, all year.",
      short: "Your mentor, a message away",
      target: { x: 229, y: 746, w: 66, h: 51 },
      r: 25,
    },
  ];

  function calloutAlpha(c: Callout, t: number) {
    return ramp(t, c.from, c.from + 0.025) * (1 - ramp(t, c.to - 0.025, c.to));
  }

  function calloutTarget(c: Callout, scroll: number): Rect {
    return { ...c.target, y: c.target.y - (c.fixed || c.view === 1 ? 0 : scroll) };
  }

  /** The phone's screen, on the copy's opposite side; under the copy's top on phones. */
  function phoneBox(): Box {
    const ratio = APP.w / APP.h;
    // On phones it takes what's left above the copy (about 360px with its note).
    const h = L.mobile
      ? Math.min(L.h * 0.52, (L.w * 0.6) / ratio, L.h - 360)
      : Math.min(L.h * 0.76, (L.w * 0.3) / ratio);
    const w = h * ratio;
    const cx = L.mobile ? L.w / 2 : L.w * 0.63;
    const cy = L.mobile ? 76 + h / 2 : L.h * 0.53;
    return { x: cx - w / 2, y: cy - h / 2, w, h, r: (APP.r / APP.w) * w };
  }

  function scaleBox(box: Box, k: number): Box {
    const w = box.w * k;
    const h = box.h * k;
    return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h, r: box.r * k };
  }

  /** Text in the app's points; returns its width. */
  function say(
    value: string,
    x: number,
    y: number,
    size: number,
    color: string,
    { weight = 400, align = "left", family = work }: { weight?: number; align?: CanvasTextAlign; family?: string } = {}
  ) {
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
    return ctx.measureText(value).width;
  }

  function measure(value: string, size: number, weight = 400, family = work) {
    ctx.font = `${weight} ${size}px ${family}`;
    return ctx.measureText(value).width;
  }

  /** A pill label; `x` is its left edge, or its right edge when aligned right. */
  function pill(
    label: string,
    x: number,
    y: number,
    h: number,
    size: number,
    colors: { fill: string; line?: string; text: string },
    align: "left" | "right" = "left"
  ) {
    const w = measure(label, size, 500) + h * 0.95;
    const left = align === "left" ? x : x - w;
    fillRound(ctx, left, y, w, h, h / 2, colors.fill);
    if (colors.line) {
      roundRect(ctx, left + 0.5, y + 0.5, w - 1, h - 1, h / 2);
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    say(label, left + w / 2, y + h / 2 + 0.5, size, colors.text, { weight: 500, align: "center" });
    return w;
  }

  type Glyph =
    | "calendar"
    | "bell"
    | "person"
    | "video"
    | "play"
    | "right"
    | "up"
    | "down"
    | "file"
    | "search"
    | "check"
    | "home"
    | "book"
    | "tasks"
    | "chat";

  /** The app's line icons, drawn `s` points across. */
  function glyph(kind: Glyph, x: number, y: number, s: number, color: string, { width = 1.6, filled = false } = {}) {
    const h = s / 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    switch (kind) {
      case "calendar":
        ctx.roundRect(x - h, y - h * 0.8, s, s * 0.9, s * 0.2);
        ctx.moveTo(x - h, y - h * 0.2);
        ctx.lineTo(x + h, y - h * 0.2);
        ctx.moveTo(x - h * 0.45, y - h * 1.05);
        ctx.lineTo(x - h * 0.45, y - h * 0.6);
        ctx.moveTo(x + h * 0.45, y - h * 1.05);
        ctx.lineTo(x + h * 0.45, y - h * 0.6);
        ctx.stroke();
        ctx.beginPath();
        for (const [dx, dy] of [
          [-0.45, 0.22],
          [0, 0.22],
          [0.45, 0.22],
          [-0.45, 0.58],
          [0, 0.58],
        ]) {
          ctx.moveTo(x + dx * h + s * 0.06, y + dy * h);
          ctx.arc(x + dx * h, y + dy * h, s * 0.06, 0, Math.PI * 2);
        }
        ctx.fill();
        break;
      case "bell":
        ctx.moveTo(x - h * 0.8, y + h * 0.45);
        ctx.lineTo(x - h * 0.62, y + h * 0.2);
        ctx.lineTo(x - h * 0.62, y - h * 0.15);
        ctx.arc(x, y - h * 0.15, h * 0.62, Math.PI, 0);
        ctx.lineTo(x + h * 0.62, y + h * 0.2);
        ctx.lineTo(x + h * 0.8, y + h * 0.45);
        ctx.closePath();
        ctx.moveTo(x - h * 0.22, y + h * 0.72);
        ctx.quadraticCurveTo(x, y + h * 0.92, x + h * 0.22, y + h * 0.72);
        ctx.stroke();
        break;
      case "person":
        ctx.arc(x, y - h * 0.38, h * 0.42, 0, Math.PI * 2);
        ctx.moveTo(x - h * 0.85, y + h * 0.95);
        ctx.quadraticCurveTo(x - h * 0.85, y + h * 0.2, x, y + h * 0.2);
        ctx.quadraticCurveTo(x + h * 0.85, y + h * 0.2, x + h * 0.85, y + h * 0.95);
        ctx.stroke();
        break;
      case "video":
        ctx.roundRect(x - h, y - h * 0.6, s * 0.68, s * 0.6, s * 0.14);
        ctx.moveTo(x + h * 0.36, y - h * 0.15);
        ctx.lineTo(x + h, y - h * 0.5);
        ctx.lineTo(x + h, y + h * 0.5);
        ctx.lineTo(x + h * 0.36, y + h * 0.15);
        ctx.stroke();
        break;
      case "play":
        ctx.moveTo(x - h * 0.55, y - h * 0.75);
        ctx.lineTo(x + h * 0.75, y);
        ctx.lineTo(x - h * 0.55, y + h * 0.75);
        ctx.closePath();
        ctx.stroke();
        break;
      case "right":
        ctx.moveTo(x - h * 0.3, y - h * 0.6);
        ctx.lineTo(x + h * 0.3, y);
        ctx.lineTo(x - h * 0.3, y + h * 0.6);
        ctx.stroke();
        break;
      case "up":
      case "down": {
        const d = kind === "up" ? 1 : -1;
        ctx.moveTo(x - h * 0.6, y + h * 0.3 * d);
        ctx.lineTo(x, y - h * 0.3 * d);
        ctx.lineTo(x + h * 0.6, y + h * 0.3 * d);
        ctx.stroke();
        break;
      }
      case "file":
        ctx.moveTo(x - h * 0.6, y - h);
        ctx.lineTo(x + h * 0.2, y - h);
        ctx.lineTo(x + h * 0.65, y - h * 0.55);
        ctx.lineTo(x + h * 0.65, y + h);
        ctx.lineTo(x - h * 0.6, y + h);
        ctx.closePath();
        ctx.moveTo(x - h * 0.25, y + h * 0.05);
        ctx.lineTo(x + h * 0.3, y + h * 0.05);
        ctx.moveTo(x - h * 0.25, y + h * 0.45);
        ctx.lineTo(x + h * 0.3, y + h * 0.45);
        ctx.stroke();
        break;
      case "search":
        ctx.arc(x - h * 0.15, y - h * 0.15, h * 0.6, 0, Math.PI * 2);
        ctx.moveTo(x + h * 0.3, y + h * 0.3);
        ctx.lineTo(x + h * 0.85, y + h * 0.85);
        ctx.stroke();
        break;
      case "check":
        ctx.arc(x, y, h * 0.9, 0, Math.PI * 2);
        ctx.moveTo(x - h * 0.4, y);
        ctx.lineTo(x - h * 0.1, y + h * 0.32);
        ctx.lineTo(x + h * 0.42, y - h * 0.3);
        ctx.stroke();
        break;
      case "home":
        ctx.moveTo(x, y - h * 0.9);
        ctx.lineTo(x + h * 0.85, y - h * 0.25);
        ctx.lineTo(x + h * 0.85, y + h * 0.6);
        ctx.quadraticCurveTo(x + h * 0.85, y + h * 0.85, x + h * 0.6, y + h * 0.85);
        ctx.lineTo(x - h * 0.6, y + h * 0.85);
        ctx.quadraticCurveTo(x - h * 0.85, y + h * 0.85, x - h * 0.85, y + h * 0.6);
        ctx.lineTo(x - h * 0.85, y - h * 0.25);
        ctx.closePath();
        if (filled) ctx.fill();
        else ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - h * 0.3, y + h * 0.28);
        ctx.quadraticCurveTo(x, y + h * 0.52, x + h * 0.3, y + h * 0.28);
        ctx.strokeStyle = filled ? C.white : color;
        ctx.stroke();
        break;
      case "book":
        ctx.moveTo(x, y - h * 0.55);
        ctx.quadraticCurveTo(x - h * 0.45, y - h * 0.85, x - h * 0.95, y - h * 0.65);
        ctx.lineTo(x - h * 0.95, y + h * 0.65);
        ctx.quadraticCurveTo(x - h * 0.45, y + h * 0.45, x, y + h * 0.8);
        ctx.quadraticCurveTo(x + h * 0.45, y + h * 0.45, x + h * 0.95, y + h * 0.65);
        ctx.lineTo(x + h * 0.95, y - h * 0.65);
        ctx.quadraticCurveTo(x + h * 0.45, y - h * 0.85, x, y - h * 0.55);
        ctx.lineTo(x, y + h * 0.8);
        ctx.stroke();
        break;
      case "tasks":
        ctx.roundRect(x - h * 0.8, y - h * 0.9, h * 1.6, h * 1.8, h * 0.3);
        for (const dy of [-0.4, 0, 0.4]) {
          ctx.moveTo(x - h * 0.35, y + dy * h);
          ctx.lineTo(x + h * 0.4, y + dy * h);
        }
        ctx.stroke();
        break;
      case "chat":
        ctx.arc(x, y - h * 0.05, h * 0.85, Math.PI * 0.72, Math.PI * 0.72 + Math.PI * 1.85);
        ctx.lineTo(x - h * 0.85, y + h * 0.85);
        ctx.closePath();
        ctx.moveTo(x - h * 0.38, y - h * 0.22);
        ctx.lineTo(x + h * 0.38, y - h * 0.22);
        ctx.moveTo(x - h * 0.38, y + h * 0.14);
        ctx.lineTo(x + h * 0.14, y + h * 0.14);
        ctx.stroke();
        break;
    }
    ctx.restore();
  }

  /** The same teal wallpaper as payday's lock screen: it's the same phone. */
  function wallpaper() {
    const wall = ctx.createLinearGradient(0, 0, 0, APP.h);
    wall.addColorStop(0, "#0A4E56");
    wall.addColorStop(1, "#11818D");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, APP.w, APP.h);
    const mk = (APP.w * 0.8) / LOGO_VIEWBOX.width;
    ctx.save();
    ctx.globalAlpha *= 0.1;
    ctx.translate(APP.w * 0.1, APP.h * 0.56);
    ctx.scale(mk, mk);
    ctx.fillStyle = C.white;
    for (const path of bandPaths) ctx.fill(path);
    ctx.restore();
  }

  function statusBar(color: string) {
    say("9:41", 54, 29, 16, color, { weight: 600, align: "center", family: sans });
    for (let k = 0; k < 4; k++) {
      const bar = 4 + k * 2.4;
      fillRound(ctx, 288 + k * 4.6, 34 - bar, 3, bar, 1, color);
    }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    for (const r of [6.5, 10.5]) {
      ctx.beginPath();
      ctx.arc(322, 35, r, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(322, 33.5, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha *= 0.45;
    roundRect(ctx, 340.5, 23, 25, 12, 3.5);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    fillRound(ctx, 342.5, 25, 17, 8, 2, color);
    fillRound(ctx, 366.5, 27, 1.8, 4, 1, color);
  }

  /** A round photo, in points; pale until it loads. */
  function avatar(photo: Photo | null, x: number, y: number, r: number) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#D5DCDD";
    ctx.fill();
    if (photo && ready(photo.img)) {
      ctx.clip();
      cover(ctx, photo.img, { x: x - r, y: y - r, w: r * 2, h: r * 2 }, photo.focus, { zoom: 1.5 });
    }
    ctx.restore();
  }

  /**
   * The home screen, as in the Figma: who you are, your next live class,
   * the course you're part-way through, and what's due. `scroll` is how far
   * it has scrolled, `fill` how far the progress bar has grown, `pressed`
   * how hard the Join button is being tapped.
   */
  function homeScreen(appear: number, scroll: number, fill: number, pressed: number) {
    const content = APP_CONTENT[student?.person?.track ?? "Backend"];
    const block = (k: number, paint: () => void) => {
      const g = easeOutCubic(stagger(appear, k, 5, 0.6));
      if (g <= 0) return;
      ctx.save();
      ctx.globalAlpha *= g;
      ctx.translate(0, (1 - g) * 18 - scroll);
      paint();
      ctx.restore();
    };

    block(0, () => {
      avatar(student, 36, 93, 20);
      say(student?.person?.name ?? "You", 62, 80, 17, UI.ink, { weight: 500 });
      pill(student?.person?.track ?? "Backend", 60, 91.5, 23.5, 13.5, { fill: UI.chip, text: C.teal });
      for (const [x, kind] of [
        [300, "calendar"],
        [352, "bell"],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x, 93, 22, 0, Math.PI * 2);
        ctx.fillStyle = C.white;
        ctx.fill();
        glyph(kind, x, 93, 17, UI.ink);
      }
    });

    block(1, () => {
      fillRound(ctx, 16, 139, 358, 204, 20, UI.card);
      say("Next Class", 32, 163, 12.5, C.teal, { weight: 500 });
      say(content.next, 32, 192, 19.5, UI.ink, { weight: 500, family: sans });
      glyph("calendar", 40, 222, 13, UI.muted, { width: 1.4 });
      const when = say("Today · 6:00 pm", 53, 222, 13.5, UI.muted);
      glyph("person", 53 + when + 22, 222, 13, UI.muted, { width: 1.4 });
      say(instructor?.person?.name ?? "Your instructor", 53 + when + 34, 222, 13.5, UI.muted);

      fillRound(ctx, 32, 251, 326, 40, 10, rgba(mixRGB(TEAL, [6, 72, 80], pressed), 1));
      const label = measure("Join Class", 15.5, 500);
      const left = 195 - (label + 28) / 2;
      glyph("video", left + 9, 271, 18, C.white, { width: 1.7 });
      say("Join Class", left + 28, 271.5, 15.5, C.white, { weight: 500 });
      const more = measure("View Schedule", 14.5, 500);
      say("View Schedule", 188, 313, 14.5, C.teal, { weight: 500, align: "center" });
      glyph("right", 188 + more / 2 + 12, 313, 12, C.teal, { width: 1.8 });
    });

    block(2, () => {
      say("Continue Learning", 16, 381, 18.5, UI.ink, { weight: 500, family: sans });
      fillRound(ctx, 16, 399, 358, 197, 20, UI.card);
      ctx.save();
      roundRect(ctx, 32, 415, 326, 59, 10);
      ctx.clip();
      ctx.fillStyle = UI.banner;
      ctx.fillRect(32, 415, 326, 59);
      ctx.fillStyle = C.teal;
      for (const [cx, cy, r] of [
        [150.6, 415, 22.8],
        [69.6, 473.7, 23.2],
        [259.5, 481.2, 21],
      ]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      say(content.course, 342, 444.5, 20, UI.ink, { weight: 600, family: sans, align: "right" });
      say(content.lesson, 32, 497, 15.5, UI.ink, { weight: 500 });
      say("Week 16 · Lesson 2", 32, 520, 13.5, UI.ink2);
      // The bar grows as you watch: from where you were to where you are.
      const percent = lerp(35, 60, fill);
      const lit = Math.round((20 * percent) / 100);
      for (let k = 0; k < 20; k++) fillRound(ctx, 32 + k * 5.95, 540, 4.2, 19, 2.1, k < lit ? UI.green : UI.grey);
      say(`${Math.round(percent)}% Complete`, 158, 550, 15, UI.ink2);
      ctx.beginPath();
      ctx.arc(338, 550, 20, 0, Math.PI * 2);
      ctx.fillStyle = C.teal;
      ctx.fill();
      glyph("right", 338, 550, 13, C.white, { width: 2 });
    });

    block(3, () => {
      say("Due soon", 16, 634, 18.5, UI.ink, { weight: 500, family: sans });
      say("See all", 374, 634, 14.5, C.teal, { weight: 500, align: "right" });
      fillRound(ctx, 16, 652, 358, 92, 20, C.white);
      ctx.beginPath();
      ctx.arc(52, 698, 20, 0, Math.PI * 2);
      ctx.fillStyle = UI.card;
      ctx.fill();
      glyph("file", 52, 698, 16, UI.ink);
      say(content.due, 84, 687, 14, UI.ink, { weight: 500 });
      say(content.submit, 84, 709, 12.5, UI.muted);
      pill("Due in 1 day", 358, 686, 24, 12.5, { fill: UI.amberBg, line: UI.amberLine, text: UI.amber }, "right");
    });
  }

  /** The lessons screen: this week open, the weeks before folded up. */
  function lessonsScreen(appear: number) {
    const track = student?.person?.track ?? "Backend";
    const content = APP_CONTENT[track];
    const block = (k: number, paint: () => void) => {
      const g = easeOutCubic(stagger(appear, k, 5, 0.5));
      if (g <= 0) return;
      ctx.save();
      ctx.globalAlpha *= g;
      ctx.translate(0, (1 - g) * 14);
      paint();
      ctx.restore();
    };

    block(0, () => {
      say("Lessons", 16, 87, 26, UI.ink, { weight: 500, family: sans });
      say(`${track} track · Week 18 of 52`, 16, 117, 13.5, UI.muted);
      fillRound(ctx, 16, 147, 358, 44, 10, C.white);
      roundRect(ctx, 16.5, 147.5, 357, 43, 10);
      ctx.strokeStyle = "#DCE3E4";
      ctx.lineWidth = 1;
      ctx.stroke();
      glyph("search", 38, 169, 15, UI.muted);
      say("Search lessons by topic", 56, 169.5, 13.5, UI.hint);
    });

    block(1, () => {
      ctx.save();
      roundRect(ctx, 16, 211, 358, 208, 14);
      ctx.clip();
      ctx.fillStyle = C.white;
      ctx.fillRect(16, 211, 358, 208);
      ctx.fillStyle = UI.card;
      ctx.fillRect(16, 211, 358, 55);
      ctx.restore();
      roundRect(ctx, 16.5, 211.5, 357, 207, 14);
      ctx.strokeStyle = UI.card;
      ctx.lineWidth = 1;
      ctx.stroke();
      const week = say("Week 18", 32, 239, 16, UI.ink, { weight: 500, family: sans });
      pill("This week", 32 + week + 8, 227.5, 23, 12, { fill: UI.blueBg, line: UI.blueLine, text: UI.blue });
      glyph("up", 349, 239, 12, UI.ink, { width: 1.8 });

      const row = (y: number, title: string, sub: string, watched: boolean) => {
        fillRound(ctx, 32, y, 72, 48, 8, UI.card);
        glyph("play", 68, y + 24, 16, C.teal, { width: 2 });
        say(title, 116, y + 12, 14, UI.ink, { weight: 500 });
        say(sub, 116, y + 33, 11.5, UI.muted);
        if (watched) {
          const w = say("Watched", 357, y + 12, 12, UI.green, { weight: 500, align: "right" });
          glyph("check", 357 - w - 10, y + 12, 13, UI.green, { width: 1.4 });
        } else {
          pill("New", 357, y + 1, 23, 12, { fill: UI.blueBg, line: UI.blueLine, text: UI.blue }, "right");
        }
      };
      row(283, content.latest[0], "Lesson 2 · Sat, 10 Oct", false);
      ctx.fillStyle = "#E2E8E8";
      ctx.fillRect(32, 343, 326, 1);
      row(355, content.latest[1], "Lesson 1 · Wed, 7 Oct", true);
    });

    const folded = (k: number, y: number, title: string, sub: string, color: string) =>
      block(k, () => {
        fillRound(ctx, 16, y, 358, 70, 14, UI.card);
        say(title, 32, y + 24, 16, UI.ink, { weight: 500, family: sans });
        say(sub, 32, y + 48, 12.5, color);
        glyph("down", 349, y + 35, 12, UI.ink, { width: 1.8 });
      });
    folded(2, 431, "Week 17", "2 lessons · All watched", UI.muted);
    folded(3, 513, "Week 16", "2 lessons · 1 not watched", UI.amber);
    folded(4, 595, "Weeks 1 to 15", "30 lessons · All watched", UI.muted);
  }

  /** The floating tab bar; `view` slides its highlight from Home to Lessons. */
  function tabBar(appear: number, view: number, badge: number) {
    const g = easeOutCubic(stagger(appear, 4, 5, 0.6));
    if (g <= 0) return;
    ctx.save();
    ctx.globalAlpha *= g;
    ctx.translate(0, (1 - g) * 18);
    fillRound(ctx, 16, 741, 358, 61, 30.5, "rgba(238,242,242,0.97)");
    const xs = [61, 128, 195, 262, 329];
    fillRound(ctx, lerp(xs[0], xs[1], view) - 37, 746, 74, 51, 25.5, C.white);
    const tabs: [Glyph, string][] = [
      ["home", "Home"],
      ["book", "Lessons"],
      ["tasks", "Tasks"],
      ["chat", "Chats"],
      ["person", "You"],
    ];
    tabs.forEach(([kind, label], k) => {
      const on = (k === 0 ? 1 - view : k === 1 ? view : 0) > 0.5;
      const color = on ? C.teal : UI.tab;
      glyph(kind, xs[k], 764, 20, color, { width: 1.6, filled: on && kind === "home" });
      say(label, xs[k], 786, 11.5, color, { weight: on ? 500 : 400, align: "center" });
    });
    // A message from the mentor arrives.
    if (badge > 0) {
      const r = 7.5 * badge;
      ctx.beginPath();
      ctx.arc(274, 755, r, 0, Math.PI * 2);
      ctx.fillStyle = UI.red;
      ctx.fill();
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      say("1", 274, 755.5, 10 * badge, C.white, { weight: 600, align: "center" });
    }
    ctx.restore();
  }

  /** A fingertip on the glass: a soft press, then a ripple. In canvas pixels. */
  function touch(at: Point, k: number, unit: number) {
    if (k <= 0 || k >= 1) return;
    const show = Math.sin(Math.PI * k);
    const r = 19 * unit * (1.05 - 0.12 * Math.sin(Math.PI * clamp01(k * 1.6 - 0.3)));
    ctx.save();
    ctx.globalAlpha = show * 0.9;
    ctx.beginPath();
    ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
    ctx.fillStyle = rgba(INK, 0.22);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.5 * L.px;
    ctx.stroke();
    const ripple = ramp(k, 0.35, 1);
    if (ripple > 0) {
      ctx.globalAlpha = (1 - ripple) * 0.6;
      ctx.beginPath();
      ctx.arc(at.x, at.y, r * (1 + ripple * 1.4), 0, Math.PI * 2);
      ctx.strokeStyle = C.teal;
      ctx.lineWidth = 2 * L.px;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * The payoff: the mark the story has followed becomes the Rise Classroom
   * app icon on the student's phone, opens into the app, and the scroll
   * walks through it (the live class, progress, deadlines, recordings, the
   * mentor). Then the app closes back into the mark, ready for the last screen.
   */
  function drawClassroom(local: number, time: number) {
    const t = local;
    const arrive = easeOutCubic(ramp(t, 0.02, 0.18));
    const leave = easeInOutSine(ramp(t, 0.9, 1));
    const S = scaleBox(phoneBox(), lerp(0.94, 1, arrive) * lerp(1, 0.96, leave));
    const u = S.w / APP.w;
    const at = (x: number, y: number): Point => ({ x: S.x + x * u, y: S.y + y * u });
    const phone = arrive * (1 - leave);

    const grow = easeOutBack(ramp(t, 0.1, 0.18));
    const press = Math.sin(Math.PI * ramp(t, 0.215, 0.27));
    const launch = easeInOutCubic(ramp(t, 0.26, 0.4));
    const splashOut = easeInOutSine(ramp(t, 0.38, 0.42));
    const appear = ramp(t, 0.405, 0.52);
    const closing = easeInOutSine(ramp(t, 0.86, 0.9));
    const view = easeInOutCubic(ramp(t, 0.675, 0.72));
    const scroll = HOME_SCROLL * easeInOutCubic(ramp(t, 0.53, 0.6));
    const fill = easeOutCubic(ramp(t, 0.54, 0.6));
    const badge = easeOutBack(ramp(t, 0.78, 0.82));
    const joinPress = Math.sin(Math.PI * ramp(t, 0.475, 0.51));

    // The icon, in points: it grows behind the mark, dips when tapped, then
    // opens out into the whole screen.
    const side = ICON.size * grow * (1 - 0.08 * press);
    const tile = {
      x: lerp(ICON.x - side / 2, 0, launch),
      y: lerp(ICON.y - side / 2, 0, launch),
      w: lerp(side, APP.w, launch),
      h: lerp(side, APP.h, launch),
      r: lerp(side * 0.225, APP.r, launch),
    };
    const shown = CALLOUTS.map((c) => ({ c, a: calloutAlpha(c, t) * phone })).filter(({ a }) => a > 0.003);

    if (phone > 0.003) {
      ctx.save();
      ctx.globalAlpha = phone;
      const b = APP.bezel * u;
      // The body is a ring around the screen, so a half-faded phone never
      // shows dark through its screen.
      ctx.save();
      ctx.shadowColor = rgba(INK, 0.22);
      // Kept small on phones: big blurs every frame are costly on iOS.
      ctx.shadowBlur = (L.mobile ? 28 : 60) * L.px;
      ctx.shadowOffsetY = 28 * L.px;
      ctx.beginPath();
      ctx.roundRect(S.x - b, S.y - b, S.w + b * 2, S.h + b * 2, S.r + b);
      ctx.roundRect(S.x, S.y, S.w, S.h, S.r);
      ctx.fillStyle = "#0B1213";
      ctx.fill("evenodd");
      ctx.restore();
      roundRect(ctx, S.x - b + 1, S.y - b + 1, S.w + b * 2 - 2, S.h + b * 2 - 2, S.r + b - 1);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.translate(S.x, S.y);
      ctx.scale(u, u);
      roundRect(ctx, 0, 0, APP.w, APP.h, APP.r);
      ctx.clip();

      if (launch < 1) wallpaper();
      // Until it opens, the icon travels with the mark, drawn further down.
      if (launch > 0) fillRound(ctx, tile.x, tile.y, tile.w, tile.h, tile.r, rgba(mixRGB(WHITE, [247, 249, 249], launch), 1));
      const label = ramp(t, 0.15, 0.22) * (1 - ramp(launch, 0, 0.25));
      if (label > 0) {
        ctx.save();
        ctx.globalAlpha *= label;
        say("Rise Classroom", ICON.x, ICON.y + ICON.size / 2 + 16, 13, C.white, { weight: 500, align: "center" });
        ctx.restore();
      }

      const ui = 1 - closing;
      if (appear > 0 && ui > 0) {
        ctx.save();
        ctx.globalAlpha *= ui;
        // Tapping Lessons cross-fades the screens with a small slide.
        if (view < 1) {
          ctx.save();
          ctx.globalAlpha *= 1 - view;
          ctx.translate(-24 * view, 0);
          homeScreen(appear, scroll, fill, joinPress);
          ctx.restore();
        }
        if (view > 0) {
          ctx.save();
          ctx.globalAlpha *= view;
          ctx.translate(24 * (1 - view), 0);
          lessonsScreen(ramp(t, 0.69, 0.76));
          ctx.restore();
        }
        // Content scrolls under the status bar.
        ctx.save();
        ctx.globalAlpha *= easeOutCubic(appear);
        ctx.fillStyle = UI.bg;
        ctx.fillRect(0, 0, APP.w, 52);
        ctx.restore();
        tabBar(appear, view, badge);
        // What each note points at, ringed.
        for (const { c, a } of shown) {
          const r = calloutTarget(c, scroll);
          const pulse = reduced ? 1 : 0.7 + 0.3 * Math.sin(time * 3);
          ctx.save();
          ctx.globalAlpha *= a;
          fillRound(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, c.r + 4, rgba(TEAL, 0.06));
          roundRect(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, c.r + 4);
          ctx.strokeStyle = rgba(TEAL, 0.9 * pulse);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      const onApp = launch > 0.5;
      statusBar(onApp ? UI.ink : C.white);
      fillRound(ctx, 136, 11, 118, 34, 17, "#000000");
      fillRound(ctx, 135, 831, 120, 4.5, 2.25, onApp ? UI.ink : C.white);
      ctx.restore();
    }

    // The mark: from the middle of the page into the icon, out onto the
    // splash screen, gone while the app is open, then back to the middle.
    const end = { x: L.end.x + (LOGO_VIEWBOX.width * L.end.k) / 2, y: L.end.y + (LOGO_VIEWBOX.height * L.end.k) / 2, w: LOGO_VIEWBOX.width * L.end.k };
    const splash = { ...at(APP.w / 2, APP.h / 2), w: APP.w * 0.34 * u };
    let mark: { x: number; y: number; w: number };
    let markAlpha: number;
    if (t < 0.86) {
      const inIcon = at(lerp(ICON.x, APP.w / 2, launch), lerp(ICON.y, APP.h / 2, launch));
      const icon = { ...inIcon, w: lerp(ICON.size * 0.6 * (1 - 0.08 * press), APP.w * 0.34, launch) * u };
      const move = easeInOutCubic(ramp(t, 0, 0.17));
      mark = { x: lerp(end.x, icon.x, move), y: lerp(end.y, icon.y, move), w: lerp(end.w, icon.w, move) };
      // The splash is gone before the home screen arrives.
      mark.w *= 1 - 0.25 * splashOut;
      markAlpha = 1 - splashOut;
    } else {
      mark = { x: lerp(splash.x, end.x, leave), y: lerp(splash.y, end.y, leave), w: lerp(splash.w, end.w, leave) };
      markAlpha = closing;
    }
    // On its way in, the mark picks up the white tile that makes it the app
    // icon, so it lands on the phone already an icon.
    if (launch === 0 && grow > 0) {
      const tileSide = (mark.w / 0.6) * grow;
      ctx.save();
      ctx.shadowColor = rgba(INK, 0.16 * clamp01(grow));
      ctx.shadowBlur = 24 * L.px;
      ctx.shadowOffsetY = 10 * L.px;
      fillRound(ctx, mark.x - tileSide / 2, mark.y - tileSide / 2, tileSide, tileSide, tileSide * 0.225, C.white);
      ctx.restore();
    }
    if (markAlpha > 0.003) {
      const k = mark.w / LOGO_VIEWBOX.width;
      ctx.save();
      ctx.globalAlpha = markAlpha;
      drawLogo({ x: mark.x - mark.w / 2, y: mark.y - (LOGO_VIEWBOX.height * k) / 2, k }, C.teal);
      ctx.restore();
    }

    if (!reduced) {
      ctx.save();
      ctx.globalAlpha = phone;
      touch(at(ICON.x, ICON.y), ramp(t, 0.2, 0.285), u);
      touch(at(195, 271), ramp(t, 0.465, 0.525), u);
      touch(at(128, 771), ramp(t, 0.645, 0.7), u);
      ctx.restore();
    }

    drawCallouts(S, u, shown, scroll);
  }

  /**
   * The notes beside the phone, each with a line to what it points at. Where
   * there's no room beside it (phones, narrow screens), one short note at a
   * time sits under the phone instead.
   */
  function drawCallouts(S: Box, u: number, shown: { c: Callout; a: number }[], scroll: number) {
    if (shown.length === 0) return;
    const b = APP.bezel * u;
    const px = L.px;
    const left = S.x + S.w + b + 40 * px;
    const room = L.w - 64 - left;

    if (!L.mobile && room >= 190 * px) {
      const ch = 66 * px;
      const gap = 12 * px;
      const cards = shown
        .map(({ c, a }) => {
          const r = calloutTarget(c, scroll);
          // Most notes point at the right edge of what they're about; the
          // tab bar's are pointed at from above, clear of the other tabs.
          const target = c.fixed
            ? { x: S.x + (r.x + r.w / 2) * u, y: S.y + r.y * u }
            : { x: S.x + (r.x + r.w) * u, y: S.y + (r.y + r.h / 2) * u };
          const want = c.fixed ? target.y - 70 * px : target.y;
          const y = Math.min(Math.max(want, S.y + ch / 2), S.y + S.h - ch / 2);
          return { c, a, target, y };
        })
        .sort((p, q) => p.y - q.y);
      cards.forEach((card, k) => {
        if (k > 0) card.y = Math.max(card.y, cards[k - 1].y + ch + gap);
      });

      for (const { c, a, target, y } of cards) {
        const e = easeOutCubic(a);
        const x = left + (1 - e) * 16 * px;
        const top = y - ch / 2;
        // Sized to its words, within the room there is.
        ctx.font = font(15, 700);
        const titleW = ctx.measureText(c.title).width;
        ctx.font = font(13, 500, work);
        const cw = Math.min(Math.max(titleW, ctx.measureText(c.body).width) + 44 * px, room);
        ctx.save();
        ctx.globalAlpha = a;

        // The line from the note to what it's about.
        const from = { x: x - 4 * px, y };
        const tip = c.fixed ? { x: target.x, y: target.y - 4 * px } : { x: target.x + 6 * px, y: target.y };
        const to = { x: lerp(from.x, tip.x, e), y: lerp(from.y, tip.y, e) };
        ctx.strokeStyle = rgba(TEAL, 0.85);
        ctx.lineWidth = 1.5 * px;
        strokeLine(ctx, from, to);
        ctx.beginPath();
        ctx.arc(to.x, to.y, 4 * px, 0, Math.PI * 2);
        ctx.fillStyle = C.teal;
        ctx.fill();
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 2 * px;
        ctx.stroke();

        ctx.save();
        ctx.shadowColor = rgba(INK, 0.1);
        ctx.shadowBlur = 24 * px;
        ctx.shadowOffsetY = 8 * px;
        fillRound(ctx, x, top, cw, ch, 14 * px, C.white);
        ctx.restore();
        roundRect(ctx, x + 0.5, top + 0.5, cw - 1, ch - 1, 14 * px);
        ctx.strokeStyle = C.faint;
        ctx.lineWidth = 1;
        ctx.stroke();
        fillRound(ctx, x + 12 * px, top + 15 * px, 3 * px, ch - 30 * px, 1.5 * px, C.teal);
        text(c.title, x + 24 * px, top + 24 * px, 15, C.ink, { weight: 700 });
        text(c.body, x + 24 * px, top + 45 * px, 13, C.muted, { weight: 500, family: work });
        ctx.restore();
      }
      return;
    }

    // One note at a time: a later one takes over from the one before.
    let cover = 0;
    for (let k = shown.length - 1; k >= 0; k--) {
      const { c, a } = shown[k];
      const alpha = a * (1 - cover);
      cover = Math.max(cover, a);
      if (alpha <= 0.003) continue;
      const size = L.mobile ? 12.5 : 13.5;
      ctx.font = font(size, 600);
      const w = ctx.measureText(c.short).width + 44 * px;
      const h = 34 * px;
      const x = S.x + S.w / 2 - w / 2;
      const y = S.y + S.h + b + 14 * px + (1 - easeOutCubic(alpha)) * 8 * px;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = rgba(INK, 0.12);
      ctx.shadowBlur = 18 * px;
      ctx.shadowOffsetY = 6 * px;
      fillRound(ctx, x, y, w, h, h / 2, C.white);
      ctx.shadowColor = "transparent";
      ctx.beginPath();
      ctx.arc(x + 18 * px, y + h / 2, 4 * px, 0, Math.PI * 2);
      ctx.fillStyle = C.teal;
      ctx.fill();
      text(c.short, x + 30 * px, y + h / 2 + 0.5, size, C.ink);
      ctx.restore();
    }
  }


  /* ---------------- frame ---------------- */

  let intro = 1;

  function draw(progress: number, rawTime: number, introProgress = 1) {
    const time = reduced ? 0 : rawTime;
    intro = reduced ? 1 : clamp01(introProgress);
    const { index, local } = storyPosition(progress, reduced);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, L.w, L.h);

    // The hero answers the pointer only while the mark is still whole.
    const hero = index === 0;
    stepOffsets(rawTime, hero && intro >= 1 && local < 0.1);
    stepSlide(rawTime);

    drawStipendField(index, local);
    drawEnv(index, local, time);
    drawPieces(index, local, time);
    drawCard(index, local, time);
    drawMark(index, local);
    if (CHAPTERS[index].id === "classroom") drawClassroom(local, time);
  }

  resize();
  return {
    resize,
    draw,
    setSlot(next) {
      slot = next;
    },
    setHeroBox(next) {
      heroBox = next;
      L = computeLayout(L.w, L.h);
      fitHero();
      paintSprites();
    },
    setPeople(people) {
      heroPhotos = people.hero.slice(0, 7).map((person) => photoOf(person, 1200));
      const first = heroPhotos[0]?.img;
      if (!first) markHeroReady();
      else if (ready(first)) markHeroReady();
      else {
        first.addEventListener("load", markHeroReady, { once: true });
        first.addEventListener("error", markHeroReady, { once: true });
      }
      cohortPhotos = people.cohort.slice(0, 11).map((src) => load(src, 256));
      instructor = photoOf(people.instructor);
      student = photoOf(people.student);
      mentor = photoOf(people.mentor);
      paintSprites();
    },
    setPointer(next) {
      pointer = next;
    },
    heroReady() {
      return heroReadyPromise;
    },
    heroSlide() {
      return slide;
    },
  };
}
