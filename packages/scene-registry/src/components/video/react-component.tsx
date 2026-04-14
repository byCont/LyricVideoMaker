import React from "react";
import type { SceneRenderProps } from "@lyric-video-maker/core";
import { withAlpha } from "../../shared/color";
import { buildVideoInitialState } from "./runtime";
import type { VideoComponentOptions } from "./options";
import {
  computeVideoPlaybackState,
  mapVideoPlaybackTimeToFrameNumber,
  formatVideoFrameName
} from "./playback";

const VIDEO_FRAME_EXTRACTION_PREPARED_KEY = "__videoFrameExtraction";

export function VideoRenderComponent({
  instance,
  options,
  video,
  timeMs,
  assets,
  prepared
}: SceneRenderProps<VideoComponentOptions>) {
  const url = assets.getUrl(instance.id, "source");
  const frameExtraction = getVideoFrameExtraction(prepared);
  const initial = buildVideoInitialState(options, video, url, frameExtraction);

  if (!initial.sourceUrl || !frameExtraction) {
    return null;
  }

  const durationMs =
    typeof (prepared as Record<string, unknown>).durationMs === "number"
      ? (prepared as Record<string, unknown>).durationMs as number
      : 0;

  const playback = computeVideoPlaybackState({
    options: {
      playbackMode: options.playbackMode,
      videoStartOffsetMs: options.videoStartOffsetMs,
      playbackSpeed: options.playbackSpeed,
      startTime: options.startTime
    },
    durationMs,
    timeMs
  });

  if (playback.hidden) {
    return null;
  }

  const frameNum = mapVideoPlaybackTimeToFrameNumber({
    targetTimeSeconds: playback.targetTimeSeconds,
    fps: frameExtraction.outputFps,
    frameCount: frameExtraction.frameCount
  });
  const frameSrc = `${frameExtraction.urlPrefix}${formatVideoFrameName(frameNum)}`;

  const filter = buildCombinedFilter(options);
  const imgStyle: React.CSSProperties = {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: options.fitMode,
    borderRadius: `${options.cornerRadius}px`
  };
  if (options.borderEnabled && options.borderThickness > 0) {
    imgStyle.border = `${options.borderThickness}px solid ${options.borderColor}`;
    imgStyle.boxSizing = "border-box";
  }
  if (filter) {
    imgStyle.filter = filter;
  }

  return (
    <div
      style={initial.containerStyle as React.CSSProperties}
      data-video-component=""
    >
      <img
        data-video-frame=""
        alt=""
        src={frameSrc}
        style={imgStyle}
      />
      {options.tintEnabled && (
        <div
          style={{
            position: "absolute",
            inset: "0",
            borderRadius: `${options.cornerRadius}px`,
            background: withAlpha(options.tintColor, options.tintStrength / 100),
            mixBlendMode: "multiply"
          }}
        />
      )}
    </div>
  );
}

function buildCombinedFilter(options: VideoComponentOptions): string {
  const parts: string[] = [];
  if (options.grayscale > 0) parts.push(`grayscale(${options.grayscale / 100})`);
  if (options.blur > 0) parts.push(`blur(${options.blur}px)`);
  if (options.brightness !== 100) parts.push(`brightness(${options.brightness / 100})`);
  if (options.contrast !== 100) parts.push(`contrast(${options.contrast / 100})`);
  if (options.saturation !== 100) parts.push(`saturate(${options.saturation / 100})`);
  if (options.shadowEnabled) {
    parts.push(
      `drop-shadow(${options.shadowOffsetX}px ${options.shadowOffsetY}px ${options.shadowBlur}px ${options.shadowColor})`
    );
  }
  if (options.glowEnabled) {
    parts.push(`drop-shadow(0 0 ${options.glowStrength}px ${options.glowColor})`);
  }
  return parts.join(" ");
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
