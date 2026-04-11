import { describe, expect, it } from "vitest";
import * as shared from "../src/shared";

describe("shared barrel (T-006)", () => {
  it("exposes Transform public surface", () => {
    expect(shared.DEFAULT_TRANSFORM_OPTIONS).toBeDefined();
    expect(shared.transformCategory).toBeDefined();
    expect(typeof shared.computeTransformStyle).toBe("function");
    expect(shared.TRANSFORM_ANCHOR_VALUES).toHaveLength(9);
  });

  it("exposes Timing public surface", () => {
    expect(shared.DEFAULT_TIMING_OPTIONS).toBeDefined();
    expect(shared.timingCategory).toBeDefined();
    expect(typeof shared.computeTimingOpacity).toBe("function");
    expect(shared.TIMING_EASING_VALUES).toHaveLength(4);
  });

  it("the defaults, categories, runtime helpers, and types are all accessible through one import path", () => {
    // Type-level assertion: shared.TransformOptions and shared.TimingOptions
    // must exist as types. Runtime: the rest of the surface is present.
    const transform: shared.TransformOptions = { ...shared.DEFAULT_TRANSFORM_OPTIONS };
    const timing: shared.TimingOptions = { ...shared.DEFAULT_TIMING_OPTIONS };
    const style = shared.computeTransformStyle(transform, { width: 1920, height: 1080 });
    const opacity = shared.computeTimingOpacity(0, timing);
    expect(style.position).toBe("absolute");
    expect(opacity).toBe(1);
  });
});
