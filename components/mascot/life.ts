/** Something in the air around the companion: the morning sun, Monday's watering, the moon. */
export type Scene = "sun" | "rain" | "moon";

export type Ambient = {
  scene?: Scene;
  /** What the companion is up to right now, in its own words. */
  status: string;
  asleep: boolean;
};

/** What the companion is doing at this hour, whether or not the student is around. */
export function ambientLife(now: Date = new Date()): Ambient {
  const hour = now.getHours();
  const day = now.getDay();

  if (hour >= 21 || hour < 6) {
    return { scene: "moon", status: "Asleep until sunrise", asleep: true };
  }
  if (hour < 11) {
    return day === 1
      ? { scene: "rain", status: "Monday is watering day", asleep: false }
      : { scene: "sun", status: "Soaking up the morning sun", asleep: false };
  }
  if (day === 0 || day === 6) return { status: "Taking the weekend slowly", asleep: false };
  if (hour >= 18) return { status: "Winding down for the evening", asleep: false };
  return { status: "Growing quietly", asleep: false };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The visit record is "<day before the latest>|<latest day>". Recording a
 * visit on a new day shifts the latest across, so for the rest of that day the
 * companion still knows when the student was last here before today.
 */
export function recordVisit(stored: string | null, today: string) {
  const latest = stored?.split("|")[1] ?? "";
  return latest === today ? (stored as string) : `${latest}|${today}`;
}

/** Whole days between the visit before the latest one and the latest; 0 when unknown. */
export function daysAway(stored: string | null) {
  const [previous, latest] = stored?.split("|") ?? [];
  if (!previous || !latest) return 0;
  const days = Math.round((Date.parse(latest) - Date.parse(previous)) / DAY_MS);
  return Number.isFinite(days) ? Math.max(0, days) : 0;
}
