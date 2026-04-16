import type { SceneOptionCategory } from "@lyric-video-maker/core";

/** Six supported shape primitives. */
export type ShapeType = "rectangle" | "circle" | "ellipse" | "triangle" | "line" | "polygon";

export const SHAPE_TYPE_VALUES: readonly ShapeType[] = [
  "rectangle",
  "circle",
  "ellipse",
  "triangle",
  "line",
  "polygon"
] as const;

export type ShapeFillMode = "solid" | "gradient";

/** Shape component options. Position and fade handled by modifier stack. */
export interface ShapeComponentOptions {
  // Geometry
  shapeType: ShapeType;
  polygonSides: number;
  cornerRadius: number;
  lineThickness: number;

  // Fill
  fillEnabled: boolean;
  fillMode: ShapeFillMode;
  fillColor: string;
  fillGradientStart: string;
  fillGradientEnd: string;
  fillGradientAngle: number;
  fillOpacity: number;

  // Stroke
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;

  // Effects — shadow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;

  // Effects — glow
  glowEnabled: boolean;
  glowColor: string;
  glowStrength: number;

  // Effects — blur
  blur: number;
}

export const DEFAULT_SHAPE_OPTIONS: ShapeComponentOptions = {
  shapeType: "rectangle",
  polygonSides: 6,
  cornerRadius: 0,
  lineThickness: 4,
  fillEnabled: true,
  fillMode: "solid",
  fillColor: "#4da3ff",
  fillGradientStart: "#4da3ff",
  fillGradientEnd: "#a64dff",
  fillGradientAngle: 90,
  fillOpacity: 100,
  strokeEnabled: false,
  strokeColor: "#ffffff",
  strokeWidth: 2,
  strokeOpacity: 100,
  shadowEnabled: false,
  shadowColor: "#000000",
  shadowBlur: 16,
  shadowOffsetX: 0,
  shadowOffsetY: 8,
  glowEnabled: false,
  glowColor: "#ffffff",
  glowStrength: 40,
  blur: 0
};

const geometryCategory: SceneOptionCategory = {
  type: "category",
  id: "shape-geometry",
  label: "Geometry",
  defaultExpanded: true,
  options: [
    {
      type: "select",
      id: "shapeType",
      label: "Shape",
      defaultValue: "rectangle",
      options: [
        { label: "Rectangle", value: "rectangle" },
        { label: "Circle", value: "circle" },
        { label: "Ellipse", value: "ellipse" },
        { label: "Triangle", value: "triangle" },
        { label: "Line", value: "line" },
        { label: "Regular Polygon", value: "polygon" }
      ]
    },
    {
      type: "number",
      id: "polygonSides",
      label: "Polygon Sides",
      defaultValue: 6,
      min: 3,
      max: 12,
      step: 1
    },
    { type: "number", id: "cornerRadius", label: "Corner Radius", defaultValue: 0, min: 0, max: 200, step: 1 },
    { type: "number", id: "lineThickness", label: "Line Thickness", defaultValue: 4, min: 1, max: 100, step: 1 }
  ]
};

const fillCategory: SceneOptionCategory = {
  type: "category",
  id: "shape-fill",
  label: "Fill",
  defaultExpanded: true,
  options: [
    { type: "boolean", id: "fillEnabled", label: "Fill Enabled", defaultValue: true },
    {
      type: "select",
      id: "fillMode",
      label: "Fill Mode",
      defaultValue: "solid",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Gradient", value: "gradient" }
      ]
    },
    { type: "color", id: "fillColor", label: "Fill Color", defaultValue: "#4da3ff" },
    { type: "color", id: "fillGradientStart", label: "Gradient Start", defaultValue: "#4da3ff" },
    { type: "color", id: "fillGradientEnd", label: "Gradient End", defaultValue: "#a64dff" },
    { type: "number", id: "fillGradientAngle", label: "Gradient Angle", defaultValue: 90, min: 0, max: 360, step: 1 },
    { type: "number", id: "fillOpacity", label: "Fill Opacity", defaultValue: 100, min: 0, max: 100, step: 1 }
  ]
};

const strokeCategory: SceneOptionCategory = {
  type: "category",
  id: "shape-stroke",
  label: "Stroke",
  defaultExpanded: false,
  options: [
    { type: "boolean", id: "strokeEnabled", label: "Stroke Enabled", defaultValue: false },
    { type: "color", id: "strokeColor", label: "Stroke Color", defaultValue: "#ffffff" },
    { type: "number", id: "strokeWidth", label: "Stroke Width", defaultValue: 2, min: 0, max: 100, step: 1 },
    { type: "number", id: "strokeOpacity", label: "Stroke Opacity", defaultValue: 100, min: 0, max: 100, step: 1 }
  ]
};

const effectsCategory: SceneOptionCategory = {
  type: "category",
  id: "shape-effects",
  label: "Effects",
  defaultExpanded: false,
  options: [
    { type: "boolean", id: "shadowEnabled", label: "Shadow Enabled", defaultValue: false },
    { type: "color", id: "shadowColor", label: "Shadow Color", defaultValue: "#000000" },
    { type: "number", id: "shadowBlur", label: "Shadow Blur", defaultValue: 16, min: 0, max: 200, step: 1 },
    { type: "number", id: "shadowOffsetX", label: "Shadow Offset X", defaultValue: 0, min: -200, max: 200, step: 1 },
    { type: "number", id: "shadowOffsetY", label: "Shadow Offset Y", defaultValue: 8, min: -200, max: 200, step: 1 },
    { type: "boolean", id: "glowEnabled", label: "Glow Enabled", defaultValue: false },
    { type: "color", id: "glowColor", label: "Glow Color", defaultValue: "#ffffff" },
    { type: "number", id: "glowStrength", label: "Glow Strength", defaultValue: 40, min: 0, max: 200, step: 1 },
    { type: "number", id: "blur", label: "Blur", defaultValue: 0, min: 0, max: 100, step: 1 }
  ]
};

/**
 * Shape options schema. Transform and Timing are now part of the Modifier
 * stack, not the component schema.
 */
export const shapeOptionsSchema = [
  geometryCategory,
  fillCategory,
  strokeCategory,
  effectsCategory
];
