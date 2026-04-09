/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { createLyricRuntime } from "@lyric-video-maker/core";
import {
  backgroundColorComponent,
  backgroundImageComponent,
  lyricsByLineComponent,
  singleImageLyricsScene
} from "../src/single-image-lyrics";

describe("scene registry components", () => {
  it("renders the background image component with the instance-scoped asset url", () => {
    const getUrl = vi.fn(() => "file:///background.png");

    render(
      backgroundImageComponent.Component({
        instance: {
          id: "bg-1",
          componentId: "background-image",
          componentName: "Background Image",
          enabled: true,
          options: {
            imagePath: "cover.png"
          }
        },
        options: {
          imagePath: "cover.png"
        },
        frame: 0,
        timeMs: 0,
        video: {
          width: 1920,
          height: 1080,
          fps: 30,
          durationMs: 2000,
          durationInFrames: 60
        },
        lyrics: createLyricRuntime([], 0),
        assets: {
          getUrl
        },
        prepared: {}
      })
    );

    expect(document.querySelector("img")).toHaveAttribute("src", "file:///background.png");
    expect(getUrl).toHaveBeenCalledWith("bg-1", "imagePath");
  });

  it("renders the background color gradient component", () => {
    render(
      backgroundColorComponent.Component({
        instance: {
          id: "color-1",
          componentId: "background-color",
          componentName: "Background Color",
          enabled: true,
          options: {}
        },
        options: {
          topColor: "#000000",
          topOpacity: 50,
          bottomColor: "#ffffff",
          bottomOpacity: 75
        },
        frame: 0,
        timeMs: 0,
        video: {
          width: 1920,
          height: 1080,
          fps: 30,
          durationMs: 2000,
          durationInFrames: 60
        },
        lyrics: createLyricRuntime([], 0),
        assets: {
          getUrl: vi.fn()
        },
        prepared: {}
      })
    );

    const gradient = document.querySelector('[style*="linear-gradient"]');
    expect(gradient).toHaveStyle({
      position: "absolute",
      inset: "0"
    });
    expect((gradient as HTMLElement).style.background).toContain("linear-gradient");
  });

  it("renders the lyrics component with fade timing, position, border, and shadow", () => {
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
      lyricsByLineComponent.Component({
        instance: {
          id: "lyrics-1",
          componentId: "lyrics-by-line",
          componentName: "Lyrics by Line",
          enabled: true,
          options: {}
        },
        options: {
          lyricSize: 80,
          lyricFont: "Montserrat",
          lyricColor: "#ffffff",
          fadeInDurationMs: 200,
          fadeInEasing: "linear",
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
        frame: 31,
        timeMs: 1050,
        video: {
          width: 1920,
          height: 1080,
          fps: 30,
          durationMs: 2000,
          durationInFrames: 60
        },
        lyrics,
        assets: {
          getUrl: vi.fn()
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

  it("defines the preset scene as stacked components in the expected order", () => {
    expect(singleImageLyricsScene.components).toEqual([
      {
        id: "background-image-1",
        componentId: "background-image",
        enabled: true,
        options: {}
      },
      {
        id: "background-color-1",
        componentId: "background-color",
        enabled: false,
        options: {}
      },
      {
        id: "lyrics-by-line-1",
        componentId: "lyrics-by-line",
        enabled: true,
        options: {}
      }
    ]);
  });
});
