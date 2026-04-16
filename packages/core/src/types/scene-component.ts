import type { SerializedSceneDefinition } from "@lyric-video-maker/plugin-base";

export type {
  BrowserLyricRuntime,
  ContainerSize,
  ModifierApplyContext,
  ModifierDefinition,
  ModifierInstance,
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
  SerializedModifierDefinition,
  SerializedSceneComponentDefinition,
  SerializedSceneDefinition,
  ValidatedModifierInstance,
  ValidatedSceneComponentInstance
} from "@lyric-video-maker/plugin-base";

export interface SceneFileData {
  version: number;
  scene: SerializedSceneDefinition;
}
