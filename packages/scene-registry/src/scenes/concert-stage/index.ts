import type { SceneDefinition } from "@lyric-video-maker/core";
import { DEFAULT_TRANSFORM_OPTIONS } from "@lyric-video-maker/plugin-base";

export const concertStageScene: SceneDefinition = {
  id: "concert-stage",
  name: "Concert Stage",
  description:
    "Full production look with a dark gradient, mirrored equalizer, glowing lyrics, artist name, and a decorative divider line.",
  source: "built-in",
  readOnly: true,
  components: [
    {
      id: "background-color-1",
      componentId: "background-color",
      enabled: true,
      modifiers: [],
      options: {
        mode: "gradient",
        direction: "180deg",
        topColor: "#0a0a1a",
        topOpacity: 100,
        bottomColor: "#050510",
        bottomOpacity: 100
      }
    },
    {
      id: "equalizer-1",
      componentId: "equalizer",
      enabled: true,
      modifiers: [
        {
          id: "equalizer-1-transform",
          modifierId: "transform",
          enabled: true,
          options: {
            ...DEFAULT_TRANSFORM_OPTIONS,
            y: 65,
            height: 35
          }
        }
      ],
      options: {
        layoutMode: "mirrored",
        barCount: 48,
        primaryColor: "#ff6b35",
        secondaryColor: "#ff2d55",
        glowColor: "#ff6b35",
        glowStrength: 45,
        opacity: 75
      }
    },
    {
      id: "divider-1",
      componentId: "shape",
      enabled: true,
      modifiers: [
        {
          id: "divider-1-transform",
          modifierId: "transform",
          enabled: true,
          options: {
            ...DEFAULT_TRANSFORM_OPTIONS,
            x: 10,
            y: 62,
            width: 80,
            height: 1
          }
        }
      ],
      options: {
        shapeType: "line",
        fillEnabled: false,
        strokeEnabled: true,
        strokeColor: "#ffffff",
        strokeWidth: 1,
        strokeOpacity: 30
      }
    },
    {
      id: "lyrics-by-line-1",
      componentId: "lyrics-by-line",
      enabled: true,
      modifiers: [
        {
          id: "lyrics-by-line-1-transform",
          modifierId: "transform",
          enabled: true,
          options: {
            ...DEFAULT_TRANSFORM_OPTIONS,
            height: 60
          }
        }
      ],
      options: {
        lyricPosition: "middle",
        lyricSize: 80,
        shadowEnabled: true,
        shadowColor: "#ff6b35",
        shadowIntensity: 40
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
        text: "ARTIST",
        fontSize: 22,
        fontWeight: 400,
        letterSpacing: 8,
        color: "#aaaaaa",
        textCase: "uppercase",
        textAlign: "center"
      }
    }
  ]
};
