import { contextBridge, ipcRenderer } from "electron";
import type { ElectronApi } from "../src/electron-api";

const api: ElectronApi = {
  getBootstrapData: () => ipcRenderer.invoke("app:get-bootstrap-data"),
  pickPath: (kind, suggestedName) => ipcRenderer.invoke("dialog:pick-path", { kind, suggestedName }),
  startRender: (request) => ipcRenderer.invoke("render:start", request),
  renderPreviewFrame: (request) => ipcRenderer.invoke("preview:render-frame", request),
  saveScene: (scene) => ipcRenderer.invoke("scene:save", scene),
  deleteScene: (sceneId) => ipcRenderer.invoke("scene:delete", sceneId),
  importScene: () => ipcRenderer.invoke("scene:import"),
  exportScene: (scene) => ipcRenderer.invoke("scene:export", scene),
  disposePreview: () => ipcRenderer.invoke("preview:dispose"),
  cancelRender: (jobId) => ipcRenderer.invoke("render:cancel", jobId),
  onRenderProgress: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: Parameters<typeof callback>[0]) => {
      callback(payload);
    };

    ipcRenderer.on("render:progress", listener);

    return () => {
      ipcRenderer.removeListener("render:progress", listener);
    };
  }
};

contextBridge.exposeInMainWorld("lyricVideoApp", api);
