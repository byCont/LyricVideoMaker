import { describe, expect, it } from "vitest";
import type { VideoSettings } from "@lyric-video-maker/core";
import {
  DEFAULT_IMAGE_OPTIONS,
  type ImageComponentOptions
} from "../src/components/image";
import { buildImageInitialState } from "../src/components/image/runtime";

const video: VideoSettings = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationMs: 5000,
  durationInFrames: 150
};

function opts(overrides: Partial<ImageComponentOptions>): ImageComponentOptions {
  return { ...DEFAULT_IMAGE_OPTIONS, ...overrides };
}

describe("Image rendering — fit modes (T-038)", () => {
  it.each(["contain", "cover", "fill", "none"] as const)(
    "%s fit mode sets object-fit on the inner image",
    (mode) => {
      const state = buildImageInitialState(opts({ fitMode: mode }), video, 0, "/asset/pic.png");
      expect(state.html).toContain(`object-fit:${mode}`);
    }
  );

  it("corner radius is visibly applied and clips the image (overflow:hidden + border-radius)", () => {
    const state = buildImageInitialState(opts({ cornerRadius: 32 }), video, 0, "/asset/pic.png");
    expect(state.containerStyle.borderRadius).toBe("32px");
    expect(state.containerStyle.overflow).toBe("hidden");
  });
});

describe("Image rendering — filters (T-038)", () => {
  it("nonzero filters appear on the img element", () => {
    const state = buildImageInitialState(
      opts({ grayscale: 50, blur: 3, brightness: 80, contrast: 120, saturation: 150 }),
      video,
      0,
      "/asset/pic.png"
    );
    expect(state.html).toContain("grayscale(0.5)");
    expect(state.html).toContain("blur(3px)");
    expect(state.html).toContain("brightness(0.8)");
    expect(state.html).toContain("contrast(1.2)");
    expect(state.html).toContain("saturate(1.5)");
  });

  it("default filter values emit no filter string", () => {
    const state = buildImageInitialState(opts({}), video, 0, "/asset/pic.png");
    expect(state.html).not.toContain("filter:");
  });
});

describe("Image rendering — border + shadow + glow + tint (T-039)", () => {
  it("border renders only when enabled", () => {
    const withBorder = buildImageInitialState(
      opts({ borderEnabled: true, borderThickness: 4, borderColor: "#ff0000" }),
      video,
      0,
      "/asset/pic.png"
    );
    expect(withBorder.containerStyle.border).toBe("4px solid #ff0000");

    const noBorder = buildImageInitialState(opts({ borderEnabled: false }), video, 0, "/asset/pic.png");
    expect(noBorder.containerStyle.border).toBeUndefined();
  });

  it("tint overlay appears only when enabled", () => {
    const withTint = buildImageInitialState(
      opts({ tintEnabled: true, tintColor: "#00ff00", tintStrength: 50 }),
      video,
      0,
      "/asset/pic.png"
    );
    expect(withTint.html).toContain("mix-blend-mode:multiply");
    expect(withTint.html).toContain("rgba(0, 255, 0, 0.5)");

    const noTint = buildImageInitialState(opts({ tintEnabled: false }), video, 0, "/asset/pic.png");
    expect(noTint.html).not.toContain("mix-blend-mode");
  });

  it("shadow + glow compose on a single instance without suppressing each other", () => {
    const state = buildImageInitialState(
      opts({ shadowEnabled: true, glowEnabled: true }),
      video,
      0,
      "/asset/pic.png"
    );
    expect(state.containerStyle.filter).toBeDefined();
    const count = (state.containerStyle.filter!.match(/drop-shadow/g) || []).length;
    expect(count).toBe(2);
  });
});

describe("Image rendering — no source (T-037)", () => {
  it("renders nothing when url is null", () => {
    const state = buildImageInitialState(opts({}), video, 0, null);
    expect(state.html).toBe("");
    expect(state.sourceUrl).toBeNull();
  });

  it("default source is empty string", () => {
    expect(DEFAULT_IMAGE_OPTIONS.source).toBe("");
  });
});

describe("Image rendering — per-frame opacity (T-041)", () => {
  it("per-frame opacity = option opacity * shared Timing helper result", () => {
    const state = buildImageInitialState(opts({ opacity: 50 }), video, 0, "/asset/pic.png");
    // At t=0 with default timing (always visible, linear easing) the
    // timing helper returns 1, so opacity = 50/100 * 1 = 0.5.
    expect(state.initialOpacity).toBeCloseTo(0.5);
  });

  it("per-frame opacity becomes 0 before start time", () => {
    const state = buildImageInitialState(
      opts({ opacity: 100, startTime: 1000, endTime: 0 }),
      video,
      500,
      "/asset/pic.png"
    );
    expect(state.initialOpacity).toBe(0);
  });
});
