import {
  DEFAULT_TIMING_OPTIONS,
  computeTimingOpacity,
  timingCategory,
  type ModifierDefinition,
  type TimingOptions
} from "@lyric-video-maker/plugin-base";

/**
 * Timing modifier — fade the wrapped component in and out around a
 * visibility window. Replaces the per-component TimingOptions mixin.
 * Writes `opacity` and `pointerEvents` onto its wrapper; when opacity is
 * zero pointer events are disabled so hidden wrappers do not intercept
 * clicks (harmless in offline render, useful for previews).
 */
export const timingModifier: ModifierDefinition<TimingOptions> = {
  id: "timing",
  name: "Timing",
  description: "Start time, end time, fade in, fade out.",
  options: [timingCategory],
  defaultOptions: DEFAULT_TIMING_OPTIONS,
  apply: ({ element, options, timeMs }) => {
    const opacity = computeTimingOpacity(timeMs, options);
    element.style.opacity = String(opacity);
    element.style.pointerEvents = opacity === 0 ? "none" : "";
  }
};
