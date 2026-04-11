import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";

/**
 * Shape component — minimal identity stub (T-017).
 *
 * Options, defaults, and rendering are filled in by later tiers:
 *   T-018 (options contract), T-019 (schema order), T-020 (default visible
 *   rectangle), T-021/T-022 (rendering), T-023-SHAPE (per-frame opacity),
 *   T-024 (no asset fields).
 */
export const shapeComponent: SceneComponentDefinition<Record<string, unknown>> = {
  id: "shape",
  name: "Shape",
  description: "Renders flat geometric primitives with configurable fill, stroke, and effects.",
  staticWhenMarkupUnchanged: true,
  options: [],
  defaultOptions: {},
  Component: () => null
};
