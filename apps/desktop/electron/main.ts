import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import {
  SUPPORTED_FONT_FAMILIES,
  createRenderJob,
  parseSrt,
  serializeSceneDefinition,
  type RenderHistoryEntry,
  type RenderProgressEvent
} from "@lyric-video-maker/core";
import { renderLyricVideo, probeAudioDurationMs } from "@lyric-video-maker/renderer";
import { builtInScenes, getSceneDefinition } from "@lyric-video-maker/scene-registry";
import type { StartRenderRequest, FilePickKind } from "../src/electron-api";

let mainWindow: BrowserWindow | null = null;

const history = new Map<string, RenderHistoryEntry>();
const abortControllers = new Map<string, AbortController>();

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#0d1021",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function registerIpcHandlers() {
  ipcMain.handle("app:get-bootstrap-data", () => ({
    scenes: builtInScenes.map((scene) => serializeSceneDefinition(scene)),
    fonts: [...SUPPORTED_FONT_FAMILIES],
    history: getHistory()
  }));

  ipcMain.handle(
    "dialog:pick-path",
    async (_event, args: { kind: FilePickKind; suggestedName?: string }) => {
      if (args.kind === "output") {
        const result = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: args.suggestedName ?? "lyric-video.mp4",
          filters: [{ name: "MP4 Video", extensions: ["mp4"] }]
        });

        return result.canceled ? null : result.filePath;
      }

      const filters = getFileFilters(args.kind);
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ["openFile"],
        filters
      });

      return result.canceled ? null : result.filePaths[0] ?? null;
    }
  );

  ipcMain.handle("render:start", async (_event, request: StartRenderRequest) => {
    const scene = getSceneDefinition(request.sceneId);
    if (!scene) {
      throw new Error(`Unknown scene "${request.sceneId}".`);
    }

    const subtitleSource = await readFile(request.subtitlePath, "utf8");
    const cues = parseSrt(subtitleSource);
    const durationMs = await probeAudioDurationMs(request.audioPath);
    const job = createRenderJob({
      audioPath: request.audioPath,
      subtitlePath: request.subtitlePath,
      outputPath: request.outputPath,
      scene,
      rawOptions: request.options,
      cues,
      durationMs,
      validationContext: {
        isFileAccessible: existsSync
      }
    });

    const controller = new AbortController();
    abortControllers.set(job.id, controller);

    const entry: RenderHistoryEntry = {
      id: job.id,
      sceneId: job.sceneId,
      outputPath: job.outputPath,
      createdAt: job.createdAt,
      status: "queued",
      progress: 0,
      message: "Queued",
      logs: []
    };
    upsertHistory(entry);

    void runRenderJob(job, scene, controller);

    return entry;
  });

  ipcMain.handle("render:cancel", async (_event, jobId: string) => {
    abortControllers.get(jobId)?.abort();
  });
}

async function runRenderJob(
  job: ReturnType<typeof createRenderJob>,
  scene: NonNullable<ReturnType<typeof getSceneDefinition>>,
  controller: AbortController
) {
  try {
    await renderLyricVideo({
      job,
      scene,
      signal: controller.signal,
      onProgress: (event) => handleProgress(job, event)
    });
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }

    handleProgress(job, {
      jobId: job.id,
      status: "failed",
      progress: 0,
      message: "Render failed",
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    abortControllers.delete(job.id);
  }
}

function handleProgress(
  job: ReturnType<typeof createRenderJob>,
  event: RenderProgressEvent
) {
  const current = history.get(job.id);
  const nextLogs = event.logEntry ? [...(current?.logs ?? []), event.logEntry] : current?.logs;
  const hasFiniteProgress = Number.isFinite(event.progress);
  const entry: RenderHistoryEntry = {
    id: job.id,
    sceneId: job.sceneId,
    outputPath: job.outputPath,
    createdAt: job.createdAt,
    status: hasFiniteProgress ? event.status : current?.status ?? event.status,
    progress: hasFiniteProgress ? event.progress : current?.progress ?? 0,
    message: event.logEntry && !hasFiniteProgress ? current?.message ?? event.message : event.message,
    etaMs: hasFiniteProgress ? event.etaMs : current?.etaMs,
    renderFps: hasFiniteProgress ? event.renderFps : current?.renderFps,
    error: event.error ?? current?.error,
    logs: nextLogs
  };

  upsertHistory({
    ...current,
    ...entry
  });

  mainWindow?.webContents.send("render:progress", event);
}

function upsertHistory(entry: RenderHistoryEntry) {
  history.set(entry.id, entry);
}

function getHistory() {
  return [...history.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function getFileFilters(kind: FilePickKind) {
  switch (kind) {
    case "audio":
      return [{ name: "Audio Files", extensions: ["mp3"] }];
    case "subtitle":
      return [{ name: "Subtitle Files", extensions: ["srt"] }];
    case "image":
      return [{ name: "Image Files", extensions: ["png", "jpg", "jpeg", "webp"] }];
    default:
      return [];
  }
}
