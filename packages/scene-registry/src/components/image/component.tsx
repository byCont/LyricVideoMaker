import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import {
  DEFAULT_IMAGE_OPTIONS,
  imageOptionsSchema,
  type ImageComponentOptions
} from "./options";
import { buildImageInitialState } from "./runtime";

/**
 * Image component (cavekit-image-component).
 *
 * The outer container honors the shared Transform helper plus corner
 * radius (clipping), optional border, and stacked shadow/glow. The
 * inner <img> uses fit mode + CSS filters. When tint is enabled a
 * multiply-blend overlay renders on top. When the image URL cannot be
 * resolved the component renders nothing without error.
 *
 * Per-frame state returns opacity = component opacity option * shared
 * Timing helper result. Markup is stable once the URL is known; the
 * render pipeline treats the component as static.
 */
export const imageComponent: SceneComponentDefinition<ImageComponentOptions> = {
  id: "image",
  name: "Image",
  description: "Positioned raster image with fit modes, effects, filters, and tint.",
  staticWhenMarkupUnchanged: true,
  options: imageOptionsSchema,
  defaultOptions: DEFAULT_IMAGE_OPTIONS,
  Component: ({ instance, options, assets }) => {
    const url = assets.getUrl(instance.id, "source");
    const initial = buildImageInitialState(options, url);
    if (!initial.sourceUrl) {
      return null;
    }
    return (
      <div
        style={initial.containerStyle as React.CSSProperties}
        data-image-component=""
        dangerouslySetInnerHTML={{ __html: initial.html }}
      />
    );
  }
};
