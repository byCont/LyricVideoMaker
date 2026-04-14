import type { SlideshowComponentOptions } from "./types";

export function validateSlideshowOptions(options: SlideshowComponentOptions): void {
  if (options.timingMode === "fixed-duration") {
    if (options.transitionDuration >= options.slideDuration) {
      throw new Error('"Transition Duration" must be less than "Slide Duration".');
    }
    if (options.slideDuration < 500) {
      throw new Error('"Slide Duration" must be at least 500ms.');
    }
  }

  if (options.transitionDuration < 0) {
    throw new Error('"Transition Duration" must be non-negative.');
  }
}
