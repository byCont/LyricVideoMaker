import {
  GOOGLE_FONT_FAMILIES,
  serializeSceneComponentDefinition,
  serializeSceneDefinition
} from "@lyric-video-maker/core";
import { builtInSceneComponents, builtInScenes } from "@lyric-video-maker/scene-registry";
import type { AppBootstrapData } from "../../src/electron-api";
import type { FfmpegAvailability } from "../ipc/register-ipc-handlers";
import type { LayoutPreferencesStore } from "./layout-preferences";
import type { PluginCatalog } from "./plugin-catalog";
import type { RenderHistory } from "./render-history";
import type { SceneCatalog } from "./scene-catalog";

export interface CreateBootstrapDataDeps {
  renderHistory: RenderHistory;
  sceneCatalog: SceneCatalog;
  pluginCatalog: PluginCatalog;
  layoutPreferencesStore: LayoutPreferencesStore;
  previewProfilerEnabled: boolean;
  ffmpegAvailability: FfmpegAvailability;
}

export function createBootstrapData({
  renderHistory,
  sceneCatalog,
  pluginCatalog,
  layoutPreferencesStore,
  previewProfilerEnabled,
  ffmpegAvailability
}: CreateBootstrapDataDeps): AppBootstrapData {
  const components = [...builtInSceneComponents, ...pluginCatalog.components()];
  const scenes = [
    ...builtInScenes.map((scene) => serializeSceneDefinition(scene)),
    ...pluginCatalog.scenes().map((scene) => serializeSceneDefinition(scene)),
    ...sceneCatalog.list().map((scene) => serializeSceneDefinition(scene))
  ];

  return {
    scenes,
    components: components.map((component) => serializeSceneComponentDefinition(component)),
    plugins: pluginCatalog.list(),
    fonts: [...GOOGLE_FONT_FAMILIES],
    history: renderHistory.list(),
    layoutPreferences: {
      panes: layoutPreferencesStore.get().panes
    },
    previewProfilerEnabled,
    ffmpegAvailable: ffmpegAvailability.isAvailable()
  };
}
