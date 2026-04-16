import type React from "react";
import type { RefObject } from "react";
import type {
  ModifierDefinition,
  ModifierInstance,
  SerializedModifierDefinition,
  ValidatedModifierInstance
} from "./modifier";

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
      type: "image-list";
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
  isPluginAssetAccessible?: (pluginId: string, relativePath: string) => boolean;
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
  /** Ordered stack of modifiers wrapping this component. Outermost first. */
  modifiers: ModifierInstance[];
  options: Record<string, unknown>;
}

export interface ValidatedSceneComponentInstance extends Omit<SceneComponentInstance, "modifiers"> {
  componentName: string;
  modifiers: ValidatedModifierInstance[];
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
  /**
   * The innermost wrapper element the component renders into. Components
   * that need to know their own pixel size (canvas allocation, text
   * wrapping, audio-reactive layouts) attach `useContainerSize` to this
   * ref. Modifiers wrap this element but never touch its own style.
   */
  containerRef: RefObject<HTMLDivElement | null>;
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

export type { SerializedModifierDefinition } from "./modifier";

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

/**
 * Plugin sub-host for registering modifier definitions. Plugins call
 * `host.modifiers.register(def)` during activate() to contribute modifiers
 * to the render tree alongside the built-ins.
 */
export interface LyricVideoPluginModifierHost {
  register(definition: ModifierDefinition<any>): void;
}

export interface LyricVideoPluginHost {
  React: typeof React;
  core: LyricVideoPluginCoreHost;
  modifiers: LyricVideoPluginModifierHost;
}

export interface LyricVideoPluginActivation {
  components: SceneComponentDefinition<any>[];
  scenes: SceneDefinition[];
  modifiers?: ModifierDefinition<any>[];
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

// Modifier system
export type {
  ModifierDefinition,
  ModifierApplyContext,
  ModifierInstance,
  ValidatedModifierInstance
} from "./modifier";

export { useContainerSize, readContainerSize, type ContainerSize } from "./use-container-size";

// Plugin asset utilities
export {
  PLUGIN_ASSET_PREFIX,
  isPluginAssetUri,
  parsePluginAssetUri,
  createPluginAssetUri
} from "./plugin-assets";
