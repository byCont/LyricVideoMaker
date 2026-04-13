import { describe, expect, it } from "vitest";
import { DEFAULT_TIMING_OPTIONS, computeTimingOpacity, type TimingOptions } from "../src/shared";

const base: TimingOptions = {
  startTime: 1000,
  endTime: 5000,
  fadeInDuration: 500,
  fadeOutDuration: 500,
  easing: "linear"
};

describe("computeTimingOpacity — window boundaries", () => {
  it("returns 0 before start time", () => {
    expect(computeTimingOpacity(0, base)).toBe(0);
    expect(computeTimingOpacity(999, base)).toBe(0);
  });

  it("returns 0 at start time (fade-in begins)", () => {
    expect(computeTimingOpacity(1000, base)).toBe(0);
  });

  it("returns 1 at start + fade-in duration", () => {
    expect(computeTimingOpacity(1500, base)).toBe(1);
  });

  it("returns 1 at end - fade-out duration", () => {
    expect(computeTimingOpacity(4500, base)).toBe(1);
  });

  it("returns 0 at end time", () => {
    expect(computeTimingOpacity(5000, base)).toBe(0);
  });

  it("returns 1 between the two fade windows", () => {
    expect(computeTimingOpacity(2500, base)).toBe(1);
    expect(computeTimingOpacity(4000, base)).toBe(1);
  });
});

describe("computeTimingOpacity — infinite-song sentinel", () => {
  it("endTime === 0 treats the song as infinite: always visible after start", () => {
    const timing: TimingOptions = { ...DEFAULT_TIMING_OPTIONS };
    expect(computeTimingOpacity(0, timing)).toBe(1);
    expect(computeTimingOpacity(10_000_000, timing)).toBe(1);
  });

  it("endTime === 0 never evaluates fade-out even if fadeOutDuration > 0", () => {
    const timing: TimingOptions = {
      startTime: 0,
      endTime: 0,
      fadeInDuration: 0,
      fadeOutDuration: 500,
      easing: "linear"
    };
    expect(computeTimingOpacity(999_999_999, timing)).toBe(1);
  });

  it("endTime === 0 honors fade-in window", () => {
    const timing: TimingOptions = {
      startTime: 0,
      endTime: 0,
      fadeInDuration: 1000,
      fadeOutDuration: 0,
      easing: "linear"
    };
    expect(computeTimingOpacity(0, timing)).toBe(0);
    expect(computeTimingOpacity(500, timing)).toBe(0.5);
    expect(computeTimingOpacity(1000, timing)).toBe(1);
  });
});

describe("computeTimingOpacity — easing curves", () => {
  const fadeIn: TimingOptions = {
    startTime: 0,
    endTime: 2000,
    fadeInDuration: 1000,
    fadeOutDuration: 0,
    easing: "linear"
  };

  it("linear easing produces t", () => {
    expect(computeTimingOpacity(500, { ...fadeIn, easing: "linear" })).toBeCloseTo(0.5);
  });

  it("ease-in is concave (value at t=0.5 is < 0.5)", () => {
    expect(computeTimingOpacity(500, { ...fadeIn, easing: "ease-in" })).toBeLessThan(0.5);
  });

  it("ease-out is convex (value at t=0.5 is > 0.5)", () => {
    expect(computeTimingOpacity(500, { ...fadeIn, easing: "ease-out" })).toBeGreaterThan(0.5);
  });

  it("ease-in-out passes through 0.5 at midpoint", () => {
    expect(computeTimingOpacity(500, { ...fadeIn, easing: "ease-in-out" })).toBeCloseTo(0.5);
  });
});

describe("computeTimingOpacity — purity", () => {
  it("does not mutate timing options", () => {
    const input = { ...base };
    const snapshot = JSON.stringify(input);
    computeTimingOpacity(2500, input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("returns stable output for identical inputs", () => {
    expect(computeTimingOpacity(2000, base)).toBe(computeTimingOpacity(2000, base));
  });
});
