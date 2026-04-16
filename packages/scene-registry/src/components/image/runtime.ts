import { withAlpha } from "../../shared/color";
import type { ImageComponentOptions } from "./options";

export interface ImageInitialState {
  html: string;
  containerStyle: Record<string, string>;
  sourceUrl: string | null;
}

/**
 * Build the Image component's inner markup. The outer modifier stack owns
 * position, size, fade, and opacity — this component only draws into the
 * container it is given. All visual effects (border, corner radius, shadow,
 * glow, CSS filters) are applied directly to the inner <img>. When tint is
 * enabled a multiply-blend overlay renders on top.
 *
 * When no source URL resolves the helper returns empty inner markup so the
 * component renders nothing rather than crashing.
 */
export function buildImageInitialState(
  options: ImageComponentOptions,
  resolvedUrl: string | null
): ImageInitialState {
  const containerStyle: Record<string, string> = {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%"
  };

  const html = resolvedUrl ? buildInnerMarkup(options, resolvedUrl) : "";

  return {
    html,
    containerStyle,
    sourceUrl: resolvedUrl
  };
}

function buildInnerMarkup(options: ImageComponentOptions, url: string): string {
  const cssFitMode = mapFitMode(options.fitMode);
  const filter = buildCombinedFilter(options);
  let imgStyle = `position:absolute;inset:0;width:100%;height:100%;object-fit:${cssFitMode};border-radius:${options.cornerRadius}px;`;
  if (options.borderEnabled && options.borderThickness > 0) {
    imgStyle += `border:${options.borderThickness}px solid ${options.borderColor};box-sizing:border-box;`;
  }
  if (filter) {
    imgStyle += `filter:${filter};`;
  }
  const img = `<img src="${escapeAttr(url)}" alt="" style="${imgStyle}" />`;
  const tint = options.tintEnabled
    ? `<div style="position:absolute;inset:0;border-radius:${options.cornerRadius}px;background:${withAlpha(options.tintColor, options.tintStrength / 100)};mix-blend-mode:multiply;"></div>`
    : "";
  return `${img}${tint}`;
}

function mapFitMode(mode: ImageComponentOptions["fitMode"]): string {
  switch (mode) {
    case "contain":
      return "contain";
    case "cover":
      return "cover";
    case "fill":
      return "fill";
    case "none":
      return "none";
    default:
      return "contain";
  }
}

function buildCombinedFilter(options: ImageComponentOptions): string {
  const parts: string[] = [];
  if (options.grayscale > 0) parts.push(`grayscale(${options.grayscale / 100})`);
  if (options.blur > 0) parts.push(`blur(${options.blur}px)`);
  if (options.brightness !== 100) parts.push(`brightness(${options.brightness / 100})`);
  if (options.contrast !== 100) parts.push(`contrast(${options.contrast / 100})`);
  if (options.saturation !== 100) parts.push(`saturate(${options.saturation / 100})`);
  if (options.shadowEnabled) {
    parts.push(
      `drop-shadow(${options.shadowOffsetX}px ${options.shadowOffsetY}px ${options.shadowBlur}px ${options.shadowColor})`
    );
  }
  if (options.glowEnabled) {
    parts.push(`drop-shadow(0 0 ${options.glowStrength}px ${options.glowColor})`);
  }
  return parts.join(" ");
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}
