import { dialog, ipcMain } from "electron";
import type { SerializedSceneDefinition } from "@lyric-video-maker/core";
import {
  deleteUserScene,
  exportSceneToFile,
  readSceneFile,
  saveUserScene
} from "../services/scene-library";
import type { IpcDeps } from "./register-ipc-handlers";

export function registerSceneHandlers({
  getMainWindow,
  getUserDataPath,
  sceneCatalog
}: IpcDeps) {
  ipcMain.handle("scene:save", async (_event, scene: SerializedSceneDefinition) => {
    const saved = await saveUserScene(getUserDataPath(), scene);
    sceneCatalog.upsert(saved);
    return saved;
  });

  ipcMain.handle("scene:delete", async (_event, sceneId: string) => {
    await deleteUserScene(getUserDataPath(), sceneId);
    sceneCatalog.remove(sceneId);
  });

  ipcMain.handle("scene:import", async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      return null;
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [{ name: "Scene JSON", extensions: ["json"] }]
    });

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }

    return await readSceneFile(result.filePaths[0]);
  });

  ipcMain.handle("scene:export", async (_event, scene: SerializedSceneDefinition) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      return null;
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${scene.name || "scene"}.json`,
      filters: [{ name: "Scene JSON", extensions: ["json"] }]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    await exportSceneToFile(scene, result.filePath);
    return result.filePath;
  });
}
