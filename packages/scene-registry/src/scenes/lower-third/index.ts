import type { SceneDefinition } from "@lyric-video-maker/core";
import { DEFAULT_TRANSFORM_OPTIONS } from "@lyric-video-maker/plugin-base";

export const lowerThirdScene: SceneDefinition = {
  id: "lower-third",
  name: "Lower Third",
  description:
    "Professional broadcast style with a semi-transparent bar at the bottom for lyrics and an artist credit at the top.",
  source: "built-in",
  readOnly: true,
  components: [
    {
      id: "background-image-1",
      componentId: "image",
      enabled: true,
      modifiers: [],
      options: {}
    },
    {
      id: "bar-1",
      componentId: "shape",
      enabled: true,
      modifiers: [
        {
          id: "bar-1-transform",
          modifierId: "transform",
          enabled: true,
          options: {
            ...DEFAULT_TRANSFORM_OPTIONS,
            y: 78,
            height: 22
          }
        }
      ],
      options: {
        shapeType: "rectangle",
        fillColor: "#000000",
        fillOpacity: 75,
        strokeEnabled: false
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
            y: 78,
            height: 22
          }
        }
      ],
      options: {
        lyricPosition: "middle",
        lyricSize: 52,
        horizontalPadding: 80
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
            x: 3,
            y: 2,
            width: 50,
            height: 8
          }
        }
      ],
      options: {
        text: "Artist Name",
        fontSize: 24,
        fontWeight: 400,
        color: "#ffffff",
        textAlign: "left"
      }
    }
  ]
};
