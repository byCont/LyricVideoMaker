import type { ModifierDefinition } from "@lyric-video-maker/plugin-base";

export interface OpacityModifierOptions {
  /** Percent 0..100. */
  value: number;
}

const DEFAULTS: OpacityModifierOptions = {
  value: 100
};

/**
 * Opacity modifier — a constant opacity multiplier applied to its own
 * wrapper. Chains with other opacity-affecting modifiers through CSS
 * inheritance (each wrapper's opacity compounds multiplicatively).
 */
export const opacityModifier: ModifierDefinition<OpacityModifierOptions> = {
  id: "opacity",
  name: "Opacity",
  description: "Constant opacity multiplier.",
  options: [
    {
      type: "number",
      id: "value",
      label: "Opacity",
      defaultValue: 100,
      min: 0,
      max: 100,
      step: 1
    }
  ],
  defaultOptions: DEFAULTS,
  apply: ({ element, options }) => {
    const clamped = Math.max(0, Math.min(100, options.value));
    element.style.opacity = String(clamped / 100);
  }
};
