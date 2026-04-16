import type { SceneDefinition } from "@lyric-video-maker/core";

export const cinematicScene: SceneDefinition = {
  id: "cinematic",
  name: "Cinematic",
  description:
    "Video background with a dark vignette overlay, bottom lyrics with text border, and a timed title card that fades during the intro.",
  source: "built-in",
  readOnly: true,
  components: [
    {
      id: "video-1",
      componentId: "video",
      enabled: true,
      modifiers: [],
      options: {
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
        topOpacity: 20,
        bottomColor: "#000000",
        bottomOpacity: 80
      }
    },
    {
      id: "static-text-1",
      componentId: "static-text",
      enabled: true,
      modifiers: [
        {
          id: "static-text-1-timing",
          modifierId: "timing",
          enabled: true,
          options: {
            startTime: 0,
            endTime: 8000,
            fadeInDuration: 1500,
            fadeOutDuration: 1500,
            easing: "ease-in-out"
          }
        }
      ],
      options: {
        text: "Song Title\nArtist Name",
        fontSize: 48,
        fontWeight: 300,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.6
      }
    },
    {
      id: "lyrics-by-line-1",
      componentId: "lyrics-by-line",
      enabled: true,
      modifiers: [],
      options: {
        lyricPosition: "bottom",
        lyricSize: 56,
        horizontalPadding: 100,
        borderEnabled: true,
        borderColor: "#000000",
        borderThickness: 4,
        shadowEnabled: true,
        shadowIntensity: 70
      }
    }
  ]
};
