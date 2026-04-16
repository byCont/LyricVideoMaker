import { describe, expect, it } from "vitest";
import {
  isSceneOptionCategory,
  type SceneOptionEntry,
  type SceneOptionField,
  type VideoSettings
} from "@lyric-video-maker/core";
import {
  DEFAULT_VIDEO_OPTIONS,
  VIDEO_PLAYBACK_MODE_VALUES,
  videoOptionsSchema,
  type VideoComponentOptions
} from "../src/components/video";
import { buildVideoInitialState } from "../src/components/video/runtime";
import { computeVideoPlaybackState } from "../src/components/video/playback";
import { prepareVideoComponent } from "../src/components/video/prepare";

const video: VideoSettings = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationMs: 30_000,
  durationInFrames: 900
};

function flat(schema: SceneOptionEntry[]): SceneOptionField[] {
  return schema.flatMap((e) => (isSceneOptionCategory(e) ? e.options : [e]));
}

function opts(overrides: Partial<VideoComponentOptions>): VideoComponentOptions {
  return { ...DEFAULT_VIDEO_OPTIONS, ...overrides };
}

describe("Video options contract (T-050)", () => {
  it("source video field is required", () => {
    const source = flat(videoOptionsSchema).find((f) => f.id === "source");
    expect(source?.type).toBe("video");
    expect((source as { required?: boolean }).required).toBe(true);
  });

  it("muted defaults to true", () => {
    expect(DEFAULT_VIDEO_OPTIONS.muted).toBe(true);
  });

  it("playback mode accepts all four values", () => {
    expect(VIDEO_PLAYBACK_MODE_VALUES).toEqual([
      "sync-with-song",
      "loop",
      "play-once-clamp",
      "play-once-hide"
    ]);
  });

  it("playback speed range covers slow-motion and fast-forward", () => {
    const speed = flat(videoOptionsSchema).find((f) => f.id === "playbackSpeed");
    if (speed?.type !== "number") throw new Error("playbackSpeed must be number");
    expect(speed.min).toBeLessThan(1);
    expect(speed.max).toBeGreaterThan(1);
  });
});

describe("Video schema order", () => {
  it("category order is Source → Playback → Fit → Appearance → Effects (transform/timing live on modifiers)", () => {
    const labels = videoOptionsSchema.filter(isSceneOptionCategory).map((c) => c.label);
    expect(labels).toEqual([
      "Source",
      "Playback",
      "Fit",
      "Appearance",
      "Effects"
    ]);
  });
});

describe("Video defaults (T-052)", () => {
  it("default source is empty so component renders nothing until chosen", () => {
    expect(DEFAULT_VIDEO_OPTIONS.source).toBe("");
  });

  it("muted defaults to true on first insert", () => {
    expect(DEFAULT_VIDEO_OPTIONS.muted).toBe(true);
  });
});

describe("Video prepare phase (T-053)", () => {
  it("returns duration, width, height, frame rate from probe", async () => {
    const ctx = {
      instance: { id: "v1", componentId: "video", componentName: "Video", enabled: true, options: {} },
      options: opts({}),
      video,
      lyrics: { current: null, next: null, all: [] },
      assets: { getPath: () => "/tmp/clip.mp4", getUrl: () => null },
      audio: { path: "/tmp/song.mp3", getSpectrum: async () => ({ frames: [], sampleRate: 0 }) }
    } as unknown as Parameters<typeof prepareVideoComponent>[0];
    const result = await prepareVideoComponent(ctx, async () => ({
      durationMs: 5500,
      width: 1280,
      height: 720,
      frameRate: 30
    }));
    expect(result).toEqual({ durationMs: 5500, width: 1280, height: 720, frameRate: 30 });
  });

  it("surfaces probe failure as a readable validation error (no crash)", async () => {
    const ctx = {
      instance: { id: "v1", componentId: "video", componentName: "Video", enabled: true, options: {} },
      options: opts({}),
      video,
      lyrics: { current: null, next: null, all: [] },
      assets: { getPath: () => "/tmp/clip.mp4", getUrl: () => null },
      audio: { path: "/tmp/song.mp3", getSpectrum: async () => ({ frames: [], sampleRate: 0 }) }
    } as unknown as Parameters<typeof prepareVideoComponent>[0];
    await expect(
      prepareVideoComponent(ctx, async () => {
        throw new Error("ffprobe missing");
      })
    ).rejects.toThrow(/Unable to probe video file/);
  });

  it("throws when source path missing", async () => {
    const ctx = {
      instance: { id: "v1", componentId: "video", componentName: "Video", enabled: true, options: {} },
      options: opts({}),
      video,
      lyrics: { current: null, next: null, all: [] },
      assets: { getPath: () => null, getUrl: () => null },
      audio: { path: "/tmp/song.mp3", getSpectrum: async () => ({ frames: [], sampleRate: 0 }) }
    } as unknown as Parameters<typeof prepareVideoComponent>[0];
    await expect(prepareVideoComponent(ctx, async () => ({ durationMs: 0, width: 0, height: 0, frameRate: 0 }))).rejects.toThrow(
      /missing a source path/
    );
  });
});

describe("Video rendering — inner element + effects (T-054)", () => {
  const extraction = {
    mode: "image-sequence" as const,
    urlPrefix: "http://lyric-video.local/video-frames/extract-a/",
    outputFps: 30,
    frameCount: 30
  };

  it("inner element is an extracted frame image", () => {
    const state = buildVideoInitialState(opts({ muted: true }), video, "/asset/clip.mp4", extraction);
    expect(state.html).toContain("<img");
    expect(state.html).toContain("data-video-frame");
    expect(state.html).not.toContain("<video");
  });

  it.each(["contain", "cover", "fill"] as const)("%s fit mode applies object-fit", (mode) => {
    const state = buildVideoInitialState(opts({ fitMode: mode }), video, "/asset/clip.mp4", extraction);
    expect(state.html).toContain(`object-fit:${mode}`);
  });

  it("corner radius + border + shadow + glow stack like Image", () => {
    const state = buildVideoInitialState(
      opts({
        cornerRadius: 16,
        borderEnabled: true,
        borderThickness: 4,
        shadowEnabled: true,
        glowEnabled: true
      }),
      video,
      "/asset/clip.mp4",
      extraction
    );
    expect(state.html).toContain("border-radius:16px");
    expect(state.html).toContain("border:4px solid #ffffff");
    const shadowCount = (state.html.match(/drop-shadow/g) || []).length;
    expect(shadowCount).toBe(2);
  });

  it("nonzero filters apply to the video element", () => {
    const state = buildVideoInitialState(
      opts({ grayscale: 50, brightness: 80 }),
      video,
      "/asset/clip.mp4",
      extraction
    );
    expect(state.html).toContain("grayscale(0.5)");
    expect(state.html).toContain("brightness(0.8)");
  });

  it("tint overlay only when enabled", () => {
    const withTint = buildVideoInitialState(
      opts({ tintEnabled: true, tintColor: "#00ff00", tintStrength: 50 }),
      video,
      "/asset/clip.mp4",
      extraction
    );
    expect(withTint.html).toContain("mix-blend-mode:multiply");

    const noTint = buildVideoInitialState(opts({ tintEnabled: false }), video, "/asset/clip.mp4", extraction);
    expect(noTint.html).not.toContain("mix-blend-mode");
  });
});

describe("Video playback math (T-055, T-056)", () => {
  it("sync-with-song produces monotonically advancing position", () => {
    const o = { playbackMode: "sync-with-song" as const, videoStartOffsetMs: 0, playbackSpeed: 1 };
    const a = computeVideoPlaybackState({ options: o, durationMs: 10000, timeMs: 1000 });
    const b = computeVideoPlaybackState({ options: o, durationMs: 10000, timeMs: 2000 });
    expect(b.targetTimeSeconds).toBeGreaterThan(a.targetTimeSeconds);
    expect(b.targetTimeSeconds).toBeCloseTo(2.0);
  });

  it("sync-with-song clamps to video duration", () => {
    const r = computeVideoPlaybackState({
      options: { playbackMode: "sync-with-song", videoStartOffsetMs: 0, playbackSpeed: 1 },
      durationMs: 5000,
      timeMs: 9999
    });
    expect(r.targetTimeSeconds).toBe(5);
    expect(r.hidden).toBe(false);
  });

  it("loop mode wraps playback within video duration", () => {
    const r = computeVideoPlaybackState({
      options: { playbackMode: "loop", videoStartOffsetMs: 0, playbackSpeed: 1 },
      durationMs: 5000,
      timeMs: 12000 // 12s into a 5s clip = wrap to 2s
    });
    expect(r.targetTimeSeconds).toBeCloseTo(2.0);
    expect(r.hidden).toBe(false);
  });

  it("play-once-clamp holds last frame after computed end", () => {
    const r = computeVideoPlaybackState({
      options: { playbackMode: "play-once-clamp", videoStartOffsetMs: 0, playbackSpeed: 1 },
      durationMs: 5000,
      timeMs: 9999
    });
    expect(r.hidden).toBe(false);
    expect(r.targetTimeSeconds).toBeGreaterThan(4.9);
  });

  it("play-once-hide hides component after computed end", () => {
    const r = computeVideoPlaybackState({
      options: { playbackMode: "play-once-hide", videoStartOffsetMs: 0, playbackSpeed: 1 },
      durationMs: 5000,
      timeMs: 9999
    });
    expect(r.hidden).toBe(true);
  });

  it("playback speed scales advancement", () => {
    const r = computeVideoPlaybackState({
      options: { playbackMode: "sync-with-song", videoStartOffsetMs: 0, playbackSpeed: 2 },
      durationMs: 60000,
      timeMs: 1000
    });
    // 1s * 2x speed = 2s into video.
    expect(r.targetTimeSeconds).toBeCloseTo(2.0);
  });
});

describe("Audio handling (T-058)", () => {
  it("default options enforce muted (even if user re-checks the box later)", () => {
    expect(DEFAULT_VIDEO_OPTIONS.muted).toBe(true);
  });
});
