import type { VideoSettings } from "@lyric-video-maker/core";
import { computeTransformStyle, computeTimingOpacity } from "../../shared";
import { withAlpha } from "../../shared/color";
import type { ShapeComponentOptions } from "./options";

export interface ShapeInitialState {
  html: string;
  containerStyle: Record<string, string>;
  initialOpacity: number;
}

/**
 * Build the Shape component's browser-side initial state: a container
 * style honoring the shared Transform helper plus an inner HTML fragment
 * that renders the selected shape type with fill, stroke, and effect
 * styling. Used by both the React SSR Component path and the live-DOM
 * `static-fx-layer` runtime so both paths produce identical markup.
 */
export function buildShapeInitialState(
  options: ShapeComponentOptions,
  video: VideoSettings,
  timeMs: number
): ShapeInitialState {
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
  containerStyle.filter = buildEffectFilter(options);

  const innerHtml = buildShapeInnerMarkup(options);
  const initialOpacity = computeTimingOpacity(timeMs, options);

  return {
    html: innerHtml,
    containerStyle,
    initialOpacity
  };
}

function buildEffectFilter(options: ShapeComponentOptions): string {
  const parts: string[] = [];
  if (options.shadowEnabled) {
    parts.push(
      `drop-shadow(${options.shadowOffsetX}px ${options.shadowOffsetY}px ${options.shadowBlur}px ${options.shadowColor})`
    );
  }
  if (options.glowEnabled) {
    parts.push(`drop-shadow(0 0 ${options.glowStrength}px ${options.glowColor})`);
  }
  if (options.blur > 0) {
    parts.push(`blur(${options.blur}px)`);
  }
  return parts.join(" ") || "none";
}

function buildShapeInnerMarkup(options: ShapeComponentOptions): string {
  switch (options.shapeType) {
    case "rectangle":
      return buildBoxShape(options, "0");
    case "circle":
    case "ellipse":
      return buildBoxShape(options, "50%");
    case "line":
      return buildLineShape(options);
    case "triangle":
    case "polygon":
      return buildPolygonShape(options);
    default:
      return "";
  }
}

function buildBoxShape(options: ShapeComponentOptions, radius: string): string {
  const background = buildFillCss(options);
  const strokeStyle = options.strokeEnabled
    ? `${options.strokeWidth}px solid ${withAlpha(options.strokeColor, options.strokeOpacity / 100)}`
    : "none";
  const opacity = options.fillEnabled ? options.fillOpacity / 100 : 0;
  return `<div data-shape="${escapeAttr(options.shapeType)}" style="position:absolute;inset:0;background:${background};border:${strokeStyle};border-radius:${radius};opacity:${opacity};box-sizing:border-box;"></div>`;
}

function buildLineShape(options: ShapeComponentOptions): string {
  const background = buildFillCss(options);
  const height = `${Math.max(1, options.lineThickness)}px`;
  return `<div data-shape="line" style="position:absolute;left:0;right:0;top:50%;height:${height};background:${background};transform:translateY(-50%);opacity:${options.fillEnabled ? options.fillOpacity / 100 : 0};"></div>`;
}

function buildPolygonShape(options: ShapeComponentOptions): string {
  const sides = options.shapeType === "triangle" ? 3 : clampSides(options.polygonSides);
  const points = computePolygonPoints(sides);
  const fill =
    options.fillMode === "gradient" ? `url(#shape-grad)` : options.fillColor;
  const fillOpacity = options.fillEnabled ? options.fillOpacity / 100 : 0;
  const stroke = options.strokeEnabled ? options.strokeColor : "none";
  const strokeWidth = options.strokeEnabled ? options.strokeWidth : 0;
  const strokeOpacity = options.strokeOpacity / 100;
  const gradientDef =
    options.fillMode === "gradient"
      ? `<defs><linearGradient id="shape-grad" gradientTransform="rotate(${options.fillGradientAngle})"><stop offset="0%" stop-color="${options.fillGradientStart}"/><stop offset="100%" stop-color="${options.fillGradientEnd}"/></linearGradient></defs>`
      : "";
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;">${gradientDef}<polygon points="${points}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}"/></svg>`;
}

function buildFillCss(options: ShapeComponentOptions): string {
  if (!options.fillEnabled) {
    return "transparent";
  }
  if (options.fillMode === "gradient") {
    return `linear-gradient(${options.fillGradientAngle}deg, ${options.fillGradientStart}, ${options.fillGradientEnd})`;
  }
  return options.fillColor;
}

function computePolygonPoints(sides: number): string {
  const center = 50;
  const radius = 48;
  const points: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push(`${x.toFixed(3)},${y.toFixed(3)}`);
  }
  return points.join(" ");
}

function clampSides(n: number): number {
  if (!Number.isFinite(n)) return 6;
  return Math.max(3, Math.min(12, Math.round(n)));
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}
