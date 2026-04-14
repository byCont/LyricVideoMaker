import type { VideoSettings } from "@lyric-video-maker/core";
import { computeTransformStyle, computeTimingOpacity } from "../../shared";
import { withAlpha } from "../../shared/color";
import { computeTransitionStyle } from "./transitions";
import { createSeededRng } from "./order";
import type {
  SlideshowComponentOptions,
  SlideScheduleEntry,
  SlideshowFrameState
} from "./types";

export interface SlideshowContainerState {
  containerStyle: Record<string, string>;
  frameState: SlideshowFrameState;
}

/**
 * Find which slide(s) are active at a given time.
 * Returns up to two overlapping entries during transitions.
 */
function findActiveSlides(
  timeMs: number,
  schedule: SlideScheduleEntry[]
): SlideScheduleEntry[] {
  const active: SlideScheduleEntry[] = [];
  for (const entry of schedule) {
    if (timeMs >= entry.startMs && timeMs < entry.endMs) {
      active.push(entry);
      if (active.length >= 2) break;
    }
  }
  return active;
}

export function computeSlideshowFrameState(
  timeMs: number,
  schedule: SlideScheduleEntry[],
  options: SlideshowComponentOptions
): SlideshowFrameState {
  if (schedule.length === 0) {
    return { currentSlide: null, nextSlide: null, isTransitioning: false, transitionProgress: 0 };
  }

  const active = findActiveSlides(timeMs, schedule);

  if (active.length === 0) {
    return { currentSlide: null, nextSlide: null, isTransitioning: false, transitionProgress: 0 };
  }

  if (active.length === 1) {
    const entry = active[0];
    const kenBurns = computeKenBurnsTransform(timeMs, entry, options);
    return {
      currentSlide: { imageIndex: entry.imageIndex, opacity: 1, transform: kenBurns },
      nextSlide: null,
      isTransitioning: false,
      transitionProgress: 0
    };
  }

  // Two slides active — we're in a transition
  const current = active[0];
  const next = active[1];
  const overlapStart = next.startMs;
  const overlapEnd = current.endMs;
  const overlapDuration = overlapEnd - overlapStart;
  const rawProgress = overlapDuration > 0 ? (timeMs - overlapStart) / overlapDuration : 1;
  const transitionProgress = Math.max(0, Math.min(1, rawProgress));

  const style = computeTransitionStyle(
    options.transitionType,
    transitionProgress,
    options.transitionEasing
  );

  const currentKenBurns = computeKenBurnsTransform(timeMs, current, options);
  const nextKenBurns = computeKenBurnsTransform(timeMs, next, options);

  const currentTransform = [currentKenBurns, style.outgoing.transform].filter(Boolean).join(" ");
  const nextTransform = [nextKenBurns, style.incoming.transform].filter(Boolean).join(" ");

  return {
    currentSlide: {
      imageIndex: current.imageIndex,
      opacity: style.outgoing.opacity,
      transform: currentTransform
    },
    nextSlide: {
      imageIndex: next.imageIndex,
      opacity: style.incoming.opacity,
      transform: nextTransform
    },
    isTransitioning: true,
    transitionProgress
  };
}

/**
 * Ken Burns: subtle zoom+pan over each slide's hold period.
 * Each slide gets a deterministic start/end state derived from its slideIndex.
 */
function computeKenBurnsTransform(
  timeMs: number,
  entry: SlideScheduleEntry,
  options: SlideshowComponentOptions
): string {
  if (!options.kenBurnsEnabled || options.kenBurnsScale <= 0) {
    return "";
  }

  const scaleFactor = options.kenBurnsScale / 100;
  const rng = options.kenBurnsRandomize
    ? createSeededRng((options.randomSeed || 42) + entry.slideIndex * 7919)
    : createSeededRng(42);

  // Generate start and end states
  const startScale = 1 + rng() * scaleFactor;
  const endScale = 1 + rng() * scaleFactor;
  const startX = (rng() - 0.5) * scaleFactor * 20;
  const startY = (rng() - 0.5) * scaleFactor * 20;
  const endX = (rng() - 0.5) * scaleFactor * 20;
  const endY = (rng() - 0.5) * scaleFactor * 20;

  // Interpolate based on slide progress
  const duration = entry.endMs - entry.startMs;
  const progress = duration > 0 ? Math.max(0, Math.min(1, (timeMs - entry.startMs) / duration)) : 0;

  const scale = startScale + (endScale - startScale) * progress;
  const x = startX + (endX - startX) * progress;
  const y = startY + (endY - startY) * progress;

  return `scale(${scale.toFixed(4)}) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
}

export function buildSlideshowContainerStyle(
  options: SlideshowComponentOptions,
  video: VideoSettings,
  timeMs: number
): Record<string, string> {
  const transformStyle = computeTransformStyle(options, {
    width: video.width,
    height: video.height
  });
  const containerStyle: Record<string, string> = {};
  for (const [key, value] of Object.entries(transformStyle)) {
    if (value !== undefined && value !== null) {
      containerStyle[key] = String(value);
    }
  }

  containerStyle.borderRadius = `${options.cornerRadius}px`;
  containerStyle.overflow = "hidden";
  containerStyle.opacity = String((options.opacity / 100) * computeTimingOpacity(timeMs, options));

  if (options.borderEnabled && options.borderThickness > 0) {
    containerStyle.border = `${options.borderThickness}px solid ${options.borderColor}`;
    containerStyle.boxSizing = "border-box";
  }

  const shadowFilter = buildShadowGlow(options);
  if (shadowFilter !== "none") {
    containerStyle.filter = shadowFilter;
  }

  return containerStyle;
}

export function buildImageFilter(options: SlideshowComponentOptions): string {
  const parts: string[] = [];
  if (options.grayscale > 0) parts.push(`grayscale(${options.grayscale / 100})`);
  if (options.blur > 0) parts.push(`blur(${options.blur}px)`);
  if (options.brightness !== 100) parts.push(`brightness(${options.brightness / 100})`);
  if (options.contrast !== 100) parts.push(`contrast(${options.contrast / 100})`);
  if (options.saturation !== 100) parts.push(`saturate(${options.saturation / 100})`);
  return parts.join(" ");
}

function buildShadowGlow(options: SlideshowComponentOptions): string {
  const parts: string[] = [];
  if (options.shadowEnabled) {
    parts.push(
      `drop-shadow(${options.shadowOffsetX}px ${options.shadowOffsetY}px ${options.shadowBlur}px ${options.shadowColor})`
    );
  }
  if (options.glowEnabled) {
    parts.push(`drop-shadow(0 0 ${options.glowStrength}px ${options.glowColor})`);
  }
  return parts.join(" ") || "none";
}

export function buildTintOverlay(options: SlideshowComponentOptions): string {
  if (!options.tintEnabled) return "";
  return `<div style="position:absolute;inset:0;background:${withAlpha(options.tintColor, options.tintStrength / 100)};mix-blend-mode:multiply;pointer-events:none;"></div>`;
}

function mapFitMode(mode: SlideshowComponentOptions["fitMode"]): string {
  switch (mode) {
    case "contain": return "contain";
    case "cover": return "cover";
    case "fill": return "fill";
    case "none": return "none";
    default: return "cover";
  }
}

export function buildSlideImgStyle(
  options: SlideshowComponentOptions,
  slideOpacity: number,
  slideTransform: string,
  clipPath?: string
): string {
  const filter = buildImageFilter(options);
  let style = `position:absolute;inset:0;width:100%;height:100%;object-fit:${mapFitMode(options.fitMode)};opacity:${slideOpacity};`;
  if (slideTransform) {
    style += `transform:${slideTransform};`;
  }
  if (filter) {
    style += `filter:${filter};`;
  }
  if (clipPath) {
    style += `clip-path:${clipPath};`;
  }
  return style;
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}

export function buildSlideshowInnerHtml(
  frameState: SlideshowFrameState,
  options: SlideshowComponentOptions,
  resolveImageUrl: (imageIndex: number) => string | null
): string {
  const parts: string[] = [];

  if (frameState.currentSlide) {
    const url = resolveImageUrl(frameState.currentSlide.imageIndex);
    if (url) {
      const style = buildSlideImgStyle(options, frameState.currentSlide.opacity, frameState.currentSlide.transform);
      parts.push(`<img src="${escapeAttr(url)}" alt="" style="${style}" />`);
    }
  }

  if (frameState.nextSlide) {
    const url = resolveImageUrl(frameState.nextSlide.imageIndex);
    if (url) {
      const style = buildSlideImgStyle(options, frameState.nextSlide.opacity, frameState.nextSlide.transform);
      parts.push(`<img src="${escapeAttr(url)}" alt="" style="${style}" />`);
    }
  }

  parts.push(buildTintOverlay(options));

  return parts.join("");
}
