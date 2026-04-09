/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { createLyricRuntime } from "@lyric-video-maker/core";
import { singleImageLyricsScene } from "../src/single-image-lyrics";

describe("singleImageLyricsScene", () => {
  it("renders the current lyric for a given timestamp", () => {
    const lyrics = createLyricRuntime(
      [
        {
          index: 1,
          startMs: 0,
          endMs: 1000,
          text: "First line",
          lines: ["First line"]
        },
        {
          index: 2,
          startMs: 1200,
          endMs: 2000,
          text: "Second line",
          lines: ["Second line"]
        }
      ],
      1500
    );

    render(
      singleImageLyricsScene.Component({
        frame: 45,
        timeMs: 1500,
        options: {
          backgroundImage: "cover.png",
          lyricSize: 64,
          lyricFont: "Montserrat",
          lyricColor: "#ffffff"
        },
        video: {
          width: 1920,
          height: 1080,
          fps: 30,
          durationMs: 2000,
          durationInFrames: 60
        },
        lyrics,
        assets: {
          getUrl: () => null
        },
        prepared: {
          backgroundImageUrl: "data:image/png;base64,abc"
        }
      })
    );

    expect(screen.getByText("Second line")).toBeInTheDocument();
  });
});
