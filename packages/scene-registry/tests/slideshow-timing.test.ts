import { describe, it, expect } from "vitest";
import { buildSlideSchedule } from "../src/components/slideshow/timing";
import { DEFAULT_SLIDESHOW_OPTIONS } from "../src/components/slideshow/options";
import type { SlideshowComponentOptions } from "../src/components/slideshow/types";
import type { LyricCue } from "@lyric-video-maker/core";

function makeOptions(overrides: Partial<SlideshowComponentOptions> = {}): SlideshowComponentOptions {
  return { ...DEFAULT_SLIDESHOW_OPTIONS, images: ["a.png", "b.png", "c.png"], ...overrides };
}

function makeCues(times: [number, number][]): LyricCue[] {
  return times.map(([startMs, endMs], i) => ({
    index: i,
    startMs,
    endMs,
    text: `Line ${i}`,
    lines: [`Line ${i}`]
  }));
}

describe("buildSlideSchedule — fixed-duration", () => {
  it("creates correct number of slides for video duration", () => {
    const options = makeOptions({ slideDuration: 5000, transitionDuration: 1000, initialDelay: 0 });
    const { schedule } = buildSlideSchedule(options, [], 20000);
    // stride = 5000 - 1000 = 4000. Slides at 0, 4000, 8000, 12000, 16000
    expect(schedule.length).toBe(5);
    expect(schedule[0].startMs).toBe(0);
    expect(schedule[0].endMs).toBe(5000);
    expect(schedule[1].startMs).toBe(4000);
    expect(schedule[1].endMs).toBe(9000);
  });

  it("cycles images in loop mode", () => {
    const options = makeOptions({ slideDuration: 2000, transitionDuration: 0, repeatMode: "loop" });
    const { schedule } = buildSlideSchedule(options, [], 8000);
    const indices = schedule.map((s) => s.imageIndex);
    expect(indices).toEqual([0, 1, 2, 0]);
  });

  it("stops at N images in single-pass mode", () => {
    const options = makeOptions({ slideDuration: 2000, transitionDuration: 0, repeatMode: "single-pass" });
    const { schedule } = buildSlideSchedule(options, [], 20000);
    expect(schedule).toHaveLength(3);
  });

  it("holds last image in hold-last mode", () => {
    const options = makeOptions({ slideDuration: 2000, transitionDuration: 0, repeatMode: "hold-last" });
    const { schedule } = buildSlideSchedule(options, [], 10000);
    expect(schedule.length).toBe(5);
    expect(schedule[3].imageIndex).toBe(2); // last image
    expect(schedule[4].imageIndex).toBe(2);
  });

  it("respects initial delay", () => {
    const options = makeOptions({ slideDuration: 5000, transitionDuration: 0, initialDelay: 3000 });
    const { schedule } = buildSlideSchedule(options, [], 20000);
    expect(schedule[0].startMs).toBe(3000);
  });

  it("handles single image", () => {
    const options = makeOptions({ images: ["only.png"], slideDuration: 5000, transitionDuration: 1000 });
    const { schedule } = buildSlideSchedule(options, [], 20000);
    expect(schedule.length).toBeGreaterThanOrEqual(1);
    for (const entry of schedule) {
      expect(entry.imageIndex).toBe(0);
    }
  });

  it("returns empty schedule for empty images", () => {
    const options = makeOptions({ images: [] });
    const { schedule } = buildSlideSchedule(options, [], 10000);
    expect(schedule).toHaveLength(0);
  });
});

describe("buildSlideSchedule — align-to-lyrics", () => {
  it("maps one image per cue", () => {
    const options = makeOptions({ timingMode: "align-to-lyrics", transitionDuration: 0 });
    const cues = makeCues([[0, 3000], [3000, 6000], [6000, 9000]]);
    const { schedule } = buildSlideSchedule(options, cues, 10000);
    expect(schedule).toHaveLength(3);
    expect(schedule[0].imageIndex).toBe(0);
    expect(schedule[1].imageIndex).toBe(1);
    expect(schedule[2].imageIndex).toBe(2);
  });

  it("cycles images when more cues than images", () => {
    const options = makeOptions({ timingMode: "align-to-lyrics", transitionDuration: 0, repeatMode: "loop" });
    const cues = makeCues([[0, 2000], [2000, 4000], [4000, 6000], [6000, 8000], [8000, 10000]]);
    const { schedule } = buildSlideSchedule(options, cues, 10000);
    expect(schedule).toHaveLength(5);
    expect(schedule[3].imageIndex).toBe(0); // wraps
    expect(schedule[4].imageIndex).toBe(1);
  });

  it("shows first image for entire video when no cues", () => {
    const options = makeOptions({ timingMode: "align-to-lyrics" });
    const { schedule } = buildSlideSchedule(options, [], 10000);
    expect(schedule).toHaveLength(1);
    expect(schedule[0].startMs).toBe(0);
    expect(schedule[0].endMs).toBe(10000);
  });

  it("stops at N images in single-pass mode", () => {
    const options = makeOptions({
      timingMode: "align-to-lyrics",
      transitionDuration: 0,
      repeatMode: "single-pass"
    });
    const cues = makeCues([[0, 2000], [2000, 4000], [4000, 6000], [6000, 8000], [8000, 10000]]);
    const { schedule } = buildSlideSchedule(options, cues, 10000);
    expect(schedule).toHaveLength(3); // 3 images only
  });
});
