import { ipcMain } from "electron";
import { createBootstrapData } from "../services/bootstrap-data";
import type { IpcDeps } from "./register-ipc-handlers";

export function registerBootstrapHandlers({
  renderHistory,
  sceneCatalog,
  pluginCatalog,
  layoutPreferencesStore,
  previewProfilerEnabled,
  ffmpegAvailability
}: IpcDeps) {
  ipcMain.handle("app:get-bootstrap-data", () =>
    createBootstrapData({
      renderHistory,
      sceneCatalog,
      pluginCatalog,
      layoutPreferencesStore,
      previewProfilerEnabled,
      ffmpegAvailability
    })
  );
}
