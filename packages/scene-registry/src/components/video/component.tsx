import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";

/**
 * Video component — minimal identity stub (T-049).
 *
 * Options, prepare phase, rendering, playback math, audio handling, and
 * frame-sync integration come from later tiers: T-050 (options contract),
 * T-051 (schema order), T-052 (defaults), T-053 (prepare probe), T-054
 * (rendering), T-055/T-056 (playback modes), T-057 (frame sync state),
 * T-058 (muted audio).
 */
export const videoComponent: SceneComponentDefinition<Record<string, unknown>> = {
  id: "video",
  name: "Video",
  description: "Positioned video playback with multiple playback modes, synced to the song timeline.",
  staticWhenMarkupUnchanged: true,
  options: [],
  defaultOptions: {},
  Component: () => null
};
