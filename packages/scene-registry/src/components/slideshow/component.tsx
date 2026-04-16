import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import { DEFAULT_SLIDESHOW_OPTIONS, slideshowOptionsSchema } from "./options";
import { getSlideshowPrepareCacheKey, prepareSlideshowComponent } from "./prepare";
import {
  buildSlideshowStyles,
  buildSlideshowInnerHtml,
  computeSlideshowFrameState
} from "./runtime";
import type { SlideshowComponentOptions, PreparedSlideshowData, SlideScheduleEntry } from "./types";

export const slideshowComponent: SceneComponentDefinition<SlideshowComponentOptions> = {
  id: "slideshow",
  name: "Slideshow",
  description: "Animated slideshow with transitions, timing modes, Ken Burns effect, and multiple images.",
  staticWhenMarkupUnchanged: false,
  options: slideshowOptionsSchema,
  defaultOptions: DEFAULT_SLIDESHOW_OPTIONS,
  getPrepareCacheKey: getSlideshowPrepareCacheKey,
  prepare: prepareSlideshowComponent,
  Component: ({ instance, options, timeMs, assets, prepared }) => {
    const preparedData = prepared as unknown as PreparedSlideshowData;
    const schedule = preparedData.slideSchedule ?? ([] as SlideScheduleEntry[]);

    if (schedule.length === 0 || options.images.length === 0) {
      return null;
    }

    const { containerStyle, visualStyle } = buildSlideshowStyles(options);
    const frameState = computeSlideshowFrameState(timeMs, schedule, options);

    if (!frameState.currentSlide && !frameState.nextSlide) {
      return null;
    }

    const resolveImageUrl = (imageIndex: number) =>
      assets.getUrl(instance.id, `images[${imageIndex}]`);

    const html = buildSlideshowInnerHtml(frameState, options, resolveImageUrl);

    return (
      <div
        style={containerStyle as React.CSSProperties}
        data-slideshow-component=""
      >
        <div
          style={visualStyle as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }
};
