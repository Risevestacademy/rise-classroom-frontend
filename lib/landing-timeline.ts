/**
 * Scroll maths for the landing page story. The whole page is one timeline:
 * scroll progress runs from 0 to 1, and each chapter owns a slice of it sized
 * by how many screens of scrolling it gets. Everything on screen is a pure
 * function of that one number, so scrolling back plays the story in reverse.
 */

export type ChapterSpan = { start: number; end: number };

/** Turns per-chapter lengths (in screens) into slices of 0..1, in order. */
export function chapterSpans(lengths: readonly number[]): ChapterSpan[] {
  const total = lengths.reduce((sum, length) => sum + length, 0);
  if (total <= 0) return lengths.map(() => ({ start: 0, end: 0 }));

  let cursor = 0;
  return lengths.map((length) => {
    const start = cursor / total;
    cursor += length;
    return { start, end: cursor / total };
  });
}

/** Which chapter `progress` falls in, and how far through it (0..1). */
export function locate(spans: readonly ChapterSpan[], progress: number) {
  const p = clamp01(progress);
  for (let index = 0; index < spans.length; index++) {
    const { start, end } = spans[index];
    if (p < end || index === spans.length - 1) {
      const local = end > start ? clamp01((p - start) / (end - start)) : 1;
      return { index, local };
    }
  }
  return { index: 0, local: 0 };
}

export function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** 0 before `from`, 1 after `to`, linear in between. */
export function ramp(t: number, from: number, to: number) {
  return to > from ? clamp01((t - from) / (to - from)) : t >= to ? 1 : 0;
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** The gentlest in-out: no sudden acceleration, for long transitions. */
export function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/** Ease out with a small overshoot, for things that land and settle. */
export function easeOutBack(t: number) {
  const c = 1.4;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

/**
 * Spreads one 0..1 transition across `count` items so they start one after
 * another: item 0 starts at once, the last starts `spread` of the way in, and
 * every item still finishes by t = 1.
 */
export function stagger(t: number, index: number, count: number, spread = 0.5) {
  return staggerAt(t, count > 1 ? index / (count - 1) : 0, spread);
}

/** Like `stagger`, but the item's place in line is given directly as 0..1. */
export function staggerAt(t: number, order: number, spread = 0.5) {
  const start = clamp01(order) * spread;
  return ramp(t, start, start + (1 - spread));
}
