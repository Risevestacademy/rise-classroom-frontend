import type { Track } from "@/components/home/cohort";

/**
 * The four pieces of work on the studio canvas, one per track, drawn in the
 * style of the Rise illustrations: white surfaces, a thin ink outline, teal
 * accents. Each is split into
 *  - blocks: the UI pieces that lift out and fly into the logo, and
 *  - decoration: everything that stays put (frame, chrome, text) and fades
 *    while its blocks are away.
 */

export type Rgb = readonly [number, number, number];

/** Mirrors the tokens in app/globals.css — canvas can't read Tailwind classes. */
export const PALETTE = {
  ink: "#111819", // neutral-700
  muted: "#647274", // neutral-300
  faint: "#CBD5D6", // neutral-200
  white: "#FFFFFF",
  teal: [13, 109, 120] as Rgb, // brand-primary
  tint50: [232, 245, 246] as Rgb, // surface-brand
  tint100: [180, 210, 213] as Rgb, // decorative tint (not a design token)
  tint200: [144, 188, 193] as Rgb, // decorative tint (not a design token)
  tint300: [93, 157, 165] as Rgb, // decorative tint (not a design token)
  success: [46, 125, 50] as Rgb, // icon-success
  warning: [138, 97, 0] as Rgb, // icon-warning
};

export type Rect = { x: number; y: number; w: number; h: number };

export type BlockShape = "pill" | "rect" | "circle";

export type BlockSpec = Rect & { color: Rgb; shape: BlockShape };

export type Artifact = {
  track: Track;
  /** The file-name label above the card, like a frame name in a design tool. */
  label: string;
  rect: Rect;
  radius: number;
  blocks: BlockSpec[];
  decorate: (ctx: CanvasRenderingContext2D, fonts: Fonts) => void;
};

export type Fonts = { sans: string; mono: string };

const pill = (x: number, y: number, w: number, h: number, color: Rgb): BlockSpec => ({
  x, y, w, h, color, shape: "pill",
});
const box = (x: number, y: number, w: number, h: number, color: Rgb): BlockSpec => ({
  x, y, w, h, color, shape: "rect",
});
const dot = (cx: number, cy: number, d: number, color: Rgb): BlockSpec => ({
  x: cx - d / 2, y: cy - d / 2, w: d, h: d, color, shape: "circle",
});

function card(ctx: CanvasRenderingContext2D, rect: Rect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
  ctx.fillStyle = PALETTE.white;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = PALETTE.ink;
  ctx.stroke();
}

function rule(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = PALETTE.ink;
  ctx.stroke();
}

/** A design file: an avatar, layers, a type specimen, swatches and a pen path. */
function designFrame(r: Rect): Artifact {
  const p = Math.min(r.w, r.h) * 0.09;
  const avatar = r.h * 0.2;
  const textX = r.x + p + avatar + p * 0.7;
  const swatch = r.h * 0.1;
  const button = { w: r.w * 0.26, h: r.h * 0.1 };

  const blocks: BlockSpec[] = [
    dot(r.x + p + avatar / 2, r.y + p + avatar / 2, avatar, PALETTE.tint100),
    pill(textX, r.y + p + avatar * 0.18, r.w * 0.34, r.h * 0.065, PALETTE.teal),
    pill(textX, r.y + p + avatar * 0.62, r.w * 0.22, r.h * 0.05, PALETTE.tint200),
    ...[0, 1, 2].map((i) =>
      pill(r.x + p, r.y + p + avatar + p * 0.9 + i * r.h * 0.085, r.w * (0.3 - i * 0.04), r.h * 0.045, PALETTE.tint200)
    ),
    ...[PALETTE.teal, PALETTE.tint300, PALETTE.success, PALETTE.warning].map((color, i) =>
      dot(r.x + p + swatch / 2 + i * swatch * 1.35, r.y + r.h - p - swatch / 2, swatch, color)
    ),
    pill(r.x + r.w - p - button.w, r.y + r.h - p - button.h, button.w, button.h, PALETTE.teal),
  ];

  return {
    track: "Design",
    label: "design/onboarding.fig",
    rect: r,
    radius: 12,
    blocks,
    decorate(ctx, fonts) {
      card(ctx, r, 12);

      // Type specimen.
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${Math.round(r.h * 0.17)}px ${fonts.sans}`;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText("Aa", r.x + r.w - p, r.y + p * 0.8);

      // A pen-tool path with its handles.
      const start = { x: r.x + r.w * 0.48, y: r.y + r.h * 0.68 };
      const end = { x: r.x + r.w - p * 1.1, y: r.y + r.h * 0.44 };
      const c1 = { x: r.x + r.w * 0.62, y: r.y + r.h * 0.4 };
      const c2 = { x: r.x + r.w * 0.72, y: r.y + r.h * 0.78 };

      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.globalAlpha *= 0.5;
      for (const [a, b] of [[start, c1], [end, c2]]) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.ink;
        ctx.fill();
      }
      ctx.globalAlpha /= 0.5;

      for (const point of [start, end]) {
        ctx.beginPath();
        ctx.rect(point.x - 3.5, point.y - 3.5, 7, 7);
        ctx.fillStyle = PALETTE.white;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    },
  };
}

/** A web page in a browser window. */
function browserWindow(r: Rect): Artifact {
  const p = Math.min(r.w, r.h) * 0.08;
  const chrome = r.h * 0.13;
  const top = r.y + chrome + p * 0.8;
  const inner = r.w - p * 2;
  const tile = { gap: p * 0.6, h: r.h * 0.17 };
  const tileW = (inner - tile.gap * 2) / 3;

  const blocks: BlockSpec[] = [
    ...[0, 1, 2].map((i) =>
      dot(r.x + p * 0.8 + i * chrome * 0.42, r.y + chrome / 2, chrome * 0.26, PALETTE.tint200)
    ),
    pill(r.x + r.w * 0.3, r.y + chrome * 0.29, r.w * 0.5, chrome * 0.42, PALETTE.tint50),
    box(r.x + p, top, r.h * 0.06, r.h * 0.06, PALETTE.teal),
    ...[0, 1, 2].map((i) =>
      pill(r.x + r.w - p - r.w * 0.1 * (i + 1) - p * 0.4 * i, top + r.h * 0.015, r.w * 0.1, r.h * 0.03, PALETTE.tint200)
    ),
    pill(r.x + p, top + r.h * 0.12, inner * 0.68, r.h * 0.07, PALETTE.teal),
    pill(r.x + p, top + r.h * 0.21, inner * 0.48, r.h * 0.07, PALETTE.teal),
    pill(r.x + p, top + r.h * 0.31, inner * 0.6, r.h * 0.035, PALETTE.tint200),
    pill(r.x + p, top + r.h * 0.37, inner * 0.5, r.h * 0.035, PALETTE.tint200),
    pill(r.x + p, top + r.h * 0.45, r.w * 0.24, r.h * 0.085, PALETTE.teal),
    ...[0, 1, 2].map((i) =>
      box(r.x + p + i * (tileW + tile.gap), r.y + r.h - p - tile.h, tileW, tile.h, PALETTE.tint100)
    ),
  ];

  return {
    track: "Frontend",
    label: "frontend/landing.tsx",
    rect: r,
    radius: 12,
    blocks,
    decorate(ctx) {
      card(ctx, r, 12);
      rule(ctx, r.x, r.y + chrome, r.x + r.w);
    },
  };
}

/** A code editor with a request coming back in the terminal. */
function codeEditor(r: Rect): Artifact {
  const p = Math.min(r.w, r.h) * 0.08;
  const header = r.h * 0.13;
  const footer = r.h * 0.15;
  const codeTop = r.y + header + p * 0.5;
  const lineH = (r.h - header - footer - p) / 7;
  const barH = lineH * 0.4;
  const codeX = r.x + p + r.w * 0.07;
  const indent = r.w * 0.06;

  const lines: [number, [number, Rgb][]][] = [
    [0, [[0.14, PALETTE.teal], [0.24, PALETTE.tint200]]],
    [0, [[0.4, PALETTE.tint200]]],
    [0, [[0.12, PALETTE.teal], [0.2, PALETTE.tint300], [0.1, PALETTE.tint200]]],
    [1, [[0.1, PALETTE.teal], [0.3, PALETTE.tint200]]],
    [2, [[0.26, PALETTE.success]]],
    [1, [[0.08, PALETTE.teal], [0.2, PALETTE.tint200]]],
    [0, [[0.05, PALETTE.tint200]]],
  ];

  const blocks: BlockSpec[] = [
    pill(r.x + p, r.y + header * 0.25, r.w * 0.34, header * 0.5, PALETTE.tint50),
  ];
  lines.forEach(([depth, parts], row) => {
    let x = codeX + depth * indent;
    const y = codeTop + row * lineH + (lineH - barH) / 2;
    for (const [length, color] of parts) {
      blocks.push(pill(x, y, r.w * length, barH, color));
      x += r.w * length + r.w * 0.02;
    }
  });
  const status = { w: r.w * 0.17, h: footer * 0.42 };
  blocks.push(
    pill(r.x + p, r.y + r.h - footer / 2 - status.h / 2, status.w, status.h, PALETTE.success)
  );

  return {
    track: "Backend",
    label: "backend/cohorts.ts",
    rect: r,
    radius: 12,
    blocks,
    decorate(ctx, fonts) {
      card(ctx, r, 12);
      rule(ctx, r.x, r.y + header, r.x + r.w);
      rule(ctx, r.x, r.y + r.h - footer, r.x + r.w);

      const size = Math.max(Math.round(lineH * 0.42), 9);
      ctx.font = `500 ${size}px ${fonts.mono}`;
      ctx.textBaseline = "middle";

      // Line numbers.
      ctx.fillStyle = PALETTE.faint;
      ctx.textAlign = "left";
      lines.forEach((_, row) => {
        ctx.fillText(String(row + 1), r.x + p, codeTop + row * lineH + lineH / 2);
      });

      // The request in the terminal strip.
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText(
        "GET /api/v1/cohorts",
        r.x + p + status.w + p * 0.6,
        r.y + r.h - footer / 2
      );
    },
  };
}

/** A phone on a profile screen — the same phone as the Rise illustrations. */
function phoneScreen(slot: Rect): Artifact {
  const h = slot.h;
  const w = Math.min(slot.w * 0.62, h * 0.52);
  const r = { x: slot.x + (slot.w - w) / 2, y: slot.y, w, h };
  const radius = w * 0.16;
  const p = w * 0.12;
  const avatar = w * 0.3;
  const field = { w: w - p * 2, h: h * 0.075, gap: h * 0.035 };
  const fieldsTop = r.y + h * 0.36;
  const cta = w * 0.22;

  const blocks: BlockSpec[] = [
    dot(r.x + w / 2, r.y + h * 0.16, avatar, PALETTE.tint100),
    pill(r.x + (w - w * 0.5) / 2, r.y + h * 0.27, w * 0.5, h * 0.03, PALETTE.teal),
  ];
  for (let i = 0; i < 3; i++) {
    const y = fieldsTop + i * (field.h + field.gap);
    blocks.push(
      box(r.x + p, y, field.w, field.h, PALETTE.tint50),
      dot(r.x + p + field.h / 2, y + field.h / 2, field.h * 0.4, PALETTE.tint200),
      pill(r.x + p + field.h, y + field.h * 0.38, field.w * 0.45, field.h * 0.24, PALETTE.tint200)
    );
  }
  blocks.push(dot(r.x + w / 2, r.y + h * 0.84, cta, PALETTE.teal));

  return {
    track: "Mobile",
    label: "mobile/ProfileScreen.kt",
    rect: r,
    radius,
    blocks,
    decorate(ctx) {
      card(ctx, r, radius);
      // The notch.
      ctx.beginPath();
      ctx.roundRect(r.x + w * 0.34, r.y + h * 0.025, w * 0.32, h * 0.035, h * 0.02);
      ctx.fillStyle = PALETTE.ink;
      ctx.fill();
    },
  };
}

/**
 * Lays the four pieces out around the centre of the page: two columns either
 * side of the headline on wide screens, two rows above and below it on narrow
 * ones.
 */
export function layoutArtifacts(width: number, height: number): Artifact[] {
  const wide = width >= 900;

  let slots: Record<Track, Rect>;
  if (wide) {
    const w = Math.min(Math.max(width * 0.21, 220), 320);
    const h = Math.min(Math.max(height * 0.3, 190), 270);
    const left = Math.max(width * 0.05, 32);
    const right = width - left - w;
    const top = Math.max(height * 0.15, 96);
    const bottom = height - h - Math.max(height * 0.1, 80);
    slots = {
      Design: { x: left, y: top, w, h },
      Frontend: { x: right, y: top, w, h },
      Backend: { x: left, y: bottom, w, h },
      Mobile: { x: right, y: bottom, w, h },
    };
  } else {
    const gap = 16;
    const w = (width - gap * 3) / 2;
    const h = Math.min(Math.max(height * 0.2, 130), 200);
    const top = 96;
    const bottom = height - h - 72;
    slots = {
      Design: { x: gap, y: top, w, h },
      Frontend: { x: gap * 2 + w, y: top, w, h },
      Backend: { x: gap, y: bottom, w, h },
      Mobile: { x: gap * 2 + w, y: bottom, w, h },
    };
  }

  return [
    designFrame(slots.Design),
    browserWindow(slots.Frontend),
    codeEditor(slots.Backend),
    phoneScreen(slots.Mobile),
  ];
}
