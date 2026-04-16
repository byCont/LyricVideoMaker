import type {
  ModifierDefinition,
  ModifierInstance,
  SceneValidationContext,
  ValidatedModifierInstance
} from "@lyric-video-maker/plugin-base";
import { isSceneOptionCategory } from "./option-validation";
import type { SceneOptionEntry, SceneOptionField } from "../types/scene-options";

export interface SceneLoadWarning {
  level: "warn";
  message: string;
}

export interface ValidateModifiersResult {
  modifiers: ValidatedModifierInstance[];
  warnings: SceneLoadWarning[];
}

/**
 * Validate a component instance's modifier stack against a modifier
 * registry. Unknown modifier ids are dropped with a warning rather than
 * throwing so that user scenes referencing a plugin-supplied modifier
 * still load when the plugin is uninstalled.
 *
 * Duplicate modifier instance ids within one component throw — a
 * well-formed scene should never have collisions.
 */
export function validateSceneModifiers(
  componentInstanceId: string,
  rawModifiers: ModifierInstance[] | undefined,
  modifierDefinitions: ModifierDefinition<Record<string, unknown>>[],
  context: SceneValidationContext = {}
): ValidateModifiersResult {
  const warnings: SceneLoadWarning[] = [];
  if (!Array.isArray(rawModifiers) || rawModifiers.length === 0) {
    return { modifiers: [], warnings };
  }

  const lookup = new Map(modifierDefinitions.map((def) => [def.id, def]));
  const seen = new Set<string>();
  const out: ValidatedModifierInstance[] = [];

  rawModifiers.forEach((instance, index) => {
    if (!instance || typeof instance !== "object") {
      warnings.push({
        level: "warn",
        message: `Component "${componentInstanceId}" has a non-object modifier entry at index ${index} — dropped.`
      });
      return;
    }
    const modifierInstanceId = String(instance.id ?? "").trim();
    if (!modifierInstanceId) {
      warnings.push({
        level: "warn",
        message: `Component "${componentInstanceId}" has a modifier at index ${index} with no id — dropped.`
      });
      return;
    }
    if (seen.has(modifierInstanceId)) {
      throw new Error(
        `Component "${componentInstanceId}" has duplicate modifier instance id "${modifierInstanceId}".`
      );
    }
    seen.add(modifierInstanceId);

    const modifierId = String(instance.modifierId ?? "").trim();
    const definition = lookup.get(modifierId);
    if (!definition) {
      warnings.push({
        level: "warn",
        message: `Modifier "${modifierId}" not registered — dropped from component "${componentInstanceId}".`
      });
      return;
    }

    const enabled = instance.enabled !== false;
    const options = validateModifierOptions(definition, instance.options, context);

    out.push({
      id: modifierInstanceId,
      modifierId: definition.id,
      modifierName: definition.name,
      enabled,
      options: options as Record<string, unknown>
    });
  });

  return { modifiers: out, warnings };
}

export function validateModifierOptions<TOptions>(
  definition: ModifierDefinition<TOptions>,
  rawOptions: unknown,
  context: SceneValidationContext = {}
): TOptions {
  if (definition.validate) {
    return definition.validate(rawOptions);
  }

  const source =
    rawOptions && typeof rawOptions === "object"
      ? (rawOptions as Record<string, unknown>)
      : {};
  const merged: Record<string, unknown> = {
    ...asRecord(definition.defaultOptions as unknown)
  };

  for (const field of getModifierOptionFields(definition.options)) {
    merged[field.id] = coerceField(field, source[field.id], merged[field.id], context);
  }
  return merged as TOptions;
}

function getModifierOptionFields(entries: SceneOptionEntry[]): SceneOptionField[] {
  // Modifier option schemas reuse the same entry shape as component schemas,
  // including category grouping — flatten it the same way.
  return entries.flatMap((entry) => (isSceneOptionCategory(entry) ? entry.options : [entry]));
}

// Minimal field coercion mirroring option-validation's primitive path.
// Modifier fields are all primitive (number/bool/select/text/color) today —
// no file/asset fields — so we keep the coercion narrow and throw on
// obvious type mismatches.
function coerceField(
  field: SceneOptionField,
  rawValue: unknown,
  defaultValue: unknown,
  _context: SceneValidationContext
): unknown {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return "defaultValue" in field && field.defaultValue !== undefined
      ? field.defaultValue
      : defaultValue;
  }

  switch (field.type) {
    case "boolean": {
      if (typeof rawValue === "boolean") return rawValue;
      if (rawValue === "true") return true;
      if (rawValue === "false") return false;
      throw new Error(`"${field.label}" must be true or false.`);
    }
    case "number": {
      const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
      if (Number.isNaN(value)) {
        throw new Error(`"${field.label}" must be a number.`);
      }
      if (field.min !== undefined && value < field.min) return field.min;
      if (field.max !== undefined && value > field.max) return field.max;
      return value;
    }
    case "select": {
      const str = String(rawValue);
      if (!field.options.some((option) => option.value === str)) {
        throw new Error(`"${str}" is not a valid value for "${field.label}".`);
      }
      return str;
    }
    case "text":
    case "color": {
      return String(rawValue);
    }
    default:
      return rawValue;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}
