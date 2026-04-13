import type React from "react";
import type { CSSProperties } from "react";
import type { TransformOptions } from "./transform";
import type { TransformCanvas } from "./transform-runtime";
import type { TimingOptions } from "./timing";

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

export interface BrowserLyricRuntime {
  current: LyricCue | null;
  next: LyricCue | null;
}

export interface VideoSettings {
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  durationInFrames: number;
}

interface SceneOptionFieldBase {
  id: string;
  label: string;
}

export type SceneOptionField =
  | ({
      type: "boolean";
      defaultValue?: boolean;
    } & SceneOptionFieldBase)
  | ({
      type: "number";
      defaultValue?: number;
      min?: number;
      max?: number;
      step?: number;
    } & SceneOptionFieldBase)
  | ({
      type: "text";
      defaultValue?: string;
      multiline?: boolean;
    } & SceneOptionFieldBase)
  | ({
      type: "color";
      defaultValue?: string;
    } & SceneOptionFieldBase)
  | ({
      type: "font";
      defaultValue?: string;
    } & SceneOptionFieldBase)
  | ({
      type: "image";
      required?: boolean;
    } & SceneOptionFieldBase)
  | ({
      type: "video";
      required?: boolean;
    } & SceneOptionFieldBase)
  | ({
      type: "select";
      defaultValue?: string;
      options: { label: string; value: string }[];
    } & SceneOptionFieldBase);

export interface SceneOptionCategory {
  type: "category";
  id: string;
  label: string;
  defaultExpanded?: boolean;
  options: SceneOptionField[];
}

export type SceneOptionEntry = SceneOptionField | SceneOptionCategory;

export interface SceneValidationContext {
  isFileAccessible?: (path: string) => boolean;
}

export type SceneAudioBandDistribution = "linear" | "log";

export interface SceneAudioAnalysisRequest {
  bandCount: number;
  minFrequency: number;
  maxFrequency: number;
  analysisFps: number;
  sensitivity: number;
  smoothing: number;
  attackMs: number;
  releaseMs: number;
  silenceFloor: number;
  bandDistribution: SceneAudioBandDistribution;
}

export interface SceneAudioAnalysisResult {
  fps: number;
  frameCount: number;
  bandCount: number;
  values: number[][];
}
export interface SceneAssetAccessor {
  getPath(instanceId: string, optionId: string): string | null;
  getUrl(instanceId: string, optionId: string): string | null;
}

export type PreparedSceneComponentData = Record<string, unknown>;
export type PreparedSceneStackData = Record<string, PreparedSceneComponentData>;
export type SceneSource = "built-in" | "user" | "plugin";

export interface SceneComponentInstance {
  id: string;
  componentId: string;
  enabled: boolean;
  options: Record<string, unknown>;
}

export interface ValidatedSceneComponentInstance extends SceneComponentInstance {
  componentName: string;
}

export interface ScenePrepareContext<TOptions> {
  instance: ValidatedSceneComponentInstance;
  options: TOptions;
  video: VideoSettings;
  lyrics: LyricRuntime;
  assets: SceneAssetAccessor;
  audio: {
    path: string;
    getSpectrum(request: SceneAudioAnalysisRequest): Promise<SceneAudioAnalysisResult>;
  };
  signal?: AbortSignal;
}

export interface ScenePrepareCacheKeyContext<TOptions> {
  instance: ValidatedSceneComponentInstance;
  options: TOptions;
  video: VideoSettings;
  audioPath: string;
}

export interface SceneRenderProps<TOptions> {
  instance: ValidatedSceneComponentInstance;
  options: TOptions;
  frame: number;
  timeMs: number;
  video: VideoSettings;
  lyrics: LyricRuntime;
  assets: Pick<SceneAssetAccessor, "getUrl">;
  prepared: PreparedSceneComponentData;
}

export interface SceneComponentDefinition<TOptions> {
  id: string;
  name: string;
  description?: string;
  staticWhenMarkupUnchanged?: boolean;
  options: SceneOptionEntry[];
  defaultOptions: TOptions;
  validate?: (raw: unknown) => TOptions;
  getPrepareCacheKey?: (ctx: ScenePrepareCacheKeyContext<TOptions>) => string | null;
  prepare?: (ctx: ScenePrepareContext<TOptions>) => Promise<PreparedSceneComponentData>;
  Component: (props: SceneRenderProps<TOptions>) => React.ReactElement | null;
}

export interface SceneDefinition {
  id: string;
  name: string;
  description?: string;
  source: SceneSource;
  readOnly: boolean;
  filePath?: string;
  components: SceneComponentInstance[];
}

export interface SerializedSceneComponentDefinition {
  id: string;
  name: string;
  description?: string;
  options: SceneOptionEntry[];
  defaultOptions: Record<string, unknown>;
}

export interface SerializedSceneDefinition {
  id: string;
  name: string;
  description?: string;
  source: SceneSource;
  readOnly: boolean;
  filePath?: string;
  components: SceneComponentInstance[];
}

export interface LyricVideoPluginManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  version: string;
  entry: string;
  components: string[];
  scenes: string[];
}

export interface LyricVideoPluginCoreHost {
  validateSceneOptions<TOptions>(
    component: SceneComponentDefinition<TOptions>,
    rawOptions: unknown,
    context?: SceneValidationContext
  ): TOptions;
}

export interface LyricVideoPluginTransformHost {
  computeTransformStyle(options: TransformOptions, canvas: TransformCanvas): CSSProperties;
  computeTimingOpacity(currentTimeMs: number, timing: TimingOptions): number;
  transformCategory: SceneOptionCategory;
  timingCategory: SceneOptionCategory;
  DEFAULT_TRANSFORM_OPTIONS: TransformOptions;
  DEFAULT_TIMING_OPTIONS: TimingOptions;
}

export interface LyricVideoPluginHost {
  React: typeof React;
  core: LyricVideoPluginCoreHost;
  transform: LyricVideoPluginTransformHost;
}

export interface LyricVideoPluginActivation {
  components: SceneComponentDefinition<any>[];
  scenes: SceneDefinition[];
}

export interface LyricVideoPluginModule {
  activate(host: LyricVideoPluginHost): LyricVideoPluginActivation;
}

// Transform system
export {
  DEFAULT_TRANSFORM_OPTIONS,
  TRANSFORM_ANCHOR_VALUES,
  transformCategory,
  type TransformAnchor,
  type TransformOptions
} from "./transform";

export { computeTransformStyle, type TransformCanvas } from "./transform-runtime";

// Timing system
export {
  DEFAULT_TIMING_OPTIONS,
  TIMING_EASING_VALUES,
  timingCategory,
  type TimingEasing,
  type TimingOptions
} from "./timing";

export { computeTimingOpacity } from "./timing-runtime";
