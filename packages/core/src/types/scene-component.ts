import type { SerializedSceneDefinition } from "@lyric-video-maker/plugin-base";

export type {
  BrowserLyricRuntime,
  PreparedSceneComponentData,
  PreparedSceneStackData,
  SceneAssetAccessor,
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
} from "@lyric-video-maker/plugin-base";

export interface SceneFileData {
  version: number;
  scene: SerializedSceneDefinition;
}
