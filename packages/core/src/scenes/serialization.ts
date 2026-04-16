import { SCENE_FILE_VERSION } from "../constants";
import type { ModifierInstance } from "@lyric-video-maker/plugin-base";
import type {
  SceneComponentDefinition,
  SceneComponentInstance,
  SceneDefinition,
  SceneFileData,
  SerializedSceneComponentDefinition,
  SerializedSceneDefinition
} from "../types/scene-component";

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
      modifiers: (component.modifiers ?? []).map((modifier) => ({
        ...modifier,
        options: { ...modifier.options }
      })),
      options: { ...component.options }
    }))
  };
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
    source:
      sceneRecord.source === "built-in"
        ? "built-in"
        : sceneRecord.source === "plugin"
          ? "plugin"
          : "user",
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
    modifiers: parseModifiers(candidate.modifiers),
    options: asRecord(candidate.options)
  };
}

function parseModifiers(raw: unknown): ModifierInstance[] {
  if (!Array.isArray(raw)) return [];
  const out: ModifierInstance[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as Partial<ModifierInstance>;
    if (!candidate.id || !candidate.modifierId) continue;
    out.push({
      id: String(candidate.id),
      modifierId: String(candidate.modifierId),
      enabled: candidate.enabled !== false,
      options: asRecord(candidate.options)
    });
  }
  return out;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}
