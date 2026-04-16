import type { SceneComponentDefinition, SceneDefinition } from "@lyric-video-maker/core";
import type { ModifierDefinition } from "@lyric-video-maker/plugin-base";
import {
  backgroundColorComponent,
  builtInSceneComponents,
  equalizerComponent,
  lyricsByLineComponent
} from "./components";
import { builtInModifiers, getModifierDefinition } from "./modifiers";
import { audioBarsScene } from "./scenes/audio-bars";
import { boldImpactScene } from "./scenes/bold-impact";
import { cinematicScene } from "./scenes/cinematic";
import { concertStageScene } from "./scenes/concert-stage";
import { gradientMoodScene } from "./scenes/gradient-mood";
import { lofiScene } from "./scenes/lofi";
import { lowerThirdScene } from "./scenes/lower-third";
import { minimalDarkScene } from "./scenes/minimal-dark";
import { neonGlowScene } from "./scenes/neon-glow";
import { photoMemoriesScene } from "./scenes/photo-memories";
import { singleImageLyricsScene } from "./scenes/single-image-lyrics";
import { synthwaveScene } from "./scenes/synthwave";

export {
  backgroundColorComponent,
  equalizerComponent,
  builtInSceneComponents,
  builtInModifiers,
  getModifierDefinition,
  lyricsByLineComponent,
  singleImageLyricsScene
};

export const builtInScenes: SceneDefinition[] = [
  singleImageLyricsScene,
  minimalDarkScene,
  gradientMoodScene,
  boldImpactScene,
  audioBarsScene,
  neonGlowScene,
  photoMemoriesScene,
  lowerThirdScene,
  concertStageScene,
  synthwaveScene,
  cinematicScene,
  lofiScene
];

export function getSceneDefinition(sceneId: string): SceneDefinition | undefined {
  return builtInScenes.find((scene) => scene.id === sceneId);
}

export function getSceneComponentDefinition(
  componentId: string
): SceneComponentDefinition<Record<string, unknown>> | undefined {
  return builtInSceneComponents.find((component) => component.id === componentId);
}
