import type React from "react";

export interface LyricCue {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
  lines: string[];
}

export interface LyricRuntime {
  cues: LyricCue[];
  current: LyricCue | null;
  next: LyricCue | null;
  getCueAt(ms: number): LyricCue | null;
  getNextCue(ms: number): LyricCue | null;
  getCuesInRange(startMs: number, endMs: number): LyricCue[];
  getCueProgress(cue: LyricCue, ms: number): number;
}

export interface VideoSettings {
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  durationInFrames: number;
}

export type SceneOptionField =
  | {
      type: "number";
      id: string;
      label: string;
      defaultValue?: number;
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      type: "text";
      id: string;
      label: string;
      defaultValue?: string;
      multiline?: boolean;
    }
  | {
      type: "color";
      id: string;
      label: string;
      defaultValue?: string;
    }
  | {
      type: "font";
      id: string;
      label: string;
      defaultValue?: string;
    }
  | {
      type: "image";
      id: string;
      label: string;
      required?: boolean;
    }
  | {
      type: "select";
      id: string;
      label: string;
      defaultValue?: string;
      options: { label: string; value: string }[];
    };

export interface SceneAssetAccessor {
  getPath(optionId: string): string | null;
  getUrl(optionId: string): string | null;
}

export type PreparedSceneData = Record<string, unknown>;

export interface ScenePrepareContext<TOptions> {
  options: TOptions;
  video: VideoSettings;
  lyrics: LyricRuntime;
  assets: SceneAssetAccessor;
  signal?: AbortSignal;
}

export interface SceneRenderProps<TOptions> {
  options: TOptions;
  frame: number;
  timeMs: number;
  video: VideoSettings;
  lyrics: LyricRuntime;
  assets: Pick<SceneAssetAccessor, "getUrl">;
  prepared: PreparedSceneData;
}

export interface SceneDefinition<TOptions> {
  id: string;
  name: string;
  description?: string;
  staticWhenMarkupUnchanged?: boolean;
  options: SceneOptionField[];
  defaultOptions: TOptions;
  validate?: (raw: unknown) => TOptions;
  prepare?: (ctx: ScenePrepareContext<TOptions>) => Promise<PreparedSceneData>;
  Component: (props: SceneRenderProps<TOptions>) => React.ReactElement;
}

export interface SerializedSceneDefinition {
  id: string;
  name: string;
  description?: string;
  options: SceneOptionField[];
  defaultOptions: Record<string, unknown>;
}

export interface RenderJob {
  id: string;
  audioPath: string;
  subtitlePath: string;
  outputPath: string;
  sceneId: string;
  options: Record<string, unknown>;
  video: VideoSettings;
  lyrics: LyricCue[];
  createdAt: string;
}

export type RenderStatus =
  | "queued"
  | "preparing"
  | "rendering"
  | "muxing"
  | "completed"
  | "failed"
  | "cancelled";

export type RenderLogLevel = "info" | "warning" | "error";

export interface RenderLogEntry {
  timestamp: string;
  level: RenderLogLevel;
  message: string;
}

export interface RenderHistoryEntry {
  id: string;
  sceneId: string;
  outputPath: string;
  createdAt: string;
  status: RenderStatus;
  progress: number;
  message: string;
  etaMs?: number;
  renderFps?: number;
  error?: string;
  logs?: RenderLogEntry[];
}

export interface RenderProgressEvent {
  jobId: string;
  status: RenderStatus;
  progress: number;
  message: string;
  etaMs?: number;
  renderFps?: number;
  outputPath?: string;
  error?: string;
  logEntry?: RenderLogEntry;
}

export interface SceneValidationContext {
  isFileAccessible?: (path: string) => boolean;
  supportedFonts?: readonly string[];
}

export interface CreateRenderJobInput<TOptions> {
  audioPath: string;
  subtitlePath: string;
  outputPath: string;
  scene: SceneDefinition<TOptions>;
  rawOptions: unknown;
  cues: LyricCue[];
  durationMs: number;
  createdAt?: Date;
  video?: Partial<Pick<VideoSettings, "width" | "height" | "fps">>;
  validationContext?: SceneValidationContext;
}
