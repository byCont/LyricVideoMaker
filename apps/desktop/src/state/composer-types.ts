import type {
  RenderOutputSettings,
  SerializedSceneDefinition,
  VideoSettings
} from "@lyric-video-maker/core";

export interface ComposerState {
  audioPath: string;
  subtitlePath: string;
  subtitleCues: import("@lyric-video-maker/core").LyricCue[];
  outputPath: string;
  scene: SerializedSceneDefinition | null;
  video: Pick<VideoSettings, "width" | "height" | "fps">;
  render: RenderOutputSettings;
}
