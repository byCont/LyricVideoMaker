import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import {
  DEFAULT_VIDEO_OPTIONS,
  videoOptionsSchema,
  type VideoComponentOptions
} from "./options";
import { prepareVideoComponent } from "./prepare";
import { VideoRenderComponent } from "./react-component";

/**
 * Video component (cavekit-video-component).
 *
 * Architecture:
 *   - Renderer extracts source video to JPEG frame files before Chromium
 *     workers mount the scene.
 *   - prepare phase probes duration / dimensions / frame rate via
 *     ffprobe (R5) so the per-frame playback math never re-probes.
 *   - Per-frame state maps playback time to extracted frame URL and
 *     returns __imageFrameSync consumed by live DOM image readiness.
 */
export const videoComponent: SceneComponentDefinition<VideoComponentOptions> = {
  id: "video",
  name: "Video",
  description:
    "Positioned video playback synchronized to the song timeline via extracted image frames.",
  staticWhenMarkupUnchanged: false,
  options: videoOptionsSchema,
  defaultOptions: DEFAULT_VIDEO_OPTIONS,
  getPrepareCacheKey: ({ instance, options, video, audioPath }) => {
    return `${instance.id}|${options.source}|${video.width}x${video.height}|${audioPath}`;
  },
  prepare: async (ctx) => prepareVideoComponent(ctx),
  Component: VideoRenderComponent
};
