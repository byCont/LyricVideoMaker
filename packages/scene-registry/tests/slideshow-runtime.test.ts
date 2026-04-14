import { describe, it, expect } from "vitest";
import { computeSlideshowFrameState } from "../src/components/slideshow/runtime";
import { DEFAULT_SLIDESHOW_OPTIONS } from "../src/components/slideshow/options";
import type { SlideshowComponentOptions, SlideScheduleEntry } from "../src/components/slideshow/types";

function makeOptions(overrides: Partial<SlideshowComponentOptions> = {}): SlideshowComponentOptions {
  return { ...DEFAULT_SLIDESHOW_OPTIONS, images: ["a.png", "b.png", "c.png"], ...overrides };
}

function makeSchedule(): SlideScheduleEntry[] {
  // 3 slides with 1000ms transition overlap
  return [
    { slideIndex: 0, imageIndex: 0, startMs: 0, endMs: 5000, holdStartMs: 0, holdEndMs: 4000 },
    { slideIndex: 1, imageIndex: 1, startMs: 4000, endMs: 9000, holdStartMs: 5000, holdEndMs: 8000 },
    { slideIndex: 2, imageIndex: 2, startMs: 8000, endMs: 13000, holdStartMs: 9000, holdEndMs: 12000 }
  ];
}

describe("computeSlideshowFrameState", () => {
  it("returns null slides for empty schedule", () => {
    const state = computeSlideshowFrameState(1000, [], makeOptions());
    expect(state.currentSlide).toBeNull();
    expect(state.nextSlide).toBeNull();
  });

  it("shows single slide during hold period", () => {
    const schedule = makeSchedule();
    const state = computeSlideshowFrameState(2000, schedule, makeOptions());
    expect(state.currentSlide).not.toBeNull();
    expect(state.currentSlide!.imageIndex).toBe(0);
    expect(state.currentSlide!.opacity).toBe(1);
    expect(state.nextSlide).toBeNull();
    expect(state.isTransitioning).toBe(false);
  });

  it("shows two slides during transition", () => {
    const schedule = makeSchedule();
    // At 4500ms: slide 0 (0-5000) and slide 1 (4000-9000) overlap
    const state = computeSlideshowFrameState(4500, schedule, makeOptions());
    expect(state.isTransitioning).toBe(true);
    expect(state.currentSlide).not.toBeNull();
    expect(state.currentSlide!.imageIndex).toBe(0);
    expect(state.nextSlide).not.toBeNull();
    expect(state.nextSlide!.imageIndex).toBe(1);
    expect(state.transitionProgress).toBeCloseTo(0.5);
  });

  it("returns null before first slide starts", () => {
    const schedule: SlideScheduleEntry[] = [
      { slideIndex: 0, imageIndex: 0, startMs: 5000, endMs: 10000, holdStartMs: 5000, holdEndMs: 9000 }
    ];
    const state = computeSlideshowFrameState(2000, schedule, makeOptions());
    expect(state.currentSlide).toBeNull();
  });

  it("returns null after last slide ends", () => {
    const schedule: SlideScheduleEntry[] = [
      { slideIndex: 0, imageIndex: 0, startMs: 0, endMs: 5000, holdStartMs: 0, holdEndMs: 4000 }
    ];
    const state = computeSlideshowFrameState(6000, schedule, makeOptions());
    expect(state.currentSlide).toBeNull();
  });

  it("applies Ken Burns transform when enabled", () => {
    const options = makeOptions({ kenBurnsEnabled: true, kenBurnsScale: 10 });
    const schedule = makeSchedule();
    const state = computeSlideshowFrameState(2000, schedule, options);
    expect(state.currentSlide!.transform).toContain("scale(");
    expect(state.currentSlide!.transform).toContain("translate(");
  });

  it("returns empty transform when Ken Burns disabled", () => {
    const options = makeOptions({ kenBurnsEnabled: false });
    const schedule = makeSchedule();
    const state = computeSlideshowFrameState(2000, schedule, options);
    expect(state.currentSlide!.transform).toBe("");
  });
});
