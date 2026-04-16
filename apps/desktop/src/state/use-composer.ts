import { useCallback, useState } from "react";
import type {
  ModifierInstance,
  RenderEncoding,
  RenderQuality,
  SceneComponentInstance,
  SerializedModifierDefinition,
  SerializedSceneComponentDefinition,
  SerializedSceneDefinition
} from "@lyric-video-maker/core";
import type { ComposerState } from "./composer-types";
import {
  cloneComponent,
  cloneScene,
  createInstanceId,
  createSceneComponentInstance,
  emptyComposerState,
  upsertScene
} from "../lib/composer-helpers";
import { FPS_PRESETS, VIDEO_SIZE_PRESETS } from "../lib/video-presets";
import { lyricVideoApp } from "../ipc/lyric-video-app";
import type { AppBootstrapData } from "../electron-api";
import type { WorkspaceSelection } from "./workspace-types";

export interface ComposerActions {
  composer: ComposerState;
  setComposer: React.Dispatch<React.SetStateAction<ComposerState>>;
  setAudioPath(path: string): void;
  setSubtitlePath(path: string): void;
  setOutputPath(path: string): void;
  setSceneName(name: string): void;
  setSceneDescription(description: string): void;
  applyVideoSizePresetId(presetId: string): void;
  applyFpsPresetId(presetId: string): void;
  setVideoWidth(value: number): void;
  setVideoHeight(value: number): void;
  setVideoFps(value: number): void;
  setRenderThreads(value: number): void;
  setRenderEncoding(value: RenderEncoding): void;
  setRenderQuality(value: RenderQuality): void;
  selectScene(scenes: SerializedSceneDefinition[], sceneId: string): void;
  mergeSceneComponents(scenes: SerializedSceneDefinition[], sceneId: string): void;
  saveScene(): Promise<void>;
  saveSceneAsNew(): Promise<void>;
  deleteScene(scenes: SerializedSceneDefinition[]): Promise<void>;
  importScene(): Promise<void>;
  exportScene(): Promise<void>;
  addComponent(component: SerializedSceneComponentDefinition): void;
  updateComponent(
    instanceId: string,
    updater: (component: SceneComponentInstance) => SceneComponentInstance
  ): void;
  moveComponent(instanceId: string, direction: -1 | 1): void;
  duplicateComponent(instanceId: string): void;
  removeComponent(instanceId: string): void;
  addModifier(instanceId: string, modifier: SerializedModifierDefinition): void;
  removeModifier(instanceId: string, modifierId: string): void;
  moveModifier(instanceId: string, modifierId: string, direction: -1 | 1): void;
  toggleModifierEnabled(instanceId: string, modifierId: string): void;
  updateModifierOption(
    instanceId: string,
    modifierId: string,
    optionId: string,
    value: unknown
  ): void;
}

/**
 * Owns the composer state plus every scene and component mutation. Side
 * effects on `bootstrap` (after save/delete/import) and on the workspace
 * selection (after scene/component changes) are routed through the
 * `setBootstrap` and `setSelection` setters provided by the host.
 */
export function useComposer(
  setBootstrap: React.Dispatch<React.SetStateAction<AppBootstrapData | null>>,
  setSelection: React.Dispatch<React.SetStateAction<WorkspaceSelection>>
): ComposerActions {
  const [composer, setComposer] = useState<ComposerState>(emptyComposerState);

  const setAudioPath = useCallback((path: string) => {
    setComposer((current) => ({ ...current, audioPath: path }));
  }, []);

  const setSubtitlePath = useCallback((path: string) => {
    setComposer((current) => ({ ...current, subtitlePath: path }));
  }, []);

  const setOutputPath = useCallback((path: string) => {
    setComposer((current) => ({ ...current, outputPath: path }));
  }, []);

  const setSceneName = useCallback((name: string) => {
    setComposer((current) => ({
      ...current,
      scene: current.scene ? { ...current.scene, name } : current.scene
    }));
  }, []);

  const setSceneDescription = useCallback((description: string) => {
    setComposer((current) => ({
      ...current,
      scene: current.scene ? { ...current.scene, description } : current.scene
    }));
  }, []);

  const applyVideoSizePresetId = useCallback((presetId: string) => {
    if (presetId === "custom") {
      return;
    }
    const preset = VIDEO_SIZE_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }
    setComposer((current) => ({
      ...current,
      video: { ...current.video, width: preset.width, height: preset.height }
    }));
  }, []);

  const applyFpsPresetId = useCallback((presetId: string) => {
    if (presetId === "custom") {
      return;
    }
    const preset = FPS_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }
    setComposer((current) => ({
      ...current,
      video: { ...current.video, fps: preset.fps }
    }));
  }, []);

  const setVideoWidth = useCallback((value: number) => {
    setComposer((current) => ({ ...current, video: { ...current.video, width: value } }));
  }, []);

  const setVideoHeight = useCallback((value: number) => {
    setComposer((current) => ({ ...current, video: { ...current.video, height: value } }));
  }, []);

  const setVideoFps = useCallback((value: number) => {
    setComposer((current) => ({ ...current, video: { ...current.video, fps: value } }));
  }, []);

  const setRenderThreads = useCallback((value: number) => {
    setComposer((current) => ({
      ...current,
      render: { ...current.render, threads: Math.max(1, Math.floor(value || 1)) }
    }));
  }, []);

  const setRenderEncoding = useCallback((value: RenderEncoding) => {
    setComposer((current) => ({
      ...current,
      render: { ...current.render, encoding: value }
    }));
  }, []);

  const setRenderQuality = useCallback((value: RenderQuality) => {
    setComposer((current) => ({
      ...current,
      render: { ...current.render, quality: value }
    }));
  }, []);

  const selectScene = useCallback(
    (scenes: SerializedSceneDefinition[], sceneId: string) => {
      const nextScene = scenes.find((scene) => scene.id === sceneId);
      if (!nextScene) {
        return;
      }
      setComposer((current) => ({ ...current, scene: cloneScene(nextScene) }));
      setSelection({ type: "scene" });
    },
    [setSelection]
  );

  const mergeSceneComponents = useCallback(
    (scenes: SerializedSceneDefinition[], sceneId: string) => {
      const sourceScene = scenes.find((scene) => scene.id === sceneId);
      if (!sourceScene) {
        return;
      }
      const clonedComponents = sourceScene.components.map((component) => ({
        ...cloneComponent(component),
        id: createInstanceId(component.componentId)
      }));
      setComposer((current) => ({
        ...current,
        scene: current.scene
          ? {
              ...current.scene,
              components: [...current.scene.components, ...clonedComponents]
            }
          : cloneScene(sourceScene)
      }));
    },
    []
  );

  const saveScene = useCallback(async () => {
    if (!composer.scene) {
      return;
    }
    const saved = await lyricVideoApp.saveScene(composer.scene);
    setBootstrap((current) =>
      current ? { ...current, scenes: upsertScene(current.scenes, saved) } : current
    );
    setComposer((current) => ({ ...current, scene: cloneScene(saved) }));
  }, [composer.scene, setBootstrap]);

  const saveSceneAsNew = useCallback(async () => {
    if (!composer.scene) {
      return;
    }
    const clone: SerializedSceneDefinition = {
      ...composer.scene,
      id: "",
      source: "built-in",
      filePath: undefined
    };
    const saved = await lyricVideoApp.saveScene(clone);
    setBootstrap((current) =>
      current ? { ...current, scenes: upsertScene(current.scenes, saved) } : current
    );
    setComposer((current) => ({ ...current, scene: cloneScene(saved) }));
  }, [composer.scene, setBootstrap]);

  const deleteScene = useCallback(
    async (scenes: SerializedSceneDefinition[]) => {
      if (!composer.scene || composer.scene.source !== "user") {
        return;
      }
      const deletedId = composer.scene.id;
      await lyricVideoApp.deleteScene(deletedId);
      const nextScenes = scenes.filter((scene) => scene.id !== deletedId);
      setBootstrap((current) => (current ? { ...current, scenes: nextScenes } : current));
      setComposer((current) => ({
        ...current,
        scene: nextScenes[0] ? cloneScene(nextScenes[0]) : null
      }));
      setSelection({ type: "scene" });
    },
    [composer.scene, setBootstrap, setSelection]
  );

  const importScene = useCallback(async () => {
    const imported = await lyricVideoApp.importScene();
    if (!imported) {
      return;
    }
    const workspace: SerializedSceneDefinition = {
      ...imported,
      id: "",
      source: "built-in",
      filePath: undefined
    };
    setComposer((current) => ({ ...current, scene: cloneScene(workspace) }));
    setSelection({ type: "scene" });
  }, [setSelection]);

  const exportScene = useCallback(async () => {
    if (composer.scene) {
      await lyricVideoApp.exportScene(composer.scene);
    }
  }, [composer.scene]);

  const addComponent = useCallback(
    (component: SerializedSceneComponentDefinition) => {
      const nextInstance = createSceneComponentInstance(component);
      setComposer((current) => ({
        ...current,
        scene: current.scene
          ? {
              ...current.scene,
              components: [...current.scene.components, nextInstance]
            }
          : current.scene
      }));
      setSelection({ type: "component", instanceId: nextInstance.id });
    },
    [setSelection]
  );

  const updateComponent = useCallback(
    (
      instanceId: string,
      updater: (component: SceneComponentInstance) => SceneComponentInstance
    ) => {
      setComposer((current) => ({
        ...current,
        scene: current.scene
          ? {
              ...current.scene,
              components: current.scene.components.map((component) =>
                component.id === instanceId ? updater(component) : component
              )
            }
          : current.scene
      }));
    },
    []
  );

  const moveComponent = useCallback((instanceId: string, direction: -1 | 1) => {
    setComposer((current) => {
      if (!current.scene) {
        return current;
      }
      const index = current.scene.components.findIndex((component) => component.id === instanceId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.scene.components.length) {
        return current;
      }
      const nextComponents = [...current.scene.components];
      const [component] = nextComponents.splice(index, 1);
      nextComponents.splice(nextIndex, 0, component);
      return {
        ...current,
        scene: { ...current.scene, components: nextComponents }
      };
    });
  }, []);

  const duplicateComponent = useCallback(
    (instanceId: string) => {
      setComposer((current) => {
        if (!current.scene) {
          return current;
        }
        const component = current.scene.components.find((entry) => entry.id === instanceId);
        if (!component) {
          return current;
        }
        const duplicated = {
          ...cloneComponent(component),
          id: createInstanceId(component.componentId)
        };
        setSelection({ type: "component", instanceId: duplicated.id });
        return {
          ...current,
          scene: { ...current.scene, components: [...current.scene.components, duplicated] }
        };
      });
    },
    [setSelection]
  );

  const removeComponent = useCallback(
    (instanceId: string) => {
      setComposer((current) => ({
        ...current,
        scene: current.scene
          ? {
              ...current.scene,
              components: current.scene.components.filter(
                (component) => component.id !== instanceId
              )
            }
          : current.scene
      }));
      setSelection((current) =>
        current.type === "component" && current.instanceId === instanceId
          ? { type: "scene" }
          : current
      );
    },
    [setSelection]
  );

  const patchComponentModifiers = useCallback(
    (
      instanceId: string,
      mapper: (modifiers: ModifierInstance[]) => ModifierInstance[]
    ) => {
      updateComponent(instanceId, (component) => ({
        ...component,
        modifiers: mapper(component.modifiers ?? [])
      }));
    },
    [updateComponent]
  );

  const addModifier = useCallback(
    (instanceId: string, modifier: SerializedModifierDefinition) => {
      patchComponentModifiers(instanceId, (modifiers) => [
        ...modifiers,
        {
          id: createInstanceId(`mod-${modifier.id}`),
          modifierId: modifier.id,
          enabled: true,
          options: structuredClone(modifier.defaultOptions)
        }
      ]);
    },
    [patchComponentModifiers]
  );

  const removeModifier = useCallback(
    (instanceId: string, modifierId: string) => {
      patchComponentModifiers(instanceId, (modifiers) =>
        modifiers.filter((modifier) => modifier.id !== modifierId)
      );
    },
    [patchComponentModifiers]
  );

  const moveModifier = useCallback(
    (instanceId: string, modifierId: string, direction: -1 | 1) => {
      patchComponentModifiers(instanceId, (modifiers) => {
        const index = modifiers.findIndex((modifier) => modifier.id === modifierId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= modifiers.length) {
          return modifiers;
        }
        const next = [...modifiers];
        const [item] = next.splice(index, 1);
        next.splice(nextIndex, 0, item);
        return next;
      });
    },
    [patchComponentModifiers]
  );

  const toggleModifierEnabled = useCallback(
    (instanceId: string, modifierId: string) => {
      patchComponentModifiers(instanceId, (modifiers) =>
        modifiers.map((modifier) =>
          modifier.id === modifierId ? { ...modifier, enabled: !modifier.enabled } : modifier
        )
      );
    },
    [patchComponentModifiers]
  );

  const updateModifierOption = useCallback(
    (instanceId: string, modifierId: string, optionId: string, value: unknown) => {
      patchComponentModifiers(instanceId, (modifiers) =>
        modifiers.map((modifier) =>
          modifier.id === modifierId
            ? { ...modifier, options: { ...modifier.options, [optionId]: value } }
            : modifier
        )
      );
    },
    [patchComponentModifiers]
  );

  return {
    composer,
    setComposer,
    setAudioPath,
    setSubtitlePath,
    setOutputPath,
    setSceneName,
    setSceneDescription,
    applyVideoSizePresetId,
    applyFpsPresetId,
    setVideoWidth,
    setVideoHeight,
    setVideoFps,
    setRenderThreads,
    setRenderEncoding,
    setRenderQuality,
    selectScene,
    mergeSceneComponents,
    saveScene,
    saveSceneAsNew,
    deleteScene,
    importScene,
    exportScene,
    addComponent,
    updateComponent,
    moveComponent,
    duplicateComponent,
    removeComponent,
    addModifier,
    removeModifier,
    moveModifier,
    toggleModifierEnabled,
    updateModifierOption
  };
}
