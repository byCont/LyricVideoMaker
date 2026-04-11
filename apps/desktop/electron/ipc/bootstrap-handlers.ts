import { ipcMain } from "electron";
import {
  GOOGLE_FONT_FAMILIES,
  serializeSceneComponentDefinition,
  serializeSceneDefinition
} from "@lyric-video-maker/core";
import { builtInSceneComponents, builtInScenes } from "@lyric-video-maker/scene-registry";
import type { IpcDeps } from "./register-ipc-handlers";

export function registerBootstrapHandlers({
  renderHistory,
  sceneCatalog,
  layoutPreferencesStore,
  previewProfilerEnabled,
  ffmpegAvailability
}: IpcDeps) {
  ipcMain.handle("app:get-bootstrap-data", () => ({
    scenes: [
      ...builtInScenes.map((scene) => serializeSceneDefinition(scene)),
      ...sceneCatalog.list().map((scene) => serializeSceneDefinition(scene))
    ],
    components: builtInSceneComponents.map((component) =>
      serializeSceneComponentDefinition(component)
    ),
    fonts: [...GOOGLE_FONT_FAMILIES],
    history: renderHistory.list(),
    layoutPreferences: {
      panes: layoutPreferencesStore.get().panes
    },
    previewProfilerEnabled,
    ffmpegAvailable: ffmpegAvailability.isAvailable()
  }));
}
