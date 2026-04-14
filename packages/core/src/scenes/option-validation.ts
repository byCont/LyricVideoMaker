import { validateGoogleFontFamilyName } from "../fonts";
import { isPluginAssetUri, parsePluginAssetUri } from "../plugin-assets";
import type {
  SceneComponentDefinition,
  SerializedSceneDefinition,
  ValidatedSceneComponentInstance
} from "../types/scene-component";
import type {
  SceneOptionCategory,
  SceneOptionEntry,
  SceneOptionField,
  SceneValidationContext
} from "../types/scene-options";

export function validateSceneOptions<TOptions>(
  component: SceneComponentDefinition<TOptions>,
  rawOptions: unknown,
  context: SceneValidationContext = {}
): TOptions {
  if (component.validate) {
    return component.validate(rawOptions);
  }

  const source =
    rawOptions && typeof rawOptions === "object" ? (rawOptions as Record<string, unknown>) : {};
  const merged = { ...asRecord(component.defaultOptions) };

  for (const field of getSceneOptionFields(component.options)) {
    const rawValue = source[field.id];
    merged[field.id] = validateField(field, rawValue, merged[field.id], context);
  }

  return merged as TOptions;
}

export function validateSceneComponents(
  scene: SerializedSceneDefinition,
  componentDefinitions: SceneComponentDefinition<Record<string, unknown>>[],
  context: SceneValidationContext = {}
): ValidatedSceneComponentInstance[] {
  const componentLookup = new Map(componentDefinitions.map((component) => [component.id, component]));
  const seenInstanceIds = new Set<string>();

  return scene.components.map((instance, index) => {
    if (!instance.id.trim()) {
      throw new Error(`Scene component at index ${index} is missing an instance id.`);
    }

    if (seenInstanceIds.has(instance.id)) {
      throw new Error(`Scene component instance id "${instance.id}" is duplicated.`);
    }
    seenInstanceIds.add(instance.id);

    const definition = componentLookup.get(instance.componentId);
    if (!definition) {
      throw new Error(`Unknown scene component "${instance.componentId}".`);
    }

    return {
      id: instance.id,
      componentId: instance.componentId,
      componentName: definition.name,
      enabled: instance.enabled !== false,
      options: asRecord(validateSceneOptions(definition, instance.options, context))
    } satisfies ValidatedSceneComponentInstance;
  });
}

export function getSceneOptionFields(options: SceneOptionEntry[]): SceneOptionField[] {
  return options.flatMap((option) => (isSceneOptionCategory(option) ? option.options : [option]));
}

export function isSceneOptionCategory(option: SceneOptionEntry): option is SceneOptionCategory {
  return option.type === "category";
}

function validateField(
  field: SceneOptionField,
  rawValue: unknown,
  defaultValue: unknown,
  context: SceneValidationContext
): unknown {
  if (rawValue === undefined || rawValue === null || (rawValue === "" && field.type !== "font")) {
    if ((field.type === "image" || field.type === "video") && field.required) {
      throw new Error(`"${field.label}" is required.`);
    }

    if (field.type === "image-list") {
      if (field.required) {
        throw new Error(`"${field.label}" requires at least one image.`);
      }
      return [];
    }

    return getFieldDefault(field, defaultValue);
  }

  switch (field.type) {
    case "boolean": {
      if (typeof rawValue === "boolean") {
        return rawValue;
      }

      if (typeof rawValue === "string") {
        if (rawValue === "true") {
          return true;
        }
        if (rawValue === "false") {
          return false;
        }
      }

      throw new Error(`"${field.label}" must be true or false.`);
    }
    case "number": {
      const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
      if (Number.isNaN(numericValue)) {
        throw new Error(`"${field.label}" must be a number.`);
      }
      if (field.min !== undefined && numericValue < field.min) {
        throw new Error(`"${field.label}" must be at least ${field.min}.`);
      }
      if (field.max !== undefined && numericValue > field.max) {
        throw new Error(`"${field.label}" must be at most ${field.max}.`);
      }
      return numericValue;
    }
    case "text":
    case "color": {
      return String(rawValue);
    }
    case "font": {
      return validateGoogleFontFamilyName(rawValue);
    }
    case "image":
    case "video": {
      return validateFileField(field, rawValue, context);
    }
    case "image-list": {
      if (!Array.isArray(rawValue)) {
        if (field.required) {
          throw new Error(`"${field.label}" requires at least one image.`);
        }
        return [];
      }
      const paths = rawValue.filter(
        (v): v is string => typeof v === "string" && v.trim() !== ""
      );
      if (field.required && paths.length === 0) {
        throw new Error(`"${field.label}" requires at least one image.`);
      }
      for (const p of paths) {
        if (isPluginAssetUri(p)) {
          const parsed = parsePluginAssetUri(p);
          if (!parsed) {
            throw new Error(`"${field.label}" has a malformed plugin asset reference.`);
          }
          if (
            context.isPluginAssetAccessible &&
            !context.isPluginAssetAccessible(parsed.pluginId, parsed.relativePath)
          ) {
            throw new Error(`"${field.label}" contains a plugin asset that is not readable.`);
          }
        } else if (context.isFileAccessible && !context.isFileAccessible(p)) {
          throw new Error(`"${field.label}" contains a path that is not readable: ${p}`);
        }
      }
      return paths;
    }
    case "select": {
      const stringValue = String(rawValue);
      if (!field.options.some((option) => option.value === stringValue)) {
        throw new Error(`"${stringValue}" is not a valid value for "${field.label}".`);
      }
      return stringValue;
    }
    default: {
      return rawValue;
    }
  }
}

/**
 * Shared file-accessibility validation used for both image and video fields.
 * Enforces the required flag and verifies the referenced file is accessible
 * via the validation context helper. Single implementation — image and video
 * must use the same code path (T-008, cavekit-video-field-type R2).
 */
function validateFileField(
  field: Extract<SceneOptionField, { type: "image" | "video" }>,
  rawValue: unknown,
  context: SceneValidationContext
): string {
  const path = String(rawValue);
  if (field.required && !path.trim()) {
    throw new Error(`"${field.label}" is required.`);
  }
  if (path && isPluginAssetUri(path)) {
    const parsed = parsePluginAssetUri(path);
    if (!parsed) {
      throw new Error(`"${field.label}" has a malformed plugin asset reference.`);
    }
    if (
      context.isPluginAssetAccessible &&
      !context.isPluginAssetAccessible(parsed.pluginId, parsed.relativePath)
    ) {
      throw new Error(`"${field.label}" does not point to a readable plugin asset.`);
    }
    return path;
  }
  if (context.isFileAccessible && path && !context.isFileAccessible(path)) {
    throw new Error(`"${field.label}" does not point to a readable file.`);
  }
  return path;
}

function getFieldDefault(field: SceneOptionField, fallback: unknown): unknown {
  if ("defaultValue" in field && field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  return fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}
