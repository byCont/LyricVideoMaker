import type { SceneDefinition } from "@lyric-video-maker/core";
import { createPluginAssetUri } from "@lyric-video-maker/core";
import { DEFAULT_TRANSFORM_OPTIONS } from "@lyric-video-maker/plugin-base";

export const lofiScene: SceneDefinition = {
  id: "lofi",
  name: "Lofi",
  description:
    "Cozy anime-style room background with warm tones, gentle equalizer bars, and soft cream lyrics. Perfect for lofi, chill, and acoustic tracks.",
  source: "built-in",
  readOnly: true,
  components: [
    {
      id: "background-image-1",
      componentId: "image",
      enabled: true,
      modifiers: [],
      options: {
        source: createPluginAssetUri("scene-registry", "assets/lofi-background.png"),
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
        topColor: "#1a0f0a",
        topOpacity: 25,
        bottomColor: "#1a0f0a",
        bottomOpacity: 65
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
            y: 80,
            height: 20
          }
        }
      ],
      options: {
        layoutMode: "mirrored",
        barCount: 24,
        cornerRadius: 999,
        minBarScale: 8,
        maxBarScale: 80,
        colorMode: "gradient",
        primaryColor: "#ffb347",
        secondaryColor: "#e8825c",
        opacity: 40,
        smoothing: 55,
        attackMs: 80,
        releaseMs: 400,
        sensitivity: 1.0,
        glowEnabled: true,
        glowColor: "#ffb347",
        glowStrength: 25,
        shadowEnabled: false
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
            x: 5,
            y: 80,
            width: 90,
            height: 1
          }
        }
      ],
      options: {
        shapeType: "line",
        fillEnabled: false,
        strokeEnabled: true,
        strokeColor: "#fff5e6",
        strokeWidth: 1,
        strokeOpacity: 15
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
            height: 78
          }
        }
      ],
      options: {
        lyricColor: "#fff5e6",
        lyricPosition: "bottom",
        lyricSize: 64,
        shadowEnabled: true,
        shadowColor: "#1a0f0a",
        shadowIntensity: 70
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
            x: 2,
            y: 2,
            width: 30,
            height: 6
          }
        }
      ],
      options: {
        text: "now playing",
        fontSize: 16,
        fontWeight: 300,
        color: "#aa9080",
        textAlign: "left",
        textCase: "lowercase"
      }
    }
  ]
};
