import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import {
  DEFAULT_IMAGE_OPTIONS,
  imageOptionsSchema,
  type ImageComponentOptions
} from "./options";

/**
 * Image component (cavekit-image-component).
 *
 * R1: identifier "image" (distinct from background-image).
 * R2: options contract in ./options.ts.
 * R3: category order Source → Transform → Fit → Appearance → Effects → Timing.
 * R4: defaults spread shared Transform/Timing + no default image path so
 *     the component renders nothing until a source is chosen.
 * R5 / R7: rendering and per-frame opacity come from later tier tasks
 *     (T-038, T-039, T-041).
 */
export const imageComponent: SceneComponentDefinition<ImageComponentOptions> = {
  id: "image",
  name: "Image",
  description: "Positioned raster image with fit modes, effects, filters, and tint.",
  staticWhenMarkupUnchanged: true,
  options: imageOptionsSchema,
  defaultOptions: DEFAULT_IMAGE_OPTIONS,
  Component: () => null
};
