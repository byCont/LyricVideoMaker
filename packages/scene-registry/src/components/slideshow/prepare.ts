import type { ScenePrepareContext, ScenePrepareCacheKeyContext, PreparedSceneComponentData } from "@lyric-video-maker/core";
import { buildSlideSchedule } from "./timing";
import { validateSlideshowOptions } from "./validation";
import type { SlideshowComponentOptions, PreparedSlideshowData } from "./types";

export function getSlideshowPrepareCacheKey(
  ctx: ScenePrepareCacheKeyContext<SlideshowComponentOptions>
): string | null {
  return JSON.stringify({
    images: ctx.options.images,
    timingMode: ctx.options.timingMode,
    slideDuration: ctx.options.slideDuration,
    transitionDuration: ctx.options.transitionDuration,
    initialDelay: ctx.options.initialDelay,
    slideOrder: ctx.options.slideOrder,
    repeatMode: ctx.options.repeatMode,
    randomSeed: ctx.options.randomSeed,
    videoDurationMs: ctx.video.durationMs
  });
}

export async function prepareSlideshowComponent(
  ctx: ScenePrepareContext<SlideshowComponentOptions>
): Promise<PreparedSceneComponentData> {
  validateSlideshowOptions(ctx.options);

  const { schedule, effectiveOrder } = buildSlideSchedule(
    ctx.options,
    ctx.lyrics.cues,
    ctx.video.durationMs
  );

  const data: PreparedSlideshowData = {
    slideSchedule: schedule,
    effectiveOrder,
    totalSlides: schedule.length
  };

  return data as unknown as PreparedSceneComponentData;
}
