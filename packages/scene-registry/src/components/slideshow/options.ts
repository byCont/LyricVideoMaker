import type { SceneOptionCategory } from "@lyric-video-maker/core";
import type { SlideshowComponentOptions } from "./types";

export const DEFAULT_SLIDESHOW_OPTIONS: SlideshowComponentOptions = {
  images: [],
  timingMode: "fixed-duration",
  slideDuration: 5000,
  transitionDuration: 1000,
  initialDelay: 0,
  slideOrder: "sequential",
  repeatMode: "loop",
  randomSeed: 0,
  transitionType: "crossfade",
  transitionEasing: "ease-in-out",
  kenBurnsEnabled: false,
  kenBurnsScale: 10,
  kenBurnsRandomize: true,
  fitMode: "cover",
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
  id: "slideshow-source",
  label: "Source",
  defaultExpanded: true,
  options: [
    { type: "image-list", id: "images", label: "Images", required: true }
  ]
};

const slideTimingCategory: SceneOptionCategory = {
  type: "category",
  id: "slideshow-slide-timing",
  label: "Slide Timing",
  defaultExpanded: true,
  options: [
    {
      type: "select",
      id: "timingMode",
      label: "Timing Mode",
      defaultValue: "fixed-duration",
      options: [
        { label: "Fixed Duration", value: "fixed-duration" },
        { label: "Align to Lyrics", value: "align-to-lyrics" }
      ]
    },
    { type: "number", id: "slideDuration", label: "Slide Duration (ms)", defaultValue: 5000, min: 500, max: 60000, step: 100 },
    { type: "number", id: "transitionDuration", label: "Transition Duration (ms)", defaultValue: 1000, min: 0, max: 10000, step: 100 },
    { type: "number", id: "initialDelay", label: "Initial Delay (ms)", defaultValue: 0, min: 0, max: 30000, step: 100 }
  ]
};

const behaviorCategory: SceneOptionCategory = {
  type: "category",
  id: "slideshow-behavior",
  label: "Behavior",
  defaultExpanded: false,
  options: [
    {
      type: "select",
      id: "slideOrder",
      label: "Slide Order",
      defaultValue: "sequential",
      options: [
        { label: "Sequential", value: "sequential" },
        { label: "Shuffle", value: "shuffle" },
        { label: "Random", value: "random" }
      ]
    },
    {
      type: "select",
      id: "repeatMode",
      label: "Repeat Mode",
      defaultValue: "loop",
      options: [
        { label: "Loop", value: "loop" },
        { label: "Single Pass", value: "single-pass" },
        { label: "Hold Last", value: "hold-last" }
      ]
    },
    { type: "number", id: "randomSeed", label: "Random Seed (0 = random)", defaultValue: 0, min: 0, max: 999999, step: 1 }
  ]
};

const transitionCategory: SceneOptionCategory = {
  type: "category",
  id: "slideshow-transition",
  label: "Transition",
  defaultExpanded: false,
  options: [
    {
      type: "select",
      id: "transitionType",
      label: "Transition Type",
      defaultValue: "crossfade",
      options: [
        { label: "None", value: "none" },
        { label: "Crossfade", value: "crossfade" },
        { label: "Slide Left", value: "slide-left" },
        { label: "Slide Right", value: "slide-right" },
        { label: "Slide Up", value: "slide-up" },
        { label: "Slide Down", value: "slide-down" },
        { label: "Zoom In", value: "zoom-in" },
        { label: "Zoom Out", value: "zoom-out" },
        { label: "Dissolve", value: "dissolve" },
        { label: "Wipe Left", value: "wipe-left" },
        { label: "Wipe Right", value: "wipe-right" }
      ]
    },
    {
      type: "select",
      id: "transitionEasing",
      label: "Transition Easing",
      defaultValue: "ease-in-out",
      options: [
        { label: "Linear", value: "linear" },
        { label: "Ease In", value: "ease-in" },
        { label: "Ease Out", value: "ease-out" },
        { label: "Ease In-Out", value: "ease-in-out" }
      ]
    }
  ]
};

const kenBurnsCategory: SceneOptionCategory = {
  type: "category",
  id: "slideshow-ken-burns",
  label: "Ken Burns Effect",
  defaultExpanded: false,
  options: [
    { type: "boolean", id: "kenBurnsEnabled", label: "Enabled", defaultValue: false },
    { type: "number", id: "kenBurnsScale", label: "Scale (%)", defaultValue: 10, min: 1, max: 50, step: 1 },
    { type: "boolean", id: "kenBurnsRandomize", label: "Randomize Direction", defaultValue: true }
  ]
};

const fitCategory: SceneOptionCategory = {
  type: "category",
  id: "slideshow-fit",
  label: "Fit",
  defaultExpanded: false,
  options: [
    {
      type: "select",
      id: "fitMode",
      label: "Fit Mode",
      defaultValue: "cover",
      options: [
        { label: "Contain", value: "contain" },
        { label: "Cover", value: "cover" },
        { label: "Fill", value: "fill" },
        { label: "None", value: "none" }
      ]
    }
  ]
};

const appearanceCategory: SceneOptionCategory = {
  type: "category",
  id: "slideshow-appearance",
  label: "Appearance",
  defaultExpanded: false,
  options: [
    { type: "number", id: "cornerRadius", label: "Corner Radius", defaultValue: 0, min: 0, max: 200, step: 1 }
  ]
};

const effectsCategory: SceneOptionCategory = {
  type: "category",
  id: "slideshow-effects",
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

export const slideshowOptionsSchema = [
  sourceCategory,
  slideTimingCategory,
  behaviorCategory,
  transitionCategory,
  kenBurnsCategory,
  fitCategory,
  appearanceCategory,
  effectsCategory
];
