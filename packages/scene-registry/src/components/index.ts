import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import { backgroundColorComponent } from "./background-color";
import { equalizerComponent } from "./equalizer";
import { imageComponent } from "./image";
import { lyricsByLineComponent } from "./lyrics-by-line";
import { shapeComponent } from "./shape";
import { slideshowComponent } from "./slideshow";
import { staticTextComponent } from "./static-text";
import { videoComponent } from "./video";

export {
  backgroundColorComponent,
  equalizerComponent,
  imageComponent,
  lyricsByLineComponent,
  shapeComponent,
  slideshowComponent,
  staticTextComponent,
  videoComponent
};

export const builtInSceneComponents: SceneComponentDefinition<Record<string, unknown>>[] = [
  backgroundColorComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  lyricsByLineComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  equalizerComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  shapeComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  staticTextComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  imageComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  videoComponent as unknown as SceneComponentDefinition<Record<string, unknown>>,
  slideshowComponent as unknown as SceneComponentDefinition<Record<string, unknown>>
];
