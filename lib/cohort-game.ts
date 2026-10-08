/**
 * Rules for the hidden "Gather your cohort" game on the landing page: steer
 * through the room, pick up your classmates so they follow you in a line,
 * and dodge the bugs that scatter them. Nobody loses; the score is time.
 */

export type Point = { x: number; y: number };

/** Classmates to gather. With you, that's the 60 people of a cohort. */
export const CLASSMATES = 59;

/** Space between people in the line, in pixels. */
export const SPACING = 18;

/** How many people a bug knocks off the end of your line. */
export const SCATTERED_PER_HIT = 4;

/** Bugs in the room: a couple to start, one more for every 20 people gathered. */
export function bugCount(gathered: number) {
  return 2 + Math.floor(gathered / 20);
}

/**
 * How far away classmates notice you and drift your way, in pixels at the
 * base size. The last few left come looking for you, so the end never
 * turns into a hunt round the edges.
 */
export function noticeRadius(remaining: number) {
  return 110 + Math.max(0, 12 - remaining) * 40;
}

/** How many a bug scatters from a line this long. */
export function scattered(lineLength: number) {
  return Math.min(SCATTERED_PER_HIT, Math.max(lineLength, 0));
}

export function touching(a: Point, b: Point, reach: number) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= reach * reach;
}

/**
 * The point `distance` along a path, measured back from its newest point.
 * `path` is newest first. Past the end it returns the oldest point, so
 * people at the back of a fresh line wait there until the path is long enough.
 */
export function alongPath(path: readonly Point[], distance: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  let left = Math.max(distance, 0);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const step = Math.hypot(b.x - a.x, b.y - a.y);
    if (step >= left && step > 0) {
      const t = left / step;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    left -= step;
  }
  return path[path.length - 1];
}

/** Drops path points beyond `length`, keeping one past it so `alongPath` stays exact. */
export function trimPath(path: Point[], length: number) {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    if (total > length) {
      path.length = i + 1;
      return path;
    }
  }
  return path;
}

/** Seconds as m:ss. */
export function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
