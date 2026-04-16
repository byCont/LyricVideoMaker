import { describe, expect, it } from "vitest";
import {
  isSceneOptionCategory,
  type SceneOptionEntry,
  type SceneOptionField
} from "@lyric-video-maker/core";
import {
  DEFAULT_SHAPE_OPTIONS,
  SHAPE_TYPE_VALUES,
  shapeComponent,
  shapeOptionsSchema
} from "../src/components/shape";
import {
  DEFAULT_STATIC_TEXT_OPTIONS,
  staticTextComponent,
  staticTextOptionsSchema
} from "../src/components/static-text";
import {
  DEFAULT_IMAGE_OPTIONS,
  imageComponent,
  imageOptionsSchema
} from "../src/components/image";

function categoryLabels(schema: SceneOptionEntry[]): string[] {
  return schema.filter(isSceneOptionCategory).map((c) => c.label);
}

function flat(schema: SceneOptionEntry[]): SceneOptionField[] {
  return schema.flatMap((e) => (e.type === "category" ? e.options : [e]));
}

describe("Shape options contract", () => {
  it("default shapeType produces a visible rectangle with solid fill", () => {
    expect(DEFAULT_SHAPE_OPTIONS.shapeType).toBe("rectangle");
    expect(DEFAULT_SHAPE_OPTIONS.fillEnabled).toBe(true);
    expect(DEFAULT_SHAPE_OPTIONS.fillMode).toBe("solid");
    expect(DEFAULT_SHAPE_OPTIONS.fillOpacity).toBeGreaterThan(0);
  });

  it("shape defaults expose no transform or timing fields", () => {
    expect(DEFAULT_SHAPE_OPTIONS).not.toHaveProperty("x");
    expect(DEFAULT_SHAPE_OPTIONS).not.toHaveProperty("startTime");
  });

  it("shapeType accepts exactly six values", () => {
    expect(SHAPE_TYPE_VALUES).toHaveLength(6);
    expect(SHAPE_TYPE_VALUES).toEqual([
      "rectangle",
      "circle",
      "ellipse",
      "triangle",
      "line",
      "polygon"
    ]);
  });

  it("polygonSides is bounded between 3 and 12", () => {
    const sides = flat(shapeOptionsSchema).find((f) => f.id === "polygonSides");
    if (sides?.type !== "number") throw new Error("polygonSides must be number");
    expect(sides.min).toBe(3);
    expect(sides.max).toBe(12);
  });

  it("schema category order is Geometry → Fill → Stroke → Effects (transform/timing live on modifiers)", () => {
    expect(categoryLabels(shapeOptionsSchema)).toEqual([
      "Geometry",
      "Fill",
      "Stroke",
      "Effects"
    ]);
  });

  it("schema no longer exposes transform or timing categories directly", () => {
    expect(shapeOptionsSchema.find((e) => e.type === "category" && e.id === "transform")).toBeUndefined();
    expect(shapeOptionsSchema.find((e) => e.type === "category" && e.id === "timing")).toBeUndefined();
  });

  it("Shape options contain no image or video fields", () => {
    const assetFields = flat(shapeOptionsSchema).filter(
      (f) => f.type === "image" || f.type === "video"
    );
    expect(assetFields).toEqual([]);
  });

  it("shapeComponent uses the schema and defaults", () => {
    expect(shapeComponent.options).toBe(shapeOptionsSchema);
    expect(shapeComponent.defaultOptions).toBe(DEFAULT_SHAPE_OPTIONS);
  });
});

describe("Static Text options contract", () => {
  it("defaults produce legible placeholder text", () => {
    expect(DEFAULT_STATIC_TEXT_OPTIONS.text.length).toBeGreaterThan(0);
    expect(DEFAULT_STATIC_TEXT_OPTIONS.fontSize).toBeGreaterThanOrEqual(12);
  });

  it("static text defaults expose no transform or timing fields", () => {
    expect(DEFAULT_STATIC_TEXT_OPTIONS).not.toHaveProperty("x");
    expect(DEFAULT_STATIC_TEXT_OPTIONS).not.toHaveProperty("startTime");
  });

  it("schema category order matches the new modifier-first layout", () => {
    expect(categoryLabels(staticTextOptionsSchema)).toEqual([
      "Content",
      "Typography",
      "Color",
      "Box",
      "Effects"
    ]);
  });

  it("Static Text options contain no image or video fields", () => {
    const assetFields = flat(staticTextOptionsSchema).filter(
      (f) => f.type === "image" || f.type === "video"
    );
    expect(assetFields).toEqual([]);
  });

  it("font field uses the supported-font list via type 'font'", () => {
    const fontField = flat(staticTextOptionsSchema).find((f) => f.id === "fontFamily");
    expect(fontField?.type).toBe("font");
  });

  it("font size and weight expose editor-friendly ranges", () => {
    const size = flat(staticTextOptionsSchema).find((f) => f.id === "fontSize");
    const weight = flat(staticTextOptionsSchema).find((f) => f.id === "fontWeight");
    if (size?.type !== "number" || weight?.type !== "number") {
      throw new Error("fontSize/fontWeight must be number fields");
    }
    expect(size.min).toBeGreaterThan(0);
    expect(size.max).toBeGreaterThan(size.min!);
    expect(weight.min).toBeGreaterThan(0);
    expect(weight.max).toBeGreaterThanOrEqual(900);
  });

  it("staticTextComponent uses the schema and defaults", () => {
    expect(staticTextComponent.options).toBe(staticTextOptionsSchema);
    expect(staticTextComponent.defaultOptions).toBe(DEFAULT_STATIC_TEXT_OPTIONS);
  });
});

describe("Image options contract", () => {
  it("image source is required", () => {
    const source = flat(imageOptionsSchema).find((f) => f.id === "source");
    expect(source?.type).toBe("image");
    expect((source as { required?: boolean }).required).toBe(true);
  });

  it("defaults produce no image path (renders nothing until chosen)", () => {
    expect(DEFAULT_IMAGE_OPTIONS.source).toBe("");
  });

  it("image defaults expose no transform, timing, or opacity fields", () => {
    expect(DEFAULT_IMAGE_OPTIONS).not.toHaveProperty("x");
    expect(DEFAULT_IMAGE_OPTIONS).not.toHaveProperty("startTime");
    expect(DEFAULT_IMAGE_OPTIONS).not.toHaveProperty("opacity");
  });

  it("schema category order is Source → Fit → Appearance → Effects (transform/timing live on modifiers)", () => {
    expect(categoryLabels(imageOptionsSchema)).toEqual([
      "Source",
      "Fit",
      "Appearance",
      "Effects"
    ]);
  });

  it("exposes all four fit modes", () => {
    const fit = flat(imageOptionsSchema).find((f) => f.id === "fitMode");
    if (fit?.type !== "select") throw new Error("fitMode must be select");
    expect(fit.options.map((o) => o.value).sort()).toEqual(
      ["contain", "cover", "fill", "none"].sort()
    );
  });

  it("exposes filter fields (grayscale, blur, brightness, contrast, saturation)", () => {
    const ids = flat(imageOptionsSchema).map((f) => f.id);
    for (const filter of ["grayscale", "blur", "brightness", "contrast", "saturation"]) {
      expect(ids).toContain(filter);
    }
  });

  it("imageComponent uses the schema and defaults", () => {
    expect(imageComponent.options).toBe(imageOptionsSchema);
    expect(imageComponent.defaultOptions).toBe(DEFAULT_IMAGE_OPTIONS);
  });
});
