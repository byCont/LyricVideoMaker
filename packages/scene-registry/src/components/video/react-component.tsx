import React from "react";
import type { SceneRenderProps } from "@lyric-video-maker/core";
import { buildVideoInitialState } from "./runtime";
import type { VideoComponentOptions } from "./options";

const VIDEO_FRAME_EXTRACTION_PREPARED_KEY = "__videoFrameExtraction";

export function VideoRenderComponent({
  instance,
  options,
  video,
  assets,
  prepared
}: SceneRenderProps<VideoComponentOptions>) {
  const url = assets.getUrl(instance.id, "source");
  const initial = buildVideoInitialState(options, video, url, getVideoFrameExtraction(prepared));
  if (!initial.sourceUrl) {
    return null;
  }
  return (
    <div
      style={initial.containerStyle as React.CSSProperties}
      data-video-component=""
      dangerouslySetInnerHTML={{ __html: initial.html }}
    />
  );
}

export function getVideoFrameExtraction(prepared: Record<string, unknown>) {
  const metadata = prepared[VIDEO_FRAME_EXTRACTION_PREPARED_KEY];
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const value = metadata as {
    mode?: unknown;
    urlPrefix?: unknown;
    outputFps?: unknown;
    frameCount?: unknown;
  };
  if (
    value.mode !== "image-sequence" ||
    typeof value.urlPrefix !== "string" ||
    typeof value.outputFps !== "number" ||
    typeof value.frameCount !== "number" ||
    value.frameCount <= 0
  ) {
    return null;
  }

  return {
    mode: "image-sequence" as const,
    urlPrefix: value.urlPrefix,
    outputFps: value.outputFps,
    frameCount: value.frameCount
  };
}
