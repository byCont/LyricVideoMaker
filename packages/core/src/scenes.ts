import {
  DEFAULT_VIDEO_FPS,
  DEFAULT_VIDEO_HEIGHT,
  DEFAULT_VIDEO_WIDTH,
  SUPPORTED_FONT_FAMILIES
} from "./constants";
import { createLyricRuntime, durationMsToFrameCount } from "./timeline";
import type {
  CreateRenderJobInput,
  RenderJob,
  SceneDefinition,
  SceneOptionField,
  SceneValidationContext,
  SerializedSceneDefinition
} from "./types";

export function serializeSceneDefinition<TOptions>(
  scene: SceneDefinition<TOptions>
): SerializedSceneDefinition {
  return {
    id: scene.id,
    name: scene.name,
    description: scene.description,
    options: scene.options,
    defaultOptions: asRecord(scene.defaultOptions)
  };
}

export function validateSceneOptions<TOptions>(
  scene: SceneDefinition<TOptions>,
  rawOptions: unknown,
  context: SceneValidationContext = {}
): TOptions {
  if (scene.validate) {
    return scene.validate(rawOptions);
  }

  const source =
    rawOptions && typeof rawOptions === "object" ? (rawOptions as Record<string, unknown>) : {};
  const merged = { ...asRecord(scene.defaultOptions) };

  for (const field of scene.options) {
    const rawValue = source[field.id];
    merged[field.id] = validateField(field, rawValue, merged[field.id], context);
  }

  return merged as TOptions;
}

export function createRenderJob<TOptions>({
  audioPath,
  subtitlePath,
  outputPath,
  scene,
  rawOptions,
  cues,
  durationMs,
  createdAt = new Date(),
  video,
  validationContext
}: CreateRenderJobInput<TOptions>): RenderJob {
  const fps = video?.fps ?? DEFAULT_VIDEO_FPS;
  const width = video?.width ?? DEFAULT_VIDEO_WIDTH;
  const height = video?.height ?? DEFAULT_VIDEO_HEIGHT;
  const validatedOptions = validateSceneOptions(scene, rawOptions, validationContext);

  return {
    id: `job-${createdAt.getTime()}`,
    audioPath,
    subtitlePath,
    outputPath,
    sceneId: scene.id,
    options: asRecord(validatedOptions),
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
