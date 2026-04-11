import { describe, expect, it } from "vitest";
import type { VideoSettings } from "@lyric-video-maker/core";
import { DEFAULT_SHAPE_OPTIONS, SHAPE_TYPE_VALUES, type ShapeComponentOptions } from "../src/components/shape";
import { buildShapeInitialState } from "../src/components/shape/runtime";

const video: VideoSettings = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationMs: 5000,
  durationInFrames: 150
};

function shape(overrides: Partial<ShapeComponentOptions>): ShapeComponentOptions {
  return { ...DEFAULT_SHAPE_OPTIONS, ...overrides };
}

describe("Shape rendering — all six shape types (T-021, T-022)", () => {
  it.each(SHAPE_TYPE_VALUES)(
    "%s shape type produces an inner markup fragment",
    (shapeType) => {
      const state = buildShapeInitialState(shape({ shapeType }), video, 0);
      expect(state.html.length).toBeGreaterThan(0);
    }
  );

  it("rectangle renders as a styled box with zero radius", () => {
    const state = buildShapeInitialState(shape({ shapeType: "rectangle" }), video, 0);
    expect(state.html).toContain("border-radius:0");
    expect(state.html).toContain('data-shape="rectangle"');
  });

  it("circle renders with 50% border-radius", () => {
    const state = buildShapeInitialState(shape({ shapeType: "circle" }), video, 0);
    expect(state.html).toContain("border-radius:50%");
  });

  it("ellipse renders with 50% border-radius", () => {
    const state = buildShapeInitialState(shape({ shapeType: "ellipse" }), video, 0);
    expect(state.html).toContain("border-radius:50%");
  });

  it("line renders as a thin horizontal bar", () => {
    const state = buildShapeInitialState(
      shape({ shapeType: "line", lineThickness: 8 }),
      video,
      0
    );
    expect(state.html).toContain('data-shape="line"');
    expect(state.html).toContain("height:8px");
  });

  it("triangle renders as SVG polygon with 3 points", () => {
    const state = buildShapeInitialState(shape({ shapeType: "triangle" }), video, 0);
    expect(state.html).toContain("<svg");
    expect(state.html).toContain("<polygon");
    // Three points means three "x,y " pairs.
    const pointsMatch = /points="([^"]*)"/.exec(state.html);
    expect(pointsMatch).not.toBeNull();
    expect(pointsMatch![1].split(/\s+/).filter(Boolean)).toHaveLength(3);
  });

  it("polygon renders correctly across the full supported side range (3..12)", () => {
    for (let sides = 3; sides <= 12; sides += 1) {
      const state = buildShapeInitialState(
        shape({ shapeType: "polygon", polygonSides: sides }),
        video,
        0
      );
      const pointsMatch = /points="([^"]*)"/.exec(state.html);
      expect(pointsMatch).not.toBeNull();
      expect(pointsMatch![1].split(/\s+/).filter(Boolean)).toHaveLength(sides);
    }
  });
});

describe("Shape rendering — fill + stroke + effects (T-021, T-022)", () => {
  it("gradient fill is visibly distinguishable from solid fill (different background CSS)", () => {
    const solid = buildShapeInitialState(
      shape({ shapeType: "rectangle", fillMode: "solid" }),
      video,
      0
    );
    const gradient = buildShapeInitialState(
      shape({ shapeType: "rectangle", fillMode: "gradient" }),
      video,
      0
    );
    expect(solid.html).not.toEqual(gradient.html);
    expect(gradient.html).toContain("linear-gradient(");
  });

  it("stroke renders when enabled and is absent when disabled", () => {
    const withStroke = buildShapeInitialState(
      shape({
        shapeType: "rectangle",
        strokeEnabled: true,
        strokeWidth: 8,
        strokeColor: "#ff0000"
      }),
      video,
      0
    );
    expect(withStroke.html).toContain("border:8px solid");

    const noStroke = buildShapeInitialState(
      shape({ shapeType: "rectangle", strokeEnabled: false }),
      video,
      0
    );
    expect(noStroke.html).toContain("border:none");
  });

  it("shadow, glow, and blur compose on a single instance without suppressing each other", () => {
    const state = buildShapeInitialState(
      shape({
        shadowEnabled: true,
        glowEnabled: true,
        blur: 3
      }),
      video,
      0
    );
    expect(state.containerStyle.filter).toContain("drop-shadow");
    // Two drop-shadow calls (shadow + glow) plus blur.
    const shadowCount = (state.containerStyle.filter.match(/drop-shadow/g) || []).length;
    expect(shadowCount).toBe(2);
    expect(state.containerStyle.filter).toContain("blur(3px)");
  });

  it("no effects → filter is 'none'", () => {
    const state = buildShapeInitialState(shape({}), video, 0);
    expect(state.containerStyle.filter).toBe("none");
  });
});

describe("Shape rendering — per-frame opacity (T-023-SHAPE)", () => {
  it("initial opacity follows the shared Timing helper at mount time (t=0)", () => {
    const state = buildShapeInitialState(
      shape({ startTime: 0, endTime: 0, fadeInDuration: 0, fadeOutDuration: 0 }),
      video,
      0
    );
    expect(state.initialOpacity).toBe(1);
  });

  it("initial opacity is 0 before start time", () => {
    const state = buildShapeInitialState(
      shape({ startTime: 2000, endTime: 0 }),
      video,
      500
    );
    expect(state.initialOpacity).toBe(0);
  });
});

describe("Shape rendering — positioning via shared Transform", () => {
  it("container style uses computeTransformStyle output", () => {
    const state = buildShapeInitialState(
      shape({ x: 25, y: 75, width: 30, height: 40 }),
      video,
      0
    );
    expect(state.containerStyle.left).toBe("25%");
    expect(state.containerStyle.top).toBe("75%");
    expect(state.containerStyle.width).toBe("30%");
    expect(state.containerStyle.height).toBe("40%");
    expect(state.containerStyle.position).toBe("absolute");
  });
});
