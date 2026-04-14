import { describe, it, expect } from "vitest";
import { validateSlideshowOptions } from "../src/components/slideshow/validation";
import { DEFAULT_SLIDESHOW_OPTIONS } from "../src/components/slideshow/options";
import type { SlideshowComponentOptions } from "../src/components/slideshow/types";

function makeOptions(overrides: Partial<SlideshowComponentOptions> = {}): SlideshowComponentOptions {
  return { ...DEFAULT_SLIDESHOW_OPTIONS, images: ["a.png"], ...overrides };
}

describe("validateSlideshowOptions", () => {
  it("accepts valid default options", () => {
    expect(() => validateSlideshowOptions(makeOptions())).not.toThrow();
  });

  it("rejects transitionDuration >= slideDuration in fixed-duration mode", () => {
    expect(() => validateSlideshowOptions(makeOptions({
      timingMode: "fixed-duration",
      slideDuration: 1000,
      transitionDuration: 1000
    }))).toThrow("less than");
  });

  it("allows transitionDuration >= slideDuration in align-to-lyrics mode", () => {
    expect(() => validateSlideshowOptions(makeOptions({
      timingMode: "align-to-lyrics",
      slideDuration: 1000,
      transitionDuration: 2000
    }))).not.toThrow();
  });

  it("rejects negative transitionDuration", () => {
    expect(() => validateSlideshowOptions(makeOptions({
      transitionDuration: -1
    }))).toThrow("non-negative");
  });

  it("rejects slideDuration below 500ms in fixed-duration mode", () => {
    expect(() => validateSlideshowOptions(makeOptions({
      timingMode: "fixed-duration",
      slideDuration: 200,
      transitionDuration: 0
    }))).toThrow("at least 500ms");
  });
});
