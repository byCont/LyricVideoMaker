import { existsSync } from "node:fs";
import type { BrowserWindow } from "electron";
import {
  createRenderJob,
  type LyricCue,
  type ModifierDefinition,
  type RenderHistoryEntry,
  type RenderProgressEvent,
  type SceneComponentDefinition
} from "@lyric-video-maker/core";
import { renderLyricVideo } from "@lyric-video-maker/renderer";
import type { StartRenderRequest } from "../../src/electron-api";
import type { RenderHistory } from "./render-history";

export type RenderJob = ReturnType<typeof createRenderJob>;

export interface AbortRegistry {
  set(jobId: string, controller: AbortController): void;
  get(jobId: string): AbortController | undefined;
  delete(jobId: string): void;
}

export function createAbortRegistry(): AbortRegistry {
  const controllers = new Map<string, AbortController>();
  return {
    set(jobId, controller) {
      controllers.set(jobId, controller);
    },
    get(jobId) {
      return controllers.get(jobId);
    },
    delete(jobId) {
      controllers.delete(jobId);
    }
  };
}

export interface BuildRenderJobOptions {
  request: StartRenderRequest;
  componentDefinitions: SceneComponentDefinition<Record<string, unknown>>[];
  modifierDefinitions: ModifierDefinition<Record<string, unknown>>[];
  cues: LyricCue[];
  durationMs: number;
  isPluginAssetAccessible?: (pluginId: string, relativePath: string) => boolean;
}

export function buildRenderJob({
  request,
  componentDefinitions,
  modifierDefinitions,
  cues,
  durationMs,
  isPluginAssetAccessible
}: BuildRenderJobOptions): RenderJob {
  return createRenderJob({
    audioPath: request.audioPath,
    subtitlePath: request.subtitlePath,
    outputPath: request.outputPath,
    scene: request.scene,
    componentDefinitions,
    modifierDefinitions,
    cues,
    durationMs,
    video: request.video,
    render: request.render,
    validationContext: {
      isFileAccessible: existsSync,
      isPluginAssetAccessible
    }
  });
}

export function buildInitialRenderHistoryEntry(job: RenderJob): RenderHistoryEntry {
  return {
    id: job.id,
    sceneId: job.sceneId,
    sceneName: job.sceneName,
    outputPath: job.outputPath,
    createdAt: job.createdAt,
    status: "queued",
    progress: 0,
    message: "Queued",
    logs: []
  };
}

export interface RunRenderJobDeps {
  job: RenderJob;
  componentDefinitions: SceneComponentDefinition<Record<string, unknown>>[];
  pluginBundleSources?: string[];
  controller: AbortController;
  renderHistory: RenderHistory;
  abortRegistry: AbortRegistry;
  fontCacheDir?: string;
  resolvePluginAsset?: (uri: string) => string | null;
  getMainWindow(): BrowserWindow | null;
}

export async function runRenderJob({
  job,
  componentDefinitions,
  pluginBundleSources,
  controller,
  renderHistory,
  abortRegistry,
  fontCacheDir,
  resolvePluginAsset,
  getMainWindow
}: RunRenderJobDeps) {
  try {
    await renderLyricVideo({
      job,
      componentDefinitions,
      pluginBundleSources,
      signal: controller.signal,
      fontCacheDir,
      resolvePluginAsset,
      onProgress: (event) => handleProgress({ job, event, renderHistory, getMainWindow })
    });
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }

    handleProgress({
      job,
      event: {
        jobId: job.id,
        status: "failed",
        progress: 0,
        message: "Render failed",
        error: error instanceof Error ? error.message : String(error)
      },
      renderHistory,
      getMainWindow
    });
  } finally {
    abortRegistry.delete(job.id);
  }
}

interface HandleProgressDeps {
  job: RenderJob;
  event: RenderProgressEvent;
  renderHistory: RenderHistory;
  getMainWindow(): BrowserWindow | null;
}

const MAX_RETAINED_LOG_ENTRIES = 500;

function handleProgress({ job, event, renderHistory, getMainWindow }: HandleProgressDeps) {
  const current = renderHistory.get(job.id);
  let nextLogs = current?.logs;
  if (event.logEntry) {
    nextLogs = current?.logs ?? [];
    nextLogs.push(event.logEntry);
    if (nextLogs.length > MAX_RETAINED_LOG_ENTRIES) {
      nextLogs.splice(0, nextLogs.length - MAX_RETAINED_LOG_ENTRIES);
    }
  }
  const hasFiniteProgress = Number.isFinite(event.progress);
  const entry: RenderHistoryEntry = {
    id: job.id,
    sceneId: job.sceneId,
    sceneName: job.sceneName,
    outputPath: job.outputPath,
    createdAt: job.createdAt,
    status: hasFiniteProgress ? event.status : current?.status ?? event.status,
    progress: hasFiniteProgress ? event.progress : current?.progress ?? 0,
    message:
      event.logEntry && !hasFiniteProgress ? current?.message ?? event.message : event.message,
    etaMs: hasFiniteProgress ? event.etaMs : current?.etaMs,
    renderFps: hasFiniteProgress ? event.renderFps : current?.renderFps,
    error: event.error ?? current?.error,
    logs: nextLogs
  };

  renderHistory.upsert(entry);

  getMainWindow()?.webContents.send("render:progress", event);
}
