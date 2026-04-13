import { describe, expect, it } from "vitest";

import { equalizerComponent } from "../src/components";

describe("component caching", () => {
  it("keeps the equalizer prepare cache key stable for cosmetic-only option changes", () => {
    const baseOptions = equalizerComponent.defaultOptions;
    const cacheKey = equalizerComponent.getPrepareCacheKey?.({
      instance: {
        id: "equalizer-1",
        componentId: equalizerComponent.id,
        componentName: equalizerComponent.name,
        enabled: true,
        options: baseOptions
      },
      options: baseOptions,
      video: {
        width: 1920,
        height: 1080,
        fps: 30,
        durationMs: 1000,
        durationInFrames: 30
      },
      audioPath: "song.mp3"
    });
    const cosmeticOptions = {
      ...baseOptions,
      graphMode: "line" as const,
      lineStyle: "area" as const,
      primaryColor: "#ff00ff",
      secondaryColor: "#00ff00",
      glowStrength: 15,
      placement: "top-center" as const
    };
    const cosmeticKey = equalizerComponent.getPrepareCacheKey?.({
      instance: {
        id: "equalizer-1",
        componentId: equalizerComponent.id,
        componentName: equalizerComponent.name,
        enabled: true,
        options: cosmeticOptions
      },
      options: cosmeticOptions,
      video: {
        width: 1920,
        height: 1080,
        fps: 30,
        durationMs: 1000,
        durationInFrames: 30
      },
      audioPath: "song.mp3"
    });

    expect(cacheKey).toBe(cosmeticKey);
  });
});
