import type { SceneOptionCategory } from "@lyric-video-maker/core";
import { DEFAULT_GOOGLE_FONT_FAMILY } from "@lyric-video-maker/core";
import {
  DEFAULT_TIMING_OPTIONS,
  DEFAULT_TRANSFORM_OPTIONS,
  timingCategory,
  transformCategory,
  type TimingOptions,
  type TransformOptions
} from "../../shared";

export type TextCase = "as-typed" | "uppercase" | "lowercase" | "title-case";
export type TextAlign = "left" | "center" | "right" | "justify";
export type StaticTextColorMode = "solid" | "gradient";

/** Static Text options contract (cavekit-static-text-component R2). */
export interface StaticTextComponentOptions extends TransformOptions, TimingOptions {
  // Content
  text: string;
  textCase: TextCase;
  enableTokens: boolean;

  // Typography
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: TextAlign;

  // Color
  color: string;
  colorMode: StaticTextColorMode;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;

  // Box
  paddingHorizontal: number;
  paddingVertical: number;
  backdropEnabled: boolean;
  backdropColor: string;
  backdropOpacity: number;
  backdropCornerRadius: number;

  // Effects — border
  borderEnabled: boolean;
  borderColor: string;
  borderThickness: number;
  // Effects — shadow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowIntensity: number;
  // Effects — glow
  glowEnabled: boolean;
  glowColor: string;
  glowStrength: number;
}

export const DEFAULT_STATIC_TEXT_OPTIONS: StaticTextComponentOptions = {
  ...DEFAULT_TRANSFORM_OPTIONS,
  ...DEFAULT_TIMING_OPTIONS,
  text: "Static Text",
  textCase: "as-typed",
  enableTokens: false,
  fontFamily: DEFAULT_GOOGLE_FONT_FAMILY,
  fontSize: 72,
  fontWeight: 600,
  letterSpacing: 0,
  lineHeight: 1.15,
  textAlign: "center",
  color: "#ffffff",
  colorMode: "solid",
  gradientStart: "#ffffff",
  gradientEnd: "#a64dff",
  gradientAngle: 90,
  paddingHorizontal: 24,
  paddingVertical: 16,
  backdropEnabled: false,
  backdropColor: "#000000",
  backdropOpacity: 60,
  backdropCornerRadius: 12,
  borderEnabled: false,
  borderColor: "#000000",
  borderThickness: 2,
  shadowEnabled: false,
  shadowColor: "#000000",
  shadowIntensity: 40,
  glowEnabled: false,
  glowColor: "#ffffff",
  glowStrength: 40
};

const contentCategory: SceneOptionCategory = {
  type: "category",
  id: "static-text-content",
  label: "Content",
  defaultExpanded: true,
  options: [
    { type: "text", id: "text", label: "Text", defaultValue: "Static Text", multiline: true },
    {
      type: "select",
      id: "textCase",
      label: "Case",
      defaultValue: "as-typed",
      options: [
        { label: "As Typed", value: "as-typed" },
        { label: "UPPERCASE", value: "uppercase" },
        { label: "lowercase", value: "lowercase" },
        { label: "Title Case", value: "title-case" }
      ]
    },
    { type: "boolean", id: "enableTokens", label: "Enable Tokens", defaultValue: false }
  ]
};

const typographyCategory: SceneOptionCategory = {
  type: "category",
  id: "static-text-typography",
  label: "Typography",
  defaultExpanded: true,
  options: [
    { type: "font", id: "fontFamily", label: "Font Family", defaultValue: DEFAULT_GOOGLE_FONT_FAMILY },
    { type: "number", id: "fontSize", label: "Font Size", defaultValue: 72, min: 8, max: 400, step: 1 },
    { type: "number", id: "fontWeight", label: "Font Weight", defaultValue: 600, min: 100, max: 900, step: 100 },
    { type: "number", id: "letterSpacing", label: "Letter Spacing", defaultValue: 0, min: -20, max: 50, step: 1 },
    { type: "number", id: "lineHeight", label: "Line Height", defaultValue: 1.15, min: 0.5, max: 3, step: 0.05 },
    {
      type: "select",
      id: "textAlign",
      label: "Align",
      defaultValue: "center",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
        { label: "Justify", value: "justify" }
      ]
    }
  ]
};

const colorCategory: SceneOptionCategory = {
  type: "category",
  id: "static-text-color",
  label: "Color",
  defaultExpanded: false,
  options: [
    { type: "color", id: "color", label: "Color", defaultValue: "#ffffff" },
    {
      type: "select",
      id: "colorMode",
      label: "Color Mode",
      defaultValue: "solid",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Gradient", value: "gradient" }
      ]
    },
    { type: "color", id: "gradientStart", label: "Gradient Start", defaultValue: "#ffffff" },
    { type: "color", id: "gradientEnd", label: "Gradient End", defaultValue: "#a64dff" },
    { type: "number", id: "gradientAngle", label: "Gradient Angle", defaultValue: 90, min: 0, max: 360, step: 1 }
  ]
};

const boxCategory: SceneOptionCategory = {
  type: "category",
  id: "static-text-box",
  label: "Box",
  defaultExpanded: false,
  options: [
    { type: "number", id: "paddingHorizontal", label: "Padding H", defaultValue: 24, min: 0, max: 400, step: 1 },
    { type: "number", id: "paddingVertical", label: "Padding V", defaultValue: 16, min: 0, max: 400, step: 1 },
    { type: "boolean", id: "backdropEnabled", label: "Backdrop Enabled", defaultValue: false },
    { type: "color", id: "backdropColor", label: "Backdrop Color", defaultValue: "#000000" },
    { type: "number", id: "backdropOpacity", label: "Backdrop Opacity", defaultValue: 60, min: 0, max: 100, step: 1 },
    { type: "number", id: "backdropCornerRadius", label: "Backdrop Radius", defaultValue: 12, min: 0, max: 200, step: 1 }
  ]
};

const effectsCategory: SceneOptionCategory = {
  type: "category",
  id: "static-text-effects",
  label: "Effects",
  defaultExpanded: false,
  options: [
    { type: "boolean", id: "borderEnabled", label: "Border Enabled", defaultValue: false },
    { type: "color", id: "borderColor", label: "Border Color", defaultValue: "#000000" },
    { type: "number", id: "borderThickness", label: "Border Thickness", defaultValue: 2, min: 0, max: 30, step: 1 },
    { type: "boolean", id: "shadowEnabled", label: "Shadow Enabled", defaultValue: false },
    { type: "color", id: "shadowColor", label: "Shadow Color", defaultValue: "#000000" },
    { type: "number", id: "shadowIntensity", label: "Shadow Intensity", defaultValue: 40, min: 0, max: 200, step: 1 },
    { type: "boolean", id: "glowEnabled", label: "Glow Enabled", defaultValue: false },
    { type: "color", id: "glowColor", label: "Glow Color", defaultValue: "#ffffff" },
    { type: "number", id: "glowStrength", label: "Glow Strength", defaultValue: 40, min: 0, max: 200, step: 1 }
  ]
};

/**
 * Static Text options schema (cavekit-static-text-component R3).
 *
 * Category order: Content → Typography → Color → Transform → Box → Effects → Timing.
 * Transform and Timing entries come from the shared helpers barrel.
 */
export const staticTextOptionsSchema = [
  contentCategory,
  typographyCategory,
  colorCategory,
  transformCategory,
  boxCategory,
  effectsCategory,
  timingCategory
];
