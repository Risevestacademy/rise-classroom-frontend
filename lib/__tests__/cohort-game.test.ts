import { describe, expect, it } from "vitest";

import {
  CLASSMATES,
  alongPath,
  bugCount,
  formatTime,
  noticeRadius,
  scattered,
  touching,
  trimPath,
} from "@/lib/cohort-game";

describe("alongPath", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];

  it("starts at the newest point", () => {
    expect(alongPath(path, 0)).toEqual({ x: 0, y: 0 });
  });

  it("walks back along the path, round corners", () => {
    expect(alongPath(path, 5)).toEqual({ x: 5, y: 0 });
    expect(alongPath(path, 15)).toEqual({ x: 10, y: 5 });
  });

  it("waits at the oldest point past the end", () => {
    expect(alongPath(path, 100)).toEqual({ x: 10, y: 10 });
  });

  it("copes with an empty path", () => {
    expect(alongPath([], 4)).toEqual({ x: 0, y: 0 });
  });
});

describe("trimPath", () => {
  it("keeps just enough path for the line", () => {
    const path = [0, 10, 20, 30, 40].map((x) => ({ x, y: 0 }));
    expect(trimPath(path, 15)).toHaveLength(3);
  });

  it("leaves a short path alone", () => {
    const path = [0, 10].map((x) => ({ x, y: 0 }));
    expect(trimPath(path, 50)).toHaveLength(2);
  });
});

describe("rules", () => {
  it("makes a 60-person cohort with you", () => {
    expect(CLASSMATES + 1).toBe(60);
  });

  it("adds a bug for every 20 people gathered", () => {
    expect(bugCount(0)).toBe(2);
    expect(bugCount(20)).toBe(3);
    expect(bugCount(59)).toBe(4);
  });

  it("lets the last few classmates notice you from further away", () => {
    expect(noticeRadius(40)).toBe(110);
    expect(noticeRadius(12)).toBe(110);
    expect(noticeRadius(1)).toBeGreaterThan(500);
  });

  it("never scatters more people than are in the line", () => {
    expect(scattered(10)).toBe(4);
    expect(scattered(2)).toBe(2);
    expect(scattered(0)).toBe(0);
  });

  it("counts touching within reach", () => {
    expect(touching({ x: 0, y: 0 }, { x: 3, y: 4 }, 5)).toBe(true);
    expect(touching({ x: 0, y: 0 }, { x: 3, y: 4 }, 4.9)).toBe(false);
  });

  it("shows time as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(48.7)).toBe("0:48");
    expect(formatTime(125)).toBe("2:05");
  });
});
