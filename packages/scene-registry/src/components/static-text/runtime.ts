import type { VideoSettings } from "@lyric-video-maker/core";
import { computeTransformStyle } from "../../shared/transform-runtime";
import { computeTimingOpacity } from "../../shared/timing-runtime";
import { withAlpha } from "../../shared/color";
import type { StaticTextComponentOptions } from "./options";

export interface StaticTextInitialState {
  html: string;
  containerStyle: Record<string, string>;
  initialOpacity: number;
  resolvedText: string;
}

/**
 * Token metadata available to Static Text token substitution (T-029).
 * This is the subset of render context metadata keys that the component
 * knows about today. Keys absent from this record are treated as
 * "unavailable" and left literal. The set is INTENTIONALLY small — the
 * kit is explicit that expanding it is a documented follow-up.
 */
export interface StaticTextTokenMetadata {
  songTitle?: string;
  songArtist?: string;
}

export function buildStaticTextInitialState(
  options: StaticTextComponentOptions,
  video: VideoSettings,
  timeMs: number,
  metadata: StaticTextTokenMetadata = {}
): StaticTextInitialState {
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
  containerStyle.display = "flex";
  containerStyle.alignItems = "center";
  containerStyle.justifyContent =
    options.textAlign === "left"
      ? "flex-start"
      : options.textAlign === "right"
        ? "flex-end"
        : "center";
  containerStyle.padding = `${options.paddingVertical}px ${options.paddingHorizontal}px`;
  containerStyle.boxSizing = "border-box";

  const filter = buildEffectFilter(options);
  if (filter !== "none") {
    containerStyle.filter = filter;
  }

  const resolvedText = applyTokenSubstitution(
    applyTextCase(options.text, options.textCase),
    options.enableTokens,
    metadata
  );
  const html = buildTextMarkup(options, resolvedText);
  const initialOpacity = computeTimingOpacity(timeMs, options);

  return {
    html,
    containerStyle,
    initialOpacity,
    resolvedText
  };
}

function applyTextCase(text: string, textCase: StaticTextComponentOptions["textCase"]): string {
  switch (textCase) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "title-case":
      return text.replace(/\w\S*/g, (match) => match[0].toUpperCase() + match.slice(1).toLowerCase());
    case "as-typed":
    default:
      return text;
  }
}

/**
 * Token substitution (T-029): when `enabled` is true, replace {token}
 * sequences in `text` whose key exists in `metadata`. Tokens referring to
 * unavailable keys are left as literal text (including the braces) with
 * no crash. When `enabled` is false, curly-brace sequences are rendered
 * verbatim.
 */
export function applyTokenSubstitution(
  text: string,
  enabled: boolean,
  metadata: StaticTextTokenMetadata
): string {
  if (!enabled) {
    return text;
  }
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = metadata[key as keyof StaticTextTokenMetadata];
    if (typeof value === "string") {
      return value;
    }
    return match;
  });
}

function buildTextMarkup(options: StaticTextComponentOptions, text: string): string {
  const textStyle = buildTextColorStyle(options);
  const effectStyle = buildTextEffectStyle(options);
  const backdrop = options.backdropEnabled
    ? `<div style="position:absolute;inset:0;background:${withAlpha(options.backdropColor, options.backdropOpacity / 100)};border-radius:${options.backdropCornerRadius}px;"></div>`
    : "";
  const escaped = escapeHtml(text).replace(/\n/g, "<br/>");
  return `${backdrop}<div style="position:relative;font-family:'${escapeAttr(options.fontFamily)}',sans-serif;font-size:${options.fontSize}px;font-weight:${options.fontWeight};letter-spacing:${options.letterSpacing}px;line-height:${options.lineHeight};text-align:${options.textAlign};${textStyle}${effectStyle}">${escaped}</div>`;
}

function buildTextColorStyle(options: StaticTextComponentOptions): string {
  if (options.colorMode === "gradient") {
    return `background:linear-gradient(${options.gradientAngle}deg, ${options.gradientStart}, ${options.gradientEnd});-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;`;
  }
  return `color:${options.color};`;
}

function buildTextEffectStyle(options: StaticTextComponentOptions): string {
  const textShadows: string[] = [];
  if (options.borderEnabled && options.borderThickness > 0) {
    const t = options.borderThickness;
    // Simulate a uniform border by compositing offset text shadows in eight
    // directions. Composes with the drop-shadow/glow below without either
    // effect suppressing the other.
    textShadows.push(
      `-${t}px -${t}px 0 ${options.borderColor}`,
      `${t}px -${t}px 0 ${options.borderColor}`,
      `-${t}px ${t}px 0 ${options.borderColor}`,
      `${t}px ${t}px 0 ${options.borderColor}`,
      `${t}px 0 0 ${options.borderColor}`,
      `-${t}px 0 0 ${options.borderColor}`,
      `0 ${t}px 0 ${options.borderColor}`,
      `0 -${t}px 0 ${options.borderColor}`
    );
  }
  if (options.shadowEnabled) {
    textShadows.push(`0 ${options.shadowIntensity / 5}px ${options.shadowIntensity}px ${options.shadowColor}`);
  }
  if (options.glowEnabled) {
    textShadows.push(`0 0 ${options.glowStrength}px ${options.glowColor}`);
  }
  return textShadows.length > 0 ? `text-shadow:${textShadows.join(", ")};` : "";
}

function buildEffectFilter(_options: StaticTextComponentOptions): string {
  return "none";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}

export { computeTimingOpacity };
