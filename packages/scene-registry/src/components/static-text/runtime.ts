import { withAlpha } from "../../shared/color";
import type { StaticTextComponentOptions } from "./options";

export interface StaticTextInitialState {
  html: string;
  containerStyle: Record<string, string>;
  resolvedText: string;
}

/**
 * Token metadata available to Static Text token substitution.
 * This is the subset of render context metadata keys that the component
 * knows about today. Keys absent from this record are treated as
 * "unavailable" and left literal. The set is intentionally small — expanding
 * it is a documented follow-up.
 */
export interface StaticTextTokenMetadata {
  songTitle?: string;
  songArtist?: string;
}

export function buildStaticTextInitialState(
  options: StaticTextComponentOptions,
  metadata: StaticTextTokenMetadata = {}
): StaticTextInitialState {
  const containerStyle: Record<string, string> = {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    padding: `${options.paddingVertical}px ${options.paddingHorizontal}px`,
    boxSizing: "border-box",
    justifyContent:
      options.textAlign === "left"
        ? "flex-start"
        : options.textAlign === "right"
          ? "flex-end"
          : "center"
  };

  const resolvedText = applyTokenSubstitution(
    applyTextCase(options.text, options.textCase),
    options.enableTokens,
    metadata
  );
  const html = buildTextMarkup(options, resolvedText);

  return {
    html,
    containerStyle,
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
 * Token substitution: when `enabled` is true, replace {token} sequences in
 * `text` whose key exists in `metadata`. Tokens referring to unavailable
 * keys are left as literal text (including the braces) with no crash.
 * When `enabled` is false, curly-brace sequences are rendered verbatim.
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
