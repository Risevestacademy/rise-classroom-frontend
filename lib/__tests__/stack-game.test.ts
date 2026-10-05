import { describe, expect, it } from "vitest";

import {
  GRADUATION_WEEK,
  gritLevel,
  resolveDrop,
  slideSpeed,
} from "@/lib/stack-game";

const below = { x: 100, width: 200 };

describe("resolveDrop", () => {
  it("snaps a near-perfect drop without cutting", () => {
    expect(resolveDrop(below, { x: 103, width: 200 })).toEqual({
      kind: "perfect",
      placed: { x: 100, width: 200 },
    });
  });

  it("cuts off what overhangs on the right", () => {
    expect(resolveDrop(below, { x: 150, width: 200 })).toEqual({
      kind: "cut",
      placed: { x: 150, width: 150 },
      offcut: { x: 300, width: 50 },
    });
  });

  it("cuts off what overhangs on the left", () => {
    expect(resolveDrop(below, { x: 40, width: 200 })).toEqual({
      kind: "cut",
      placed: { x: 100, width: 140 },
      offcut: { x: 40, width: 60 },
    });
  });

  it("keeps the slab and offcut adding up to the original width", () => {
    const result = resolveDrop(below, { x: 170, width: 180 });
    if (result.kind !== "cut") throw new Error("expected a cut");
    expect(result.placed.width + result.offcut.width).toBe(180);
  });

  it("counts a sliver-thin overlap as a miss", () => {
    expect(resolveDrop(below, { x: 295, width: 200 })).toEqual({ kind: "miss" });
  });

  it("misses when nothing overlaps", () => {
    expect(resolveDrop(below, { x: 300, width: 200 })).toEqual({ kind: "miss" });
    expect(resolveDrop(below, { x: -100, width: 200 })).toEqual({ kind: "miss" });
  });
});

describe("slideSpeed", () => {
  it("speeds up with the tower and levels off", () => {
    expect(slideSpeed(10)).toBeGreaterThan(slideSpeed(0));
    expect(slideSpeed(500)).toBe(8);
  });
});

describe("gritLevel", () => {
  it("celebrates graduation at the end of the program", () => {
    expect(gritLevel(GRADUATION_WEEK)).toMatch(/Graduated/);
  });

  it("has something kind to say at zero", () => {
    expect(gritLevel(0)).toMatch(/starts somewhere/);
  });
});
