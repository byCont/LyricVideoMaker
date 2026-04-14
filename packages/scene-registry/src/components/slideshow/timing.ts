import type { LyricCue } from "@lyric-video-maker/core";
import { createSeededRng, computeEffectiveOrder } from "./order";
import type { SlideScheduleEntry, SlideshowComponentOptions } from "./types";

const MAX_SLIDES = 10000;

export function buildSlideSchedule(
  options: SlideshowComponentOptions,
  cues: LyricCue[],
  videoDurationMs: number
): { schedule: SlideScheduleEntry[]; effectiveOrder: number[] } {
  const imageCount = options.images.length;
  if (imageCount === 0) {
    return { schedule: [], effectiveOrder: [] };
  }

  const effectiveOrder = computeEffectiveOrder(imageCount, options.slideOrder, options.randomSeed);
  const rng = options.slideOrder === "random" ? createSeededRng(options.randomSeed) : null;

  if (options.timingMode === "align-to-lyrics") {
    return {
      schedule: buildLyricsSchedule(options, effectiveOrder, cues, videoDurationMs, imageCount, rng),
      effectiveOrder
    };
  }

  return {
    schedule: buildFixedDurationSchedule(options, effectiveOrder, videoDurationMs, imageCount, rng),
    effectiveOrder
  };
}

function buildFixedDurationSchedule(
  options: SlideshowComponentOptions,
  effectiveOrder: number[],
  videoDurationMs: number,
  imageCount: number,
  rng: (() => number) | null
): SlideScheduleEntry[] {
  const { slideDuration, transitionDuration, initialDelay, repeatMode } = options;
  const stride = Math.max(slideDuration - transitionDuration, 1);
  const schedule: SlideScheduleEntry[] = [];

  let slideIndex = 0;
  let timeMs = initialDelay;

  while (timeMs < videoDurationMs && slideIndex < MAX_SLIDES) {
    // Determine image index based on repeat mode
    if (repeatMode === "single-pass" && slideIndex >= imageCount) {
      break;
    }

    let imageIndex: number;
    if (rng) {
      imageIndex = Math.floor(rng() * imageCount);
    } else if (repeatMode === "hold-last" && slideIndex >= imageCount) {
      imageIndex = effectiveOrder[imageCount - 1];
    } else {
      imageIndex = effectiveOrder[slideIndex % imageCount];
    }

    const entryStartMs = timeMs;
    const entryEndMs = Math.min(timeMs + slideDuration, videoDurationMs);
    const holdStartMs = slideIndex > 0
      ? Math.min(entryStartMs + transitionDuration, entryEndMs)
      : entryStartMs;
    const holdEndMs = Math.max(entryEndMs - transitionDuration, holdStartMs);

    schedule.push({
      slideIndex,
      imageIndex,
      startMs: entryStartMs,
      endMs: entryEndMs,
      holdStartMs,
      holdEndMs
    });

    timeMs += stride;
    slideIndex++;
  }

  return schedule;
}

function buildLyricsSchedule(
  options: SlideshowComponentOptions,
  effectiveOrder: number[],
  cues: LyricCue[],
  videoDurationMs: number,
  imageCount: number,
  rng: (() => number) | null
): SlideScheduleEntry[] {
  const { transitionDuration, repeatMode } = options;
  const halfTransition = transitionDuration / 2;
  const schedule: SlideScheduleEntry[] = [];

  if (cues.length === 0) {
    // No lyrics — show first image for entire video
    schedule.push({
      slideIndex: 0,
      imageIndex: effectiveOrder[0],
      startMs: 0,
      endMs: videoDurationMs,
      holdStartMs: 0,
      holdEndMs: videoDurationMs
    });
    return schedule;
  }

  for (let i = 0; i < cues.length && i < MAX_SLIDES; i++) {
    if (repeatMode === "single-pass" && i >= imageCount) {
      break;
    }

    let imageIndex: number;
    if (rng) {
      imageIndex = Math.floor(rng() * imageCount);
    } else if (repeatMode === "hold-last" && i >= imageCount) {
      imageIndex = effectiveOrder[imageCount - 1];
    } else {
      imageIndex = effectiveOrder[i % imageCount];
    }

    const cueStartMs = cues[i].startMs;
    const cueEndMs = i < cues.length - 1 ? cues[i + 1].startMs : videoDurationMs;

    const startMs = i > 0 ? Math.max(cueStartMs - halfTransition, 0) : 0;
    const endMs = i < cues.length - 1 ? Math.min(cueEndMs + halfTransition, videoDurationMs) : videoDurationMs;
    const holdStartMs = i > 0 ? Math.min(cueStartMs + halfTransition, endMs) : startMs;
    const holdEndMs = i < cues.length - 1 ? Math.max(cueEndMs - halfTransition, holdStartMs) : endMs;

    schedule.push({
      slideIndex: i,
      imageIndex,
      startMs,
      endMs,
      holdStartMs,
      holdEndMs
    });
  }

  return schedule;
}
