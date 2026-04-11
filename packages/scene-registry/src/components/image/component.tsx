import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";

export interface ImageComponentOptions {
  source: string;
  [key: string]: unknown;
}

/**
 * Image component — minimal identity stub (T-034).
 *
 * Options, fit modes, appearance, effects, and rendering come from later
 * tiers: T-035 (options contract), T-036 (schema order), T-037 (defaults),
 * T-038 (fit + filters + radius), T-039 (border + tint), T-041 (per-frame
 * opacity).
 *
 * The single `source` image field is intentionally declared at the identity
 * stage so T-040 (image source flows through existing asset preload loop) can
 * be verified without touching the asset pipeline. The full contract in T-035
 * will replace this skeletal options array.
 *
 * The identifier `image` does not collide with the full-canvas
 * `background-image` component — both may coexist in a scene.
 */
export const imageComponent: SceneComponentDefinition<ImageComponentOptions> = {
  id: "image",
  name: "Image",
  description: "Positioned raster image with fit modes, effects, filters, and tint.",
  staticWhenMarkupUnchanged: true,
  options: [
    // TODO T-035: replaced by full options contract (Source, Transform, Fit,
    // Appearance, Effects, Timing). This minimal field exists so T-040 can
    // verify the existing preload loop picks up image-type fields.
    { type: "image", id: "source", label: "Source", required: true }
  ],
  defaultOptions: { source: "" },
  Component: () => null
};
