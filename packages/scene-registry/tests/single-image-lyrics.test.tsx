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

    const getUrl = vi.fn(() => "file:///background.png");

    render(
      singleImageLyricsScene.Component({
        frame: 45,
        timeMs: 1500,
        options: {
          backgroundImage: "cover.png",
          lyricSize: 64,
          lyricFont: "Montserrat",
          lyricColor: "#ffffff",
          fadeInEnabled: true,
          fadeInDurationMs: 180,
          fadeInEasing: "ease-out",
          fadeOutEnabled: true,
          fadeOutDurationMs: 180,
          fadeOutEasing: "ease-in",
          lyricPosition: "bottom",
          borderEnabled: false,
          borderColor: "#000000",
          borderThickness: 4,
          shadowEnabled: true,
          shadowColor: "#000000",
          shadowIntensity: 55
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
          getUrl
        },
        prepared: {}
      })
    );

    expect(screen.getByText("Second line")).toBeInTheDocument();
    expect(getUrl).toHaveBeenCalledWith("backgroundImage");
  });

  it("applies fade timing, position, border, and shadow options to the lyric text", () => {
    const lyrics = createLyricRuntime(
      [
        {
          index: 1,
          startMs: 1000,
          endMs: 2000,
          text: "Styled line",
          lines: ["Styled line"]
        }
      ],
      1050
    );

    render(
      singleImageLyricsScene.Component({
        frame: 31,
        timeMs: 1050,
        options: {
          backgroundImage: "cover.png",
          lyricSize: 80,
          lyricFont: "Montserrat",
          lyricColor: "#ffffff",
          fadeInEnabled: true,
          fadeInDurationMs: 200,
          fadeInEasing: "linear",
          fadeOutEnabled: false,
          fadeOutDurationMs: 400,
          fadeOutEasing: "ease-in",
          lyricPosition: "top",
          borderEnabled: true,
          borderColor: "#33ccff",
          borderThickness: 5,
          shadowEnabled: true,
          shadowColor: "#ff0000",
          shadowIntensity: 60
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
          getUrl: vi.fn(() => "file:///background.png")
        },
        prepared: {}
      })
    );

    const lyricText = screen.getByText("Styled line");
    const lyricContainer = lyricText.parentElement;

    expect(lyricText).toHaveStyle({
      opacity: "0.25"
    });
    expect((lyricText as HTMLElement).style.webkitTextStroke).toBe("5px #33ccff");
    expect((lyricText as HTMLElement).style.textShadow).toBe(
      "0 4px 12px rgba(255, 0, 0, 0.6), 0 0 1px rgba(255, 0, 0, 0.8), 0 0 14px rgba(255, 0, 0, 0.27)"
    );
    expect(lyricContainer).toHaveStyle({
      alignItems: "flex-start",
      padding: "110px 140px 0"
    });
  });
});
