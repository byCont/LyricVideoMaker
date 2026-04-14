import type { VideoSettings } from "@lyric-video-maker/core";
import { computeTransformStyle, computeTimingOpacity } from "../../shared";
import { withAlpha } from "../../shared/color";
import type { VideoComponentOptions } from "./options";

export interface VideoInitialState {
  html: string;
  containerStyle: Record<string, string>;
  initialOpacity: number;
  sourceUrl: string | null;
}

export interface VideoFrameExtractionMetadata {
  mode: "image-sequence";
  urlPrefix: string;
  outputFps: number;
  frameCount: number;
}

/**
 * Build Video component browser-side initial state. Runtime uses extracted
 * JPEG frame files, not HTMLVideoElement seeking. The container handles
 * positioning only; all visual effects are applied to the inner image element.
 */
export function buildVideoInitialState(
  options: VideoComponentOptions,
  video: VideoSettings,
  _resolvedUrl: string | null,
  frameExtraction?: VideoFrameExtractionMetadata | null
): VideoInitialState {
  const transformStyle = computeTransformStyle(options, {
    width: video.width,
    height: video.height
  });
  const containerStyle: Record<string, string> = {};
  for (const [key, value] of Object.entries(transformStyle)) {
    if (value !== undefined && value !== null) {
      containerStyle[key] = String(value);
    }
  }

  const html = frameExtraction ? buildImageSequenceMarkup(options) : "";
  const initialOpacity = (options.opacity / 100) * computeTimingOpacity(0, options);

  return {
    html,
    containerStyle,
    initialOpacity,
    sourceUrl: frameExtraction ? frameExtraction.urlPrefix : null
  };
}

function buildImageSequenceMarkup(options: VideoComponentOptions): string {
  const fitMode = options.fitMode;
  const filter = buildCombinedFilter(options);
  let imgStyle = `position:absolute;inset:0;width:100%;height:100%;object-fit:${fitMode};border-radius:${options.cornerRadius}px;`;
  if (options.borderEnabled && options.borderThickness > 0) {
    imgStyle += `border:${options.borderThickness}px solid ${options.borderColor};box-sizing:border-box;`;
  }
  if (filter) {
    imgStyle += `filter:${filter};`;
  }
  const image = `<img data-video-frame="" alt="" style="${imgStyle}" />`;
  const tint = options.tintEnabled
    ? `<div style="position:absolute;inset:0;border-radius:${options.cornerRadius}px;background:${withAlpha(options.tintColor, options.tintStrength / 100)};mix-blend-mode:multiply;"></div>`
    : "";
  return `${image}${tint}`;
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
