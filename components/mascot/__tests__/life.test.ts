import { describe, expect, it } from "vitest";

import { ambientLife, dayKey, daysAway, recordVisit } from "../life";

// Local time, as the student's clock reads it.
const at = (day: number, hour: number) => new Date(2026, 10, day, hour);

describe("ambientLife", () => {
  it("follows the time of day and the week", () => {
    // 16 Nov 2026 is a Monday.
    expect(ambientLife(at(16, 8)).scene).toBe("rain");
    expect(ambientLife(at(17, 8)).scene).toBe("sun");
    expect(ambientLife(at(17, 14)).scene).toBeUndefined();
    expect(ambientLife(at(17, 23))).toMatchObject({ scene: "moon", asleep: true });
    expect(ambientLife(at(17, 3)).asleep).toBe(true);
    expect(ambientLife(at(21, 14)).status).toBe("Taking the weekend slowly");
  });
});

describe("visits", () => {
  it("remembers the day before the latest visit", () => {
    const first = recordVisit(null, "2026-11-10");
    expect(daysAway(first)).toBe(0);

    const sameDay = recordVisit(first, "2026-11-10");
    expect(sameDay).toBe(first);

    const later = recordVisit(first, "2026-11-15");
    expect(later).toBe("2026-11-10|2026-11-15");
    expect(daysAway(later)).toBe(5);
    expect(daysAway(recordVisit(later, "2026-11-16"))).toBe(1);
  });

  it("ignores a record it can't read", () => {
    expect(daysAway("nonsense")).toBe(0);
    expect(daysAway("a|b")).toBe(0);
  });

  it("formats the local day", () => {
    expect(dayKey(new Date(2026, 0, 5, 23))).toBe("2026-01-05");
  });
});
