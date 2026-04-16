import type { ModifierDefinition } from "@lyric-video-maker/plugin-base";
import { opacityModifier } from "./opacity";
import { timingModifier } from "./timing";
import { transformModifier } from "./transform";
import { visibilityModifier } from "./visibility";

export { opacityModifier } from "./opacity";
export { timingModifier } from "./timing";
export { transformModifier } from "./transform";
export { visibilityModifier } from "./visibility";

export const builtInModifiers: ModifierDefinition<Record<string, unknown>>[] = [
  transformModifier as unknown as ModifierDefinition<Record<string, unknown>>,
  timingModifier as unknown as ModifierDefinition<Record<string, unknown>>,
  opacityModifier as unknown as ModifierDefinition<Record<string, unknown>>,
  visibilityModifier as unknown as ModifierDefinition<Record<string, unknown>>
];

export function getModifierDefinition(
  modifierId: string
): ModifierDefinition<Record<string, unknown>> | undefined {
  return builtInModifiers.find((def) => def.id === modifierId);
}
