import { describe, it, expect } from "vitest";
import { computeTransitionStyle } from "../src/components/slideshow/transitions";

describe("computeTransitionStyle", () => {
  it("crossfade — outgoing fades out, incoming fades in", () => {
    const start = computeTransitionStyle("crossfade", 0, "linear");
    expect(start.outgoing.opacity).toBeCloseTo(1);
    expect(start.incoming.opacity).toBeCloseTo(0);

    const mid = computeTransitionStyle("crossfade", 0.5, "linear");
    expect(mid.outgoing.opacity).toBeCloseTo(0.5);
    expect(mid.incoming.opacity).toBeCloseTo(0.5);

    const end = computeTransitionStyle("crossfade", 1, "linear");
    expect(end.outgoing.opacity).toBeCloseTo(0);
    expect(end.incoming.opacity).toBeCloseTo(1);
  });

  it("none — instant switch at midpoint", () => {
    const before = computeTransitionStyle("none", 0.4, "linear");
    expect(before.outgoing.opacity).toBe(1);
    expect(before.incoming.opacity).toBe(0);

    const after = computeTransitionStyle("none", 0.6, "linear");
    expect(after.outgoing.opacity).toBe(0);
    expect(after.incoming.opacity).toBe(1);
  });

  it("slide-left — outgoing moves left, incoming enters from right", () => {
    const mid = computeTransitionStyle("slide-left", 0.5, "linear");
    expect(mid.outgoing.transform).toContain("translateX(-50%)");
    expect(mid.incoming.transform).toContain("translateX(50%)");
  });

  it("wipe-left — uses clipPath", () => {
    const mid = computeTransitionStyle("wipe-left", 0.5, "linear");
    expect(mid.outgoing.clipPath).toBeDefined();
    expect(mid.incoming.clipPath).toBeDefined();
  });

  it("zoom-in — both scale and fade", () => {
    const mid = computeTransitionStyle("zoom-in", 0.5, "linear");
    expect(mid.outgoing.transform).toContain("scale(");
    expect(mid.incoming.transform).toContain("scale(");
    expect(mid.outgoing.opacity).toBeCloseTo(0.5);
    expect(mid.incoming.opacity).toBeCloseTo(0.5);
  });

  it("clamps progress to [0,1]", () => {
    const under = computeTransitionStyle("crossfade", -0.5, "linear");
    expect(under.outgoing.opacity).toBeCloseTo(1);
    expect(under.incoming.opacity).toBeCloseTo(0);

    const over = computeTransitionStyle("crossfade", 1.5, "linear");
    expect(over.outgoing.opacity).toBeCloseTo(0);
    expect(over.incoming.opacity).toBeCloseTo(1);
  });

  it("applies easing", () => {
    // ease-in at 0.5 → 0.25
    const easeIn = computeTransitionStyle("crossfade", 0.5, "ease-in");
    expect(easeIn.incoming.opacity).toBeCloseTo(0.25);
  });
});
