import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";

/**
 * Static Text component — minimal identity stub (T-025).
 *
 * Options, defaults, rendering, token substitution, and time-gated visibility
 * are filled in by later tiers: T-026 (options contract), T-027 (schema
 * order), T-028 (defaults), T-029 (tokens), T-030 (color + case), T-031
 * (effects + backdrop), T-032 (per-frame opacity).
 *
 * Options are intentionally empty to satisfy T-033 (no asset fields).
 */
export const staticTextComponent: SceneComponentDefinition<Record<string, unknown>> = {
  id: "static-text",
  name: "Static Text",
  description: "Positioned typographic text with styling, color modes, and effects.",
  staticWhenMarkupUnchanged: true,
  options: [],
  defaultOptions: {},
  Component: () => null
};
