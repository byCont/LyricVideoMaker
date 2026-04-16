import type { SceneDefinition } from "@lyric-video-maker/core";
import { DEFAULT_TRANSFORM_OPTIONS } from "@lyric-video-maker/plugin-base";

export const synthwaveScene: SceneDefinition = {
  id: "synthwave",
  name: "Synthwave",
  description:
    "Retro 80s aesthetic with a pink-purple gradient, cyan neon lyrics, line equalizer, and decorative grid lines.",
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
        topColor: "#1a0a2e",
        topOpacity: 100,
        bottomColor: "#2d0a3e",
        bottomOpacity: 100
      }
    },
    {
      id: "grid-line-1",
      componentId: "shape",
      enabled: true,
      modifiers: [
        {
          id: "grid-line-1-transform",
          modifierId: "transform",
          enabled: true,
          options: {
            ...DEFAULT_TRANSFORM_OPTIONS,
            x: 0,
            y: 85,
            width: 100,
            height: 1
          }
        }
      ],
      options: {
        shapeType: "line",
        fillEnabled: false,
        strokeEnabled: true,
        strokeColor: "#ff2d95",
        strokeWidth: 2,
        strokeOpacity: 60
      }
    },
    {
      id: "grid-line-2",
      componentId: "shape",
      enabled: true,
      modifiers: [
        {
          id: "grid-line-2-transform",
          modifierId: "transform",
          enabled: true,
          options: {
            ...DEFAULT_TRANSFORM_OPTIONS,
            x: 0,
            y: 92,
            width: 100,
            height: 1
          }
        }
      ],
      options: {
        shapeType: "line",
        fillEnabled: false,
        strokeEnabled: true,
        strokeColor: "#ff2d95",
        strokeWidth: 1,
        strokeOpacity: 30
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
            y: 70,
            height: 30
          }
        }
      ],
      options: {
        graphMode: "line",
        lineStyle: "area",
        lineBaseline: "bottom",
        primaryColor: "#ff2d95",
        secondaryColor: "#7b2fff",
        opacity: 35,
        glowEnabled: true,
        glowColor: "#ff2d95",
        glowStrength: 50
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
            height: 70
          }
        }
      ],
      options: {
        lyricColor: "#00f0ff",
        lyricPosition: "middle",
        lyricSize: 76,
        borderEnabled: true,
        borderColor: "#001a1f",
        borderThickness: 2,
        shadowEnabled: true,
        shadowColor: "#00f0ff",
        shadowIntensity: 100
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
            y: 3,
            height: 10
          }
        }
      ],
      options: {
        text: "TRACK TITLE",
        fontSize: 20,
        fontWeight: 300,
        letterSpacing: 12,
        colorMode: "gradient",
        gradientStart: "#ff2d95",
        gradientEnd: "#00f0ff",
        gradientAngle: 90,
        textCase: "uppercase",
        textAlign: "center"
      }
    }
  ]
};
