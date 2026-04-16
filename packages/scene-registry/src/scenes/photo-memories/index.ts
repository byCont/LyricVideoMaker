import type { SceneDefinition } from "@lyric-video-maker/core";
import { DEFAULT_TRANSFORM_OPTIONS } from "@lyric-video-maker/plugin-base";

export const photoMemoriesScene: SceneDefinition = {
  id: "photo-memories",
  name: "Photo Memories",
  description:
    "Slideshow background with Ken Burns effect, dark overlay for readability, lyrics at bottom, and a title at top.",
  source: "built-in",
  readOnly: true,
  components: [
    {
      id: "slideshow-1",
      componentId: "slideshow",
      enabled: true,
      modifiers: [],
      options: {
        kenBurnsEnabled: true,
        kenBurnsScale: 15,
        transitionDuration: 2000,
        slideDuration: 8000,
        fitMode: "cover"
      }
    },
    {
      id: "background-color-1",
      componentId: "background-color",
      enabled: true,
      modifiers: [],
      options: {
        mode: "gradient",
        direction: "0deg",
        topColor: "#000000",
        topOpacity: 30,
        bottomColor: "#000000",
        bottomOpacity: 75
      }
    },
    {
      id: "static-text-1",
      componentId: "static-text",
      enabled: true,
      modifiers: [
        {
          id: "static-text-1-transform",
          modifierId: "transform",
          enabled: true,
          options: {
            ...DEFAULT_TRANSFORM_OPTIONS,
            y: 2,
            height: 8
          }
        }
      ],
      options: {
        text: "Song Title",
        fontSize: 28,
        fontWeight: 300,
        color: "#cccccc",
        textAlign: "center"
      }
    },
    {
      id: "lyrics-by-line-1",
      componentId: "lyrics-by-line",
      enabled: true,
      modifiers: [],
      options: {
        lyricPosition: "bottom",
        shadowEnabled: true,
        shadowIntensity: 80
      }
    }
  ]
};
