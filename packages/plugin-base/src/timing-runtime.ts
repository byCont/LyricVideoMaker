import type { TimingEasing, TimingOptions } from "./timing";

const INFINITE_SONG_SENTINEL = 0;

/**
 * Pure helper: compute a component's per-frame opacity from its timing
 * options and the current frame time (milliseconds).
 *
 * Returns zero before the start time, zero after the effective end time,
 * fades in over the fade-in duration starting at start time using the
 * selected easing, fades out over the fade-out duration ending at the end
 * time using the selected easing, and returns one between the two fades.
 *
 * When `timing.endTime` equals the sentinel value 0, the song is treated as
 * infinite in length — the end time never clamps and the helper never
 * returns zero "after end". This lets the default timing ({ start: 0,
 * end: 0 }) produce an always-visible component without needing to know
 * the song duration.
 *
 * The helper is pure: no side effects, no shared state, safe to call from
 * render and prepare contexts at arbitrary frequency.
 */
export function computeTimingOpacity(currentTimeMs: number, timing: TimingOptions): number {
  if (currentTimeMs < timing.startTime) {
    return 0;
  }

  const infiniteSong = timing.endTime === INFINITE_SONG_SENTINEL;

  if (!infiniteSong && currentTimeMs >= timing.endTime) {
    return 0;
  }

  // Fade-in window: [startTime, startTime + fadeInDuration)
  if (timing.fadeInDuration > 0 && currentTimeMs < timing.startTime + timing.fadeInDuration) {
    const progress = (currentTimeMs - timing.startTime) / timing.fadeInDuration;
    return applyEasing(clamp01(progress), timing.easing);
  }

  // Fade-out window only evaluated when end time is finite.
  if (!infiniteSong && timing.fadeOutDuration > 0) {
    const fadeOutStart = timing.endTime - timing.fadeOutDuration;
    if (currentTimeMs >= fadeOutStart) {
      const progress = (timing.endTime - currentTimeMs) / timing.fadeOutDuration;
      return applyEasing(clamp01(progress), timing.easing);
    }
  }

  return 1;
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function applyEasing(t: number, easing: TimingEasing): number {
  switch (easing) {
    case "linear":
      return t;
    case "ease-in":
      return t * t;
    case "ease-out":
      return 1 - (1 - t) * (1 - t);
    case "ease-in-out":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    default:
      return t;
  }
}
