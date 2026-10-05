import { describe, expect, it } from "vitest";

import {
  chapterSpans,
  easeInOutCubic,
  easeInOutSine,
  easeOutBack,
  locate,
  ramp,
  stagger,
} from "@/lib/landing-timeline";

describe("chapterSpans", () => {
  it("sizes each chapter by its share of the scroll", () => {
    expect(chapterSpans([2, 1, 1])).toEqual([
      { start: 0, end: 0.5 },
      { start: 0.5, end: 0.75 },
      { start: 0.75, end: 1 },
    ]);
  });

  it("copes with no length at all", () => {
    expect(chapterSpans([0, 0])).toEqual([
      { start: 0, end: 0 },
      { start: 0, end: 0 },
    ]);
  });
});

describe("locate", () => {
  const spans = chapterSpans([2, 1, 1]);

  it("finds the chapter and how far through it we are", () => {
    expect(locate(spans, 0)).toEqual({ index: 0, local: 0 });
    expect(locate(spans, 0.25)).toEqual({ index: 0, local: 0.5 });
    expect(locate(spans, 0.625)).toEqual({ index: 1, local: 0.5 });
  });

  it("starts the next chapter exactly on the boundary", () => {
    expect(locate(spans, 0.5)).toEqual({ index: 1, local: 0 });
  });

  it("holds the last chapter at the end and clamps overscroll", () => {
    expect(locate(spans, 1)).toEqual({ index: 2, local: 1 });
    expect(locate(spans, 1.4)).toEqual({ index: 2, local: 1 });
    expect(locate(spans, -0.2)).toEqual({ index: 0, local: 0 });
  });
});

describe("ramp", () => {
  it("is 0 before, 1 after and linear between", () => {
    expect(ramp(0.1, 0.2, 0.4)).toBe(0);
    expect(ramp(0.3, 0.2, 0.4)).toBeCloseTo(0.5);
    expect(ramp(0.9, 0.2, 0.4)).toBe(1);
  });

  it("acts as a step when the window has no width", () => {
    expect(ramp(0.49, 0.5, 0.5)).toBe(0);
    expect(ramp(0.5, 0.5, 0.5)).toBe(1);
  });
});

describe("stagger", () => {
  it("starts the first item at once and the last one later", () => {
    expect(stagger(0.25, 0, 5)).toBeGreaterThan(0);
    expect(stagger(0.25, 4, 5)).toBe(0);
  });

  it("finishes every item by the end", () => {
    for (let i = 0; i < 5; i++) expect(stagger(1, i, 5)).toBe(1);
  });

  it("handles a single item", () => {
    expect(stagger(0.5, 0, 1)).toBeCloseTo(1);
  });
});

describe("easing", () => {
  it("starts at 0 and lands on 1", () => {
    for (const ease of [easeInOutCubic, easeInOutSine, easeOutBack]) {
      expect(ease(0)).toBeCloseTo(0);
      expect(ease(1)).toBeCloseTo(1);
    }
  });

  it("lets easeOutBack overshoot before settling", () => {
    expect(easeOutBack(0.8)).toBeGreaterThan(1);
  });
});
