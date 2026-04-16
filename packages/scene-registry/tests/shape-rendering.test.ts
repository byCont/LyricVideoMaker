import { describe, expect, it } from "vitest";
import { DEFAULT_SHAPE_OPTIONS, SHAPE_TYPE_VALUES, type ShapeComponentOptions } from "../src/components/shape";
import { buildShapeInitialState } from "../src/components/shape/runtime";

function shape(overrides: Partial<ShapeComponentOptions>): ShapeComponentOptions {
  return { ...DEFAULT_SHAPE_OPTIONS, ...overrides };
}

describe("Shape rendering — all six shape types", () => {
  it.each(SHAPE_TYPE_VALUES)(
    "%s shape type produces an inner markup fragment",
    (shapeType) => {
      const state = buildShapeInitialState(shape({ shapeType }));
      expect(state.html.length).toBeGreaterThan(0);
    }
  );

  it("rectangle renders as a styled box with zero radius", () => {
    const state = buildShapeInitialState(shape({ shapeType: "rectangle" }));
    expect(state.html).toContain("border-radius:0");
    expect(state.html).toContain('data-shape="rectangle"');
  });

  it("circle renders with 50% border-radius", () => {
    const state = buildShapeInitialState(shape({ shapeType: "circle" }));
    expect(state.html).toContain("border-radius:50%");
  });

  it("ellipse renders with 50% border-radius", () => {
    const state = buildShapeInitialState(shape({ shapeType: "ellipse" }));
    expect(state.html).toContain("border-radius:50%");
  });

  it("line renders as a thin horizontal bar", () => {
    const state = buildShapeInitialState(
      shape({ shapeType: "line", lineThickness: 8 })
    );
    expect(state.html).toContain('data-shape="line"');
    expect(state.html).toContain("height:8px");
  });

  it("triangle renders as SVG polygon with 3 points", () => {
    const state = buildShapeInitialState(shape({ shapeType: "triangle" }));
    expect(state.html).toContain("<svg");
    expect(state.html).toContain("<polygon");
    const pointsMatch = /points="([^"]*)"/.exec(state.html);
    expect(pointsMatch).not.toBeNull();
    expect(pointsMatch![1].split(/\s+/).filter(Boolean)).toHaveLength(3);
  });

  it("polygon renders correctly across the full supported side range (3..12)", () => {
    for (let sides = 3; sides <= 12; sides += 1) {
      const state = buildShapeInitialState(
        shape({ shapeType: "polygon", polygonSides: sides })
      );
      const pointsMatch = /points="([^"]*)"/.exec(state.html);
      expect(pointsMatch).not.toBeNull();
      expect(pointsMatch![1].split(/\s+/).filter(Boolean)).toHaveLength(sides);
    }
  });
});

describe("Shape rendering — fill + stroke + effects", () => {
  it("gradient fill is visibly distinguishable from solid fill (different background CSS)", () => {
    const solid = buildShapeInitialState(
      shape({ shapeType: "rectangle", fillMode: "solid" })
    );
    const gradient = buildShapeInitialState(
      shape({ shapeType: "rectangle", fillMode: "gradient" })
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
      })
    );
    expect(withStroke.html).toContain("border:8px solid");

    const noStroke = buildShapeInitialState(
      shape({ shapeType: "rectangle", strokeEnabled: false })
    );
    expect(noStroke.html).toContain("border:none");
  });

  it("shadow, glow, and blur compose on a single instance without suppressing each other", () => {
    const state = buildShapeInitialState(
      shape({
        shadowEnabled: true,
        glowEnabled: true,
        blur: 3
      })
    );
    expect(state.containerStyle.filter).toContain("drop-shadow");
    const shadowCount = (state.containerStyle.filter.match(/drop-shadow/g) || []).length;
    expect(shadowCount).toBe(2);
    expect(state.containerStyle.filter).toContain("blur(3px)");
  });

  it("no effects → filter is 'none'", () => {
    const state = buildShapeInitialState(shape({}));
    expect(state.containerStyle.filter).toBe("none");
  });
});

describe("Shape rendering — container", () => {
  it("container fills its wrapper", () => {
    const state = buildShapeInitialState(shape({}));
    expect(state.containerStyle).toMatchObject({
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%"
    });
  });
});
