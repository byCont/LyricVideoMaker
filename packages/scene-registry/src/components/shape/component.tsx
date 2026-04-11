import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import { DEFAULT_SHAPE_OPTIONS, shapeOptionsSchema, type ShapeComponentOptions } from "./options";

/**
 * Shape component (cavekit-shape-component).
 *
 * R1: identifier "shape".
 * R2: options contract in ./options.ts.
 * R3: category order Geometry → Transform → Fill → Stroke → Effects → Timing.
 * R4: defaults spread shared Transform/Timing + produce a visible rectangle
 *     with solid fill.
 * R5 / R6: rendering and per-frame opacity come from later tier tasks
 *     (T-021, T-022, T-023-SHAPE).
 */
export const shapeComponent: SceneComponentDefinition<ShapeComponentOptions> = {
  id: "shape",
  name: "Shape",
  description: "Renders flat geometric primitives with configurable fill, stroke, and effects.",
  staticWhenMarkupUnchanged: true,
  options: shapeOptionsSchema,
  defaultOptions: DEFAULT_SHAPE_OPTIONS,
  Component: () => null
};
