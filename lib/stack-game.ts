/**
 * Rules for the hidden "Stack" game on the home page: drop sliding slabs onto
 * the tower, whatever hangs over the edge is cut off, and every slab is one
 * week of the 52-week program.
 */

export type Slab = { x: number; width: number };

export type DropResult =
  | { kind: "miss" }
  | { kind: "perfect"; placed: Slab }
  | { kind: "cut"; placed: Slab; offcut: Slab };

export const GRADUATION_WEEK = 52;

/** Close enough to count as a clean drop, in pixels. */
export const PERFECT_TOLERANCE = 4;

export function resolveDrop(
  below: Slab,
  moving: Slab,
  tolerance = PERFECT_TOLERANCE
): DropResult {
  if (Math.abs(moving.x - below.x) <= tolerance) {
    return { kind: "perfect", placed: { x: below.x, width: moving.width } };
  }

  const left = Math.max(below.x, moving.x);
  const right = Math.min(below.x + below.width, moving.x + moving.width);
  const overlap = right - left;

  if (overlap <= 0) return { kind: "miss" };

  const offcut =
    moving.x < below.x
      ? { x: moving.x, width: below.x - moving.x }
      : { x: right, width: moving.x + moving.width - right };

  return { kind: "cut", placed: { x: left, width: overlap }, offcut };
}

/** Pixels per frame. Speeds up as the tower grows, up to a ceiling. */
export function slideSpeed(weeks: number) {
  return Math.min(2.4 + weeks * 0.11, 8);
}

export function gritLevel(weeks: number) {
  if (weeks >= GRADUATION_WEEK) return "Graduated. Legendary grit.";
  if (weeks >= 40) return "So close to graduation. Serious grit.";
  if (weeks >= 20) return "Halfway there. Real grit.";
  if (weeks >= 8) return "Finding your rhythm.";
  return "Every engineer starts somewhere.";
}
