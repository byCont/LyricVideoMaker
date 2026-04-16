import type { SceneOptionCategory } from "@lyric-video-maker/core";

export type ImageFitMode = "contain" | "cover" | "fill" | "none";

/** Image component options. Position, fade, and opacity are all handled by
 * the Modifier stack now and are not part of the component's own options. */
export interface ImageComponentOptions {
  // Source
  source: string;

  // Fit
  fitMode: ImageFitMode;
  preserveAspectRatio: boolean;

  // Appearance
  cornerRadius: number;

  // Effects — border
  borderEnabled: boolean;
  borderColor: string;
  borderThickness: number;
  // Effects — tint
  tintEnabled: boolean;
  tintColor: string;
  tintStrength: number;
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

  // Filters
  grayscale: number;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
}

export const DEFAULT_IMAGE_OPTIONS: ImageComponentOptions = {
  source: "",
  fitMode: "contain",
  preserveAspectRatio: true,
  cornerRadius: 0,
  borderEnabled: false,
  borderColor: "#ffffff",
  borderThickness: 2,
  tintEnabled: false,
  tintColor: "#4da3ff",
  tintStrength: 50,
  shadowEnabled: false,
  shadowColor: "#000000",
  shadowBlur: 16,
  shadowOffsetX: 0,
  shadowOffsetY: 8,
  glowEnabled: false,
  glowColor: "#ffffff",
  glowStrength: 40,
  grayscale: 0,
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100
};

const sourceCategory: SceneOptionCategory = {
  type: "category",
  id: "image-source",
  label: "Source",
  defaultExpanded: true,
  options: [{ type: "image", id: "source", label: "Image Source", required: true }]
};

const fitCategory: SceneOptionCategory = {
  type: "category",
  id: "image-fit",
  label: "Fit",
  defaultExpanded: false,
  options: [
    {
      type: "select",
      id: "fitMode",
      label: "Fit Mode",
      defaultValue: "contain",
      options: [
        { label: "Contain", value: "contain" },
        { label: "Cover", value: "cover" },
        { label: "Fill", value: "fill" },
        { label: "None", value: "none" }
      ]
    },
    { type: "boolean", id: "preserveAspectRatio", label: "Preserve Aspect Ratio", defaultValue: true }
  ]
};

const appearanceCategory: SceneOptionCategory = {
  type: "category",
  id: "image-appearance",
  label: "Appearance",
  defaultExpanded: false,
  options: [
    { type: "number", id: "cornerRadius", label: "Corner Radius", defaultValue: 0, min: 0, max: 200, step: 1 }
  ]
};

const effectsCategory: SceneOptionCategory = {
  type: "category",
  id: "image-effects",
  label: "Effects",
  defaultExpanded: false,
  options: [
    { type: "boolean", id: "borderEnabled", label: "Border Enabled", defaultValue: false },
    { type: "color", id: "borderColor", label: "Border Color", defaultValue: "#ffffff" },
    { type: "number", id: "borderThickness", label: "Border Thickness", defaultValue: 2, min: 0, max: 30, step: 1 },
    { type: "boolean", id: "tintEnabled", label: "Tint Enabled", defaultValue: false },
    { type: "color", id: "tintColor", label: "Tint Color", defaultValue: "#4da3ff" },
    { type: "number", id: "tintStrength", label: "Tint Strength", defaultValue: 50, min: 0, max: 100, step: 1 },
    { type: "boolean", id: "shadowEnabled", label: "Shadow Enabled", defaultValue: false },
    { type: "color", id: "shadowColor", label: "Shadow Color", defaultValue: "#000000" },
    { type: "number", id: "shadowBlur", label: "Shadow Blur", defaultValue: 16, min: 0, max: 200, step: 1 },
    { type: "number", id: "shadowOffsetX", label: "Shadow Offset X", defaultValue: 0, min: -200, max: 200, step: 1 },
    { type: "number", id: "shadowOffsetY", label: "Shadow Offset Y", defaultValue: 8, min: -200, max: 200, step: 1 },
    { type: "boolean", id: "glowEnabled", label: "Glow Enabled", defaultValue: false },
    { type: "color", id: "glowColor", label: "Glow Color", defaultValue: "#ffffff" },
    { type: "number", id: "glowStrength", label: "Glow Strength", defaultValue: 40, min: 0, max: 200, step: 1 },
    { type: "number", id: "grayscale", label: "Grayscale", defaultValue: 0, min: 0, max: 100, step: 1 },
    { type: "number", id: "blur", label: "Blur", defaultValue: 0, min: 0, max: 100, step: 1 },
    { type: "number", id: "brightness", label: "Brightness", defaultValue: 100, min: 0, max: 300, step: 1 },
    { type: "number", id: "contrast", label: "Contrast", defaultValue: 100, min: 0, max: 300, step: 1 },
    { type: "number", id: "saturation", label: "Saturation", defaultValue: 100, min: 0, max: 300, step: 1 }
  ]
};

export const imageOptionsSchema = [sourceCategory, fitCategory, appearanceCategory, effectsCategory];
