import { describe, expect, it } from "vitest";
import {
  DEFAULT_IMAGE_OPTIONS,
  type ImageComponentOptions
} from "../src/components/image";
import { buildImageInitialState } from "../src/components/image/runtime";

function opts(overrides: Partial<ImageComponentOptions>): ImageComponentOptions {
  return { ...DEFAULT_IMAGE_OPTIONS, ...overrides };
}

describe("Image rendering — fit modes", () => {
  it.each(["contain", "cover", "fill", "none"] as const)(
    "%s fit mode sets object-fit on the inner image",
    (mode) => {
      const state = buildImageInitialState(opts({ fitMode: mode }), "/asset/pic.png");
      expect(state.html).toContain(`object-fit:${mode}`);
    }
  );

  it("corner radius is applied to the inner image element", () => {
    const state = buildImageInitialState(opts({ cornerRadius: 32 }), "/asset/pic.png");
    expect(state.html).toContain("border-radius:32px");
  });
});

describe("Image rendering — filters", () => {
  it("nonzero filters appear on the img element", () => {
    const state = buildImageInitialState(
      opts({ grayscale: 50, blur: 3, brightness: 80, contrast: 120, saturation: 150 }),
      "/asset/pic.png"
    );
    expect(state.html).toContain("grayscale(0.5)");
    expect(state.html).toContain("blur(3px)");
    expect(state.html).toContain("brightness(0.8)");
    expect(state.html).toContain("contrast(1.2)");
    expect(state.html).toContain("saturate(1.5)");
  });

  it("default filter values emit no filter string", () => {
    const state = buildImageInitialState(opts({}), "/asset/pic.png");
    expect(state.html).not.toContain("filter:");
  });
});

describe("Image rendering — border + shadow + glow + tint", () => {
  it("border renders only when enabled", () => {
    const withBorder = buildImageInitialState(
      opts({ borderEnabled: true, borderThickness: 4, borderColor: "#ff0000" }),
      "/asset/pic.png"
    );
    expect(withBorder.html).toContain("border:4px solid #ff0000");

    const noBorder = buildImageInitialState(opts({ borderEnabled: false }), "/asset/pic.png");
    expect(noBorder.html).not.toContain("border:");
  });

  it("tint overlay appears only when enabled", () => {
    const withTint = buildImageInitialState(
      opts({ tintEnabled: true, tintColor: "#00ff00", tintStrength: 50 }),
      "/asset/pic.png"
    );
    expect(withTint.html).toContain("mix-blend-mode:multiply");
    expect(withTint.html).toContain("rgba(0, 255, 0, 0.5)");

    const noTint = buildImageInitialState(opts({ tintEnabled: false }), "/asset/pic.png");
    expect(noTint.html).not.toContain("mix-blend-mode");
  });

  it("shadow + glow compose on a single instance without suppressing each other", () => {
    const state = buildImageInitialState(
      opts({ shadowEnabled: true, glowEnabled: true }),
      "/asset/pic.png"
    );
    const count = (state.html.match(/drop-shadow/g) || []).length;
    expect(count).toBe(2);
  });
});

describe("Image rendering — no source", () => {
  it("renders nothing when url is null", () => {
    const state = buildImageInitialState(opts({}), null);
    expect(state.html).toBe("");
    expect(state.sourceUrl).toBeNull();
  });

  it("default source is empty string", () => {
    expect(DEFAULT_IMAGE_OPTIONS.source).toBe("");
  });
});

describe("Image rendering — container", () => {
  it("container style fills its wrapper", () => {
    const state = buildImageInitialState(opts({}), "/asset/pic.png");
    expect(state.containerStyle).toMatchObject({
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%"
    });
  });
});
