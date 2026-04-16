import type { ModifierDefinition } from "@lyric-video-maker/plugin-base";

export interface VisibilityModifierOptions {
  visible: boolean;
}

const DEFAULTS: VisibilityModifierOptions = {
  visible: true
};

/**
 * Visibility modifier — toggle the wrapped component on/off with `display`.
 * Unlike Opacity or Timing this removes the wrapper from layout entirely
 * when hidden, which is useful for soloing/muting components during
 * editing and for unconditional-off overrides in presets.
 */
export const visibilityModifier: ModifierDefinition<VisibilityModifierOptions> = {
  id: "visibility",
  name: "Visibility",
  description: "On/off toggle — hides via `display: none`.",
  options: [
    {
      type: "boolean",
      id: "visible",
      label: "Visible",
      defaultValue: true
    }
  ],
  defaultOptions: DEFAULTS,
  apply: ({ element, options }) => {
    element.style.display = options.visible ? "" : "none";
  }
};
