import type { SceneDefinition } from "@lyric-video-maker/core";
import { DEFAULT_TRANSFORM_OPTIONS } from "@lyric-video-maker/plugin-base";

export const audioBarsScene: SceneDefinition = {
  id: "audio-bars",
  name: "Audio Bars",
  description:
    "Dark background with equalizer bars filling the bottom and lyrics floating above. Shows off audio reactivity.",
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
        color: "#070b14",
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
            y: 55,
            height: 45
          }
        }
      ],
      options: {}
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
            height: 55
          }
        }
      ],
      options: {
        lyricPosition: "middle"
      }
    }
  ]
};
