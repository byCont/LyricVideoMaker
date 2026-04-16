import type { SceneDefinition } from "@lyric-video-maker/core";
import { DEFAULT_TRANSFORM_OPTIONS } from "@lyric-video-maker/plugin-base";

export const neonGlowScene: SceneDefinition = {
  id: "neon-glow",
  name: "Neon Glow",
  description:
    "Near-black background with glowing cyan lyrics and a subtle line equalizer. EDM and electronic vibe.",
  source: "built-in",
  readOnly: true,
  components: [
    {
      id: "background-color-1",
      componentId: "background-color",
      enabled: true,
      modifiers: [],
      options: {
        mode: "solid",
        color: "#050510",
        opacity: 100
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
        graphMode: "line",
        lineStyle: "area",
        lineBaseline: "bottom",
        opacity: 25,
        primaryColor: "#00ffaa",
        secondaryColor: "#00aa88",
        glowEnabled: true,
        glowColor: "#00ffaa",
        glowStrength: 40
      }
    },
    {
      id: "lyrics-by-line-1",
      componentId: "lyrics-by-line",
      enabled: true,
      modifiers: [],
      options: {
        lyricColor: "#00ffcc",
        lyricPosition: "middle",
        borderEnabled: true,
        borderColor: "#003322",
        borderThickness: 2,
        shadowEnabled: true,
        shadowColor: "#00ffaa",
        shadowIntensity: 90
      }
    }
  ]
};
