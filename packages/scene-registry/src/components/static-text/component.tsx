import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import {
  DEFAULT_STATIC_TEXT_OPTIONS,
  staticTextOptionsSchema,
  type StaticTextComponentOptions
} from "./options";

/**
 * Static Text component (cavekit-static-text-component).
 *
 * R1: identifier "static-text".
 * R2: options contract in ./options.ts.
 * R3: category order Content/Typography/Color/Transform/Box/Effects/Timing.
 * R4: defaults spread shared Transform/Timing + legible placeholder text.
 * R5–R7: token substitution, rendering, and per-frame opacity come from
 *        later tier tasks (T-029, T-030, T-031, T-032).
 * R8: options contain no image or video fields (verified by test).
 */
export const staticTextComponent: SceneComponentDefinition<StaticTextComponentOptions> = {
  id: "static-text",
  name: "Static Text",
  description: "Positioned typographic text with styling, color modes, and effects.",
  staticWhenMarkupUnchanged: true,
  options: staticTextOptionsSchema,
  defaultOptions: DEFAULT_STATIC_TEXT_OPTIONS,
  Component: () => null
};
