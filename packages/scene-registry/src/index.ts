import type { SceneDefinition } from "@lyric-video-maker/core";
import { singleImageLyricsScene } from "./single-image-lyrics";

export { singleImageLyricsScene };

export const builtInScenes: SceneDefinition<Record<string, unknown>>[] = [
  singleImageLyricsScene as unknown as SceneDefinition<Record<string, unknown>>
];

export function getSceneDefinition(sceneId: string): SceneDefinition<Record<string, unknown>> | undefined {
  return builtInScenes.find((scene) => scene.id === sceneId);
}
