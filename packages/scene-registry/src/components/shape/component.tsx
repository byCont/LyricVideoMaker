import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import {
  DEFAULT_SHAPE_OPTIONS,
  shapeOptionsSchema,
  type ShapeComponentOptions
} from "./options";
import { buildShapeInitialState } from "./runtime";

/**
 * Shape component (cavekit-shape-component).
 *
 * R1: identifier "shape".
 * R2: options contract in ./options.ts.
 * R3: category order Geometry → Transform → Fill → Stroke → Effects → Timing.
 * R4: defaults produce a visible solid rectangle.
 * R5: rendering — buildShapeInitialState builds the HTML fragment consumed
 *     by both the React SSR Component path and the live-DOM
 *     static-fx-layer runtime, so both paths produce identical markup.
 * R6: per-frame opacity comes from the shared Timing helper; markup is
 *     static once mounted (staticWhenMarkupUnchanged: true).
 * R7: options contain no image or video fields (verified in tests).
 */
export const shapeComponent: SceneComponentDefinition<ShapeComponentOptions> = {
  id: "shape",
  name: "Shape",
  description: "Renders flat geometric primitives with configurable fill, stroke, and effects.",
  staticWhenMarkupUnchanged: true,
  options: shapeOptionsSchema,
  defaultOptions: DEFAULT_SHAPE_OPTIONS,
  Component: ({ options }) => {
    const initial = buildShapeInitialState(options);
    return (
      <div
        style={initial.containerStyle as React.CSSProperties}
        data-shape-component={options.shapeType}
        dangerouslySetInnerHTML={{ __html: initial.html }}
      />
    );
  }
};
