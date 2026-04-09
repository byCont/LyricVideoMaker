import React from "react";
import type { SceneDefinition } from "@lyric-video-maker/core";
import { SUPPORTED_FONT_FAMILIES } from "@lyric-video-maker/core";

export interface SingleImageLyricsOptions {
  backgroundImage: string;
  lyricSize: number;
  lyricFont: string;
  lyricColor: string;
}

export const singleImageLyricsScene: SceneDefinition<SingleImageLyricsOptions> = {
  id: "single-image-lyrics",
  name: "Single Image Lyrics",
  description: "A full-song lyric video with one background image and bottom-safe lyrics.",
  staticWhenMarkupUnchanged: false,
  options: [
    { type: "image", id: "backgroundImage", label: "Background Image", required: true },
    { type: "number", id: "lyricSize", label: "Lyric Size", defaultValue: 72, min: 24, max: 180, step: 1 },
    { type: "font", id: "lyricFont", label: "Lyric Font", defaultValue: SUPPORTED_FONT_FAMILIES[0] },
    { type: "color", id: "lyricColor", label: "Lyric Color", defaultValue: "#FFFFFF" }
  ],
  defaultOptions: {
    backgroundImage: "",
    lyricSize: 72,
    lyricFont: SUPPORTED_FONT_FAMILIES[0],
    lyricColor: "#FFFFFF"
  },
  Component: ({ options, lyrics, assets, video }) => {
    const activeText = lyrics.current?.text ?? "";
    const backgroundImageUrl = assets.getUrl("backgroundImage");

    return (
      <div
        style={{
          position: "relative",
          width: video.width,
          height: video.height,
          overflow: "hidden",
          background: "#09090f",
          color: options.lyricColor,
          fontFamily: `"${options.lyricFont}", sans-serif`
        }}
      >
        {backgroundImageUrl ? (
          <img
            src={backgroundImageUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scale(1.03)"
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(8, 8, 12, 0.18) 0%, rgba(8, 8, 12, 0.42) 58%, rgba(8, 8, 12, 0.78) 100%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "0 140px 110px",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              maxWidth: "100%",
              textAlign: "center",
              fontSize: options.lyricSize,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              textShadow:
                "0 6px 18px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.8), 0 0 24px rgba(0,0,0,0.2)",
              whiteSpace: "pre-wrap"
            }}
          >
            {activeText}
          </div>
        </div>
      </div>
    );
  }
};
