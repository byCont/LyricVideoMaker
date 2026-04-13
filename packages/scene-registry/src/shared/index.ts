/**
 * Shared helpers barrel (T-006).
 *
 * Single import path through which any scene component can pull both the
 * Transform and Timing public surfaces — types, defaults, editor category
 * entries, and runtime helpers — with one import:
 *
 *   import {
 *     DEFAULT_TRANSFORM_OPTIONS,
 *     DEFAULT_TIMING_OPTIONS,
 *     transformCategory,
 *     timingCategory,
 *     computeTransformStyle,
 *     computeTimingOpacity,
 *     type TransformOptions,
 *     type TimingOptions
 *   } from "@lyric-video-maker/scene-registry/shared";
 */

export {
  DEFAULT_TRANSFORM_OPTIONS,
  TRANSFORM_ANCHOR_VALUES,
  transformCategory,
  computeTransformStyle,
  DEFAULT_TIMING_OPTIONS,
  TIMING_EASING_VALUES,
  timingCategory,
  computeTimingOpacity,
  type TransformAnchor,
  type TransformOptions,
  type TransformCanvas,
  type TimingEasing,
  type TimingOptions
} from "@lyric-video-maker/plugin-base";

// Keep the preexisting math / color helpers accessible through this barrel
// too so consumers do not have to juggle two paths.
export { clamp01, safeScale } from "./math";
export { withAlpha } from "./color";
