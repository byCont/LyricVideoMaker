import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import { backgroundColorComponent } from "./background-color";
import { backgroundImageComponent } from "./background-image";
import { equalizerComponent } from "./equalizer";
import { imageComponent } from "./image";
import { lyricsByLineComponent } from "./lyrics-by-line";
import { shapeComponent } from "./shape";
import { staticTextComponent } from "./static-text";
import { videoComponent } from "./video";

export {
  backgroundColorComponent,
  backgroundImageComponent,
  equalizerComponent,
  imageComponent,
  lyricsByLineComponent,
  shapeComponent,
  staticTextComponent,
  videoComponent
};

export const builtInSceneComponents: SceneComponentDefinition<Record<string, unknown>>[] = [
  backgroundImageComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  backgroundColorComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  lyricsByLineComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  equalizerComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  shapeComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  staticTextComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  imageComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  videoComponent as unknown as SceneComponentDefinition<Record<string, unknown>>
];
