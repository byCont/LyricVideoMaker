import {
  DEFAULT_TRANSFORM_OPTIONS,
  computeTransformStyle,
  transformCategory,
  type ModifierDefinition,
  type TransformOptions
} from "@lyric-video-maker/plugin-base";

/**
 * Transform modifier — positions, sizes, rotates, and flips the wrapped
 * component. Replaces the per-component TransformOptions mixin. Reuses the
 * existing `computeTransformStyle` pure helper; imperatively writes the
 * resulting CSS properties to its wrapper element.
 */
export const transformModifier: ModifierDefinition<TransformOptions> = {
  id: "transform",
  name: "Transform",
  description: "Position, size, anchor, rotation, and flip.",
  options: [transformCategory],
  defaultOptions: DEFAULT_TRANSFORM_OPTIONS,
  apply: ({ element, options, video }) => {
    const style = computeTransformStyle(options, {
      width: video.width,
      height: video.height
    });
    const target = element.style;
    target.position = String(style.position ?? "absolute");
    target.left = String(style.left ?? "");
    target.top = String(style.top ?? "");
    target.width = String(style.width ?? "");
    target.height = String(style.height ?? "");
    target.transform = String(style.transform ?? "");
    target.transformOrigin = String(style.transformOrigin ?? "");
  }
};
