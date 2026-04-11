import { describe, expect, it } from "vitest";
import {
  isSceneOptionCategory,
  type SceneOptionEntry,
  type SceneOptionField
} from "@lyric-video-maker/core";
import { DEFAULT_TIMING_OPTIONS, DEFAULT_TRANSFORM_OPTIONS } from "../src/shared";
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

describe("Shape options contract (T-018, T-019, T-020, T-024 defaults/ordering)", () => {
  it("defaults spread shared Transform + Timing", () => {
    for (const key of Object.keys(DEFAULT_TRANSFORM_OPTIONS) as Array<
      keyof typeof DEFAULT_TRANSFORM_OPTIONS
    >) {
      expect(DEFAULT_SHAPE_OPTIONS[key]).toEqual(DEFAULT_TRANSFORM_OPTIONS[key]);
    }
    for (const key of Object.keys(DEFAULT_TIMING_OPTIONS) as Array<
      keyof typeof DEFAULT_TIMING_OPTIONS
    >) {
      expect(DEFAULT_SHAPE_OPTIONS[key]).toEqual(DEFAULT_TIMING_OPTIONS[key]);
    }
  });

  it("default shapeType produces a visible rectangle with solid fill", () => {
    expect(DEFAULT_SHAPE_OPTIONS.shapeType).toBe("rectangle");
    expect(DEFAULT_SHAPE_OPTIONS.fillEnabled).toBe(true);
    expect(DEFAULT_SHAPE_OPTIONS.fillMode).toBe("solid");
    expect(DEFAULT_SHAPE_OPTIONS.fillOpacity).toBeGreaterThan(0);
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

  it("schema category order is Geometry → Transform → Fill → Stroke → Effects → Timing", () => {
    expect(categoryLabels(shapeOptionsSchema)).toEqual([
      "Geometry",
      "Transform",
      "Fill",
      "Stroke",
      "Effects",
      "Timing"
    ]);
  });

  it("Transform and Timing categories are literally the shared entries", () => {
    const schemaTransform = shapeOptionsSchema.find(
      (e) => e.type === "category" && e.id === "transform"
    );
    const schemaTiming = shapeOptionsSchema.find(
      (e) => e.type === "category" && e.id === "timing"
    );
    expect(schemaTransform).toBeDefined();
    expect(schemaTiming).toBeDefined();
    expect((schemaTiming as { defaultExpanded?: boolean }).defaultExpanded).toBe(false);
  });

  it("Shape options contain no image or video fields (T-024 / R7)", () => {
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

describe("Static Text options contract (T-026, T-027, T-028)", () => {
  it("defaults spread shared Transform + Timing and produce legible placeholder text", () => {
    expect(DEFAULT_STATIC_TEXT_OPTIONS.text.length).toBeGreaterThan(0);
    expect(DEFAULT_STATIC_TEXT_OPTIONS.fontSize).toBeGreaterThanOrEqual(12);
    for (const key of Object.keys(DEFAULT_TRANSFORM_OPTIONS) as Array<
      keyof typeof DEFAULT_TRANSFORM_OPTIONS
    >) {
      expect(DEFAULT_STATIC_TEXT_OPTIONS[key]).toEqual(DEFAULT_TRANSFORM_OPTIONS[key]);
    }
  });

  it("schema category order matches the kit", () => {
    expect(categoryLabels(staticTextOptionsSchema)).toEqual([
      "Content",
      "Typography",
      "Color",
      "Transform",
      "Box",
      "Effects",
      "Timing"
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

describe("Image options contract (T-035, T-036, T-037)", () => {
  it("image source is required", () => {
    const source = flat(imageOptionsSchema).find((f) => f.id === "source");
    expect(source?.type).toBe("image");
    expect((source as { required?: boolean }).required).toBe(true);
  });

  it("defaults produce no image path (renders nothing until chosen)", () => {
    expect(DEFAULT_IMAGE_OPTIONS.source).toBe("");
  });

  it("defaults spread shared Transform + Timing", () => {
    for (const key of Object.keys(DEFAULT_TRANSFORM_OPTIONS) as Array<
      keyof typeof DEFAULT_TRANSFORM_OPTIONS
    >) {
      expect(DEFAULT_IMAGE_OPTIONS[key]).toEqual(DEFAULT_TRANSFORM_OPTIONS[key]);
    }
  });

  it("schema category order is Source → Transform → Fit → Appearance → Effects → Timing", () => {
    expect(categoryLabels(imageOptionsSchema)).toEqual([
      "Source",
      "Transform",
      "Fit",
      "Appearance",
      "Effects",
      "Timing"
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
