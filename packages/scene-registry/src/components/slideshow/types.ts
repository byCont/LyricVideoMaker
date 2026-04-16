import type { TimingEasing } from "../../shared";

export type SlideshowTimingMode = "fixed-duration" | "align-to-lyrics";
export type SlideshowOrder = "sequential" | "shuffle" | "random";
export type SlideshowRepeat = "loop" | "single-pass" | "hold-last";
export type SlideshowTransition =
  | "none"
  | "crossfade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "zoom-in"
  | "zoom-out"
  | "dissolve"
  | "wipe-left"
  | "wipe-right";

export type ImageFitMode = "contain" | "cover" | "fill" | "none";

export interface SlideshowComponentOptions {
  // Source
  images: string[];

  // Slide Timing
  timingMode: SlideshowTimingMode;
  slideDuration: number;
  transitionDuration: number;
  initialDelay: number;

  // Behavior
  slideOrder: SlideshowOrder;
  repeatMode: SlideshowRepeat;
  randomSeed: number;

  // Transition
  transitionType: SlideshowTransition;
  transitionEasing: TimingEasing;

  // Ken Burns
  kenBurnsEnabled: boolean;
  kenBurnsScale: number;
  kenBurnsRandomize: boolean;

  // Fit
  fitMode: ImageFitMode;

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

export interface SlideScheduleEntry {
  slideIndex: number;
  imageIndex: number;
  startMs: number;
  endMs: number;
  holdStartMs: number;
  holdEndMs: number;
}

export interface PreparedSlideshowData {
  slideSchedule: SlideScheduleEntry[];
  effectiveOrder: number[];
  totalSlides: number;
}

export interface SlideshowFrameState {
  currentSlide: { imageIndex: number; opacity: number; transform: string } | null;
  nextSlide: { imageIndex: number; opacity: number; transform: string } | null;
  isTransitioning: boolean;
  transitionProgress: number;
}

export interface TransitionStyle {
  outgoing: { opacity: number; transform: string; clipPath?: string };
  incoming: { opacity: number; transform: string; clipPath?: string };
}
