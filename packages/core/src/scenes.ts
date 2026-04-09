import {
  DEFAULT_VIDEO_FPS,
  DEFAULT_VIDEO_HEIGHT,
  DEFAULT_VIDEO_WIDTH,
  SCENE_FILE_VERSION,
  SUPPORTED_FONT_FAMILIES
} from "./constants";
import { createLyricRuntime, durationMsToFrameCount } from "./timeline";
import type {
  CreateRenderJobInput,
  RenderJob,
  SceneComponentDefinition,
  SceneComponentInstance,
  SceneDefinition,
  SceneFileData,
  SceneOptionCategory,
  SceneOptionEntry,
  SceneOptionField,
  SceneValidationContext,
  SerializedSceneComponentDefinition,
  SerializedSceneDefinition,
  ValidatedSceneComponentInstance
} from "./types";

export function serializeSceneComponentDefinition<TOptions>(
  component: SceneComponentDefinition<TOptions>
): SerializedSceneComponentDefinition {
  return {
    id: component.id,
    name: component.name,
    description: component.description,
    options: component.options,
    defaultOptions: asRecord(component.defaultOptions)
  };
}

export function serializeSceneDefinition(scene: SceneDefinition): SerializedSceneDefinition {
  return {
    ...scene,
    components: scene.components.map((component) => ({
      ...component,
      options: { ...component.options }
    }))
  };
}

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

export function createRenderJob({
  audioPath,
  subtitlePath,
  outputPath,
  scene,
  componentDefinitions,
  cues,
  durationMs,
  createdAt = new Date(),
  video,
  validationContext
}: CreateRenderJobInput): RenderJob {
  const fps = video?.fps ?? DEFAULT_VIDEO_FPS;
  const width = video?.width ?? DEFAULT_VIDEO_WIDTH;
  const height = video?.height ?? DEFAULT_VIDEO_HEIGHT;
  const validatedComponents = validateSceneComponents(scene, componentDefinitions, validationContext);

  return {
    id: `job-${createdAt.getTime()}`,
    audioPath,
    subtitlePath,
    outputPath,
    sceneId: scene.id,
    sceneName: scene.name,
    components: validatedComponents,
    lyrics: cues,
    createdAt: createdAt.toISOString(),
    video: {
      width,
      height,
      fps,
      durationMs,
      durationInFrames: durationMsToFrameCount(durationMs, fps)
    }
  };
}

export function createSceneFrameContext(job: RenderJob, frame: number) {
  const timeMs = Math.min(job.video.durationMs, Math.round((frame / job.video.fps) * 1000));
  return {
    timeMs,
    lyrics: createLyricRuntime(job.lyrics, timeMs)
  };
}

export function getSceneOptionFields(options: SceneOptionEntry[]): SceneOptionField[] {
  return options.flatMap((option) => (isSceneOptionCategory(option) ? option.options : [option]));
}

export function isSceneOptionCategory(option: SceneOptionEntry): option is SceneOptionCategory {
  return option.type === "category";
}

export function createSceneFileData(scene: SerializedSceneDefinition): SceneFileData {
  return {
    version: SCENE_FILE_VERSION,
    scene: serializeSceneDefinition(scene)
  };
}

export function parseSceneFileData(raw: unknown): SerializedSceneDefinition {
  if (!raw || typeof raw !== "object") {
    throw new Error("Scene file is not a valid object.");
  }

  const candidate = raw as Partial<SceneFileData>;
  if (candidate.version !== SCENE_FILE_VERSION) {
    throw new Error(`Unsupported scene file version "${String(candidate.version)}".`);
  }

  const scene = candidate.scene;
  if (!scene || typeof scene !== "object") {
    throw new Error("Scene file does not contain a valid scene payload.");
  }

  const sceneRecord = scene as Partial<SerializedSceneDefinition>;
  if (!sceneRecord.id || !sceneRecord.name || !Array.isArray(sceneRecord.components)) {
    throw new Error("Scene payload is missing required fields.");
  }

  return {
    id: String(sceneRecord.id),
    name: String(sceneRecord.name),
    description: sceneRecord.description ? String(sceneRecord.description) : undefined,
    source: sceneRecord.source === "built-in" ? "built-in" : "user",
    readOnly: sceneRecord.readOnly === true,
    filePath: sceneRecord.filePath ? String(sceneRecord.filePath) : undefined,
    components: sceneRecord.components.map(parseSceneComponentInstance)
  };
}

function parseSceneComponentInstance(raw: unknown): SceneComponentInstance {
  if (!raw || typeof raw !== "object") {
    throw new Error("Scene component entry is invalid.");
  }

  const candidate = raw as Partial<SceneComponentInstance>;
  if (!candidate.id || !candidate.componentId) {
    throw new Error("Scene component entry is missing required fields.");
  }

  return {
    id: String(candidate.id),
    componentId: String(candidate.componentId),
    enabled: candidate.enabled !== false,
    options: asRecord(candidate.options)
  };
}

function validateField(
  field: SceneOptionField,
  rawValue: unknown,
  defaultValue: unknown,
  context: SceneValidationContext
): unknown {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    if (field.type === "image" && field.required) {
      throw new Error(`"${field.label}" is required.`);
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
      const fontValue = String(rawValue);
      const supportedFonts = context.supportedFonts ?? SUPPORTED_FONT_FAMILIES;
      if (!supportedFonts.includes(fontValue)) {
        throw new Error(`"${fontValue}" is not a supported font selection.`);
      }
      return fontValue;
    }
    case "image": {
      const imagePath = String(rawValue);
      if (field.required && !imagePath.trim()) {
        throw new Error(`"${field.label}" is required.`);
      }
      if (context.isFileAccessible && imagePath && !context.isFileAccessible(imagePath)) {
        throw new Error(`"${field.label}" does not point to a readable file.`);
      }
      return imagePath;
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
