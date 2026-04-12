import type { SerializedSceneDefinition } from "@lyric-video-maker/plugin-types";

export type {
  BrowserLyricRuntime,
  PreparedSceneComponentData,
  PreparedSceneStackData,
  SceneAssetAccessor,
  SceneBrowserFrameStateContext,
  SceneBrowserInitialStateContext,
  SceneBrowserRuntimeDefinition,
  SceneComponentDefinition,
  SceneComponentInstance,
  SceneDefinition,
  ScenePrepareCacheKeyContext,
  ScenePrepareContext,
  SceneRenderProps,
  SceneSource,
  SerializedSceneComponentDefinition,
  SerializedSceneDefinition,
  ValidatedSceneComponentInstance
} from "@lyric-video-maker/plugin-types";

export interface SceneFileData {
  version: number;
  scene: SerializedSceneDefinition;
}
