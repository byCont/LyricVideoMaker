import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { chromium, type Browser, type BrowserContext, type CDPSession, type Page, type Route } from "playwright";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  type BrowserLyricRuntime,
  createLyricRuntime,
  createLyricRuntimeCursor,
  type PreparedSceneStackData,
  type RenderJob,
  type RenderLogEntry,
  type RenderLogLevel,
  type RenderProgressEvent,
  type RenderStatus,
  type SceneAssetAccessor,
  type SceneComponentDefinition,
  type ValidatedSceneComponentInstance
} from "@lyric-video-maker/core";
import { createAudioAnalysisAccessor } from "./audio-analysis";
import {
  canRenderWithLiveDom,
  createLiveDomFramePayload,
  createLiveDomScenePayload,
  mountLiveDomScene,
  renderPageShell,
  updateLiveDomScene
} from "./live-dom";

export interface RenderLyricVideoInput {
  job: RenderJob;
  componentDefinitions: SceneComponentDefinition<Record<string, unknown>>[];
  signal?: AbortSignal;
  onProgress?: (event: RenderProgressEvent) => void;
}

type RenderProfileStage =
  | "prepare"
  | "frameState"
  | "browserUpdate"
  | "capture"
  | "queueWait"
  | "muxWrite"
  | "muxFinalize";

interface RenderProfiler {
  enabled: boolean;
  totalStartMs: number;
  stages: Record<RenderProfileStage, number>;
}

interface FrameMuxer {
  writeFrame(frame: Buffer): Promise<void>;
  finish(): Promise<void>;
  abort(): Promise<void>;
}

interface FrameWriteQueue {
  enqueue(frame: Buffer): Promise<void>;
  finish(): Promise<void>;
  abort(): Promise<void>;
}

interface ProgressEmitter {
  emit(event: RenderProgressEvent): void;
}

export interface RenderLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface PreloadedAsset {
  instanceId: string;
  optionId: string;
  path: string;
  url: string;
  contentType: string;
  body: Buffer;
}

const ASSET_URL_PREFIX = "http://lyric-video.local/assets/";
const PROGRESS_INTERVAL_MS = 250;

export async function probeAudioDurationMs(audioPath: string): Promise<number> {
  const output = await runCommand("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    audioPath
  ]);

  const durationSeconds = Number(output.trim());
  if (Number.isNaN(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Unable to determine audio duration with ffprobe.");
  }

  return Math.round(durationSeconds * 1000);
}

export async function renderLyricVideo({
  job,
  componentDefinitions,
  signal,
  onProgress
}: RenderLyricVideoInput): Promise<string> {
  const progress = createProgressEmitter(onProgress);
  const logger = createRenderLogger(job.id, progress);
  const profiler = createRenderProfiler();
  const componentLookup = new Map(componentDefinitions.map((component) => [component.id, component]));
  const enabledComponents = job.components.filter((component) => component.enabled);
  const preloadedAssets = await preloadSceneAssets(enabledComponents, componentLookup, job.video, logger, signal);
  const assets = createAssetAccessor(enabledComponents, preloadedAssets);
  const audio = createAudioAnalysisAccessor({
    audioPath: job.audioPath,
    video: job.video,
    signal,
    logger
  });

  progress.emit({
    jobId: job.id,
    status: "preparing",
    progress: 0,
    message: "Preparing scene components"
  });

  logger.info(
    `Starting render at ${job.video.width}x${job.video.height} ${job.video.fps}fps with ${job.video.durationInFrames} frames.`
  );

  let browser = null;
  let browserContext: BrowserContext | null = null;
  let page: Page | null = null;
  let cdpSession: CDPSession | null = null;
  let muxer: FrameMuxer | null = null;
  let frameQueue: FrameWriteQueue | null = null;
  let muxerFinished = false;
  try {
    throwIfAborted(signal);

    if (!canRenderWithLiveDom(enabledComponents, componentLookup)) {
      throw new Error("One or more enabled scene components do not support the live DOM renderer.");
    }

    const initialLyricsRuntime = createLyricRuntime(job.lyrics, 0);
    const prepared =
      (await measureAsync(profiler, "prepare", async () => {
        return await prepareSceneComponents(enabledComponents, componentLookup, {
          video: job.video,
          lyrics: initialLyricsRuntime,
          assets,
          audio,
          signal,
          logger
        });
      })) ?? {};

    const preferBeginFrame = shouldUseBeginFrame();

    browser = await chromium.launch({
      headless: true,
      args: preferBeginFrame ? ["--run-all-compositor-stages-before-draw"] : []
    });

    const renderPage = await createRenderPage({
      browser,
      width: job.video.width,
      height: job.video.height,
      preferBeginFrame
    });
    browserContext = renderPage.context;
    page = renderPage.page;

    wirePageDiagnostics(page, logger);
    await registerAssetRoutes(page, preloadedAssets, logger);

    await page.setContent(renderPageShell(), { waitUntil: "domcontentloaded" });

    cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send("Page.enable");

    const mountWarnings = await measureAsync(profiler, "browserUpdate", async () => {
      const scenePayload = createLiveDomScenePayload({
        job,
        components: enabledComponents,
        componentLookup,
        assets,
        prepared
      });

      return await mountLiveDomScene(page!, scenePayload);
    });

    for (const warning of mountWarnings.warnings) {
      logger.warn(warning);
    }

    muxer = startFrameMuxer(job, signal, logger);
    frameQueue = createFrameWriteQueue({
      muxer,
      profiler,
      signal
    });

    const lyricRuntimeCursor = createLyricRuntimeCursor(job.lyrics, 0);
    const renderStartMs = performance.now();
    let lastProgressEmitMs = renderStartMs - PROGRESS_INTERVAL_MS;
    let beginFrameFallbackLogged = false;

    for (let frame = 0; frame < job.video.durationInFrames; frame += 1) {
      throwIfAborted(signal);

      const timeMs = Math.min(job.video.durationMs, Math.round((frame / job.video.fps) * 1000));
      const lyrics = toBrowserLyricRuntime(lyricRuntimeCursor.getRuntimeAt(timeMs));
      const framePayload = measureSync(profiler, "frameState", () =>
        createLiveDomFramePayload({
          components: enabledComponents,
          componentLookup,
          frame,
          timeMs,
          video: job.video,
          lyrics,
          assets,
          prepared
        })
      );

      await measureAsync(profiler, "browserUpdate", async () => {
        await updateLiveDomScene(page!, framePayload);
      });

      const frameImage = await measureAsync(profiler, "capture", async () => {
        const capture = await captureFrameBuffer({
          cdpSession: cdpSession!,
          fps: job.video.fps,
          preferBeginFrame,
          logger,
          beginFrameFallbackLogged
        });
        beginFrameFallbackLogged = capture.beginFrameFallbackLogged;
        return capture.buffer;
      });

      await frameQueue.enqueue(frameImage);

      const nowMs = performance.now();
      const isLastFrame = frame + 1 === job.video.durationInFrames;
      if (isLastFrame || nowMs - lastProgressEmitMs >= PROGRESS_INTERVAL_MS) {
        const framesRendered = frame + 1;
        const elapsedMs = Math.max(nowMs - renderStartMs, 1);
        const renderFps = (framesRendered * 1000) / elapsedMs;
        const framesRemaining = job.video.durationInFrames - framesRendered;
        const etaMs = framesRemaining > 0 ? Math.round((framesRemaining / renderFps) * 1000) : 0;

        progress.emit({
          jobId: job.id,
          status: "rendering",
          progress: (framesRendered / job.video.durationInFrames) * 85,
          message: `Rendering frame ${framesRendered} of ${job.video.durationInFrames}`,
          etaMs,
          renderFps: Number(renderFps.toFixed(2))
        });

        lastProgressEmitMs = nowMs;
      }
    }

    throwIfAborted(signal);

    progress.emit({
      jobId: job.id,
      status: "muxing",
      progress: 90,
      message: "Muxing frames with source audio"
    });

    if (!frameQueue) {
      throw new Error("Frame write queue was not initialized.");
    }

    const activeFrameQueue = frameQueue;
    await measureAsync(profiler, "muxFinalize", async () => {
      await activeFrameQueue.finish();
      muxerFinished = true;
    });

    logger.info(`Render complete: ${job.outputPath}`);
    progress.emit({
      jobId: job.id,
      status: "completed",
      progress: 100,
      message: "Render complete",
      outputPath: job.outputPath
    });

    return job.outputPath;
  } catch (error) {
    if (isAbortError(error)) {
      logger.warn("Render cancelled.");
      progress.emit({
        jobId: job.id,
        status: "cancelled",
        progress: 0,
        message: "Render cancelled"
      });
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(errorMessage);
    progress.emit({
      jobId: job.id,
      status: "failed",
      progress: 0,
      message: "Render failed",
      error: errorMessage
    });
    throw error;
  } finally {
    if (frameQueue && !muxerFinished) {
      await frameQueue.abort();
    } else if (muxer && !muxerFinished) {
      await muxer.abort();
    }

    if (page) {
      await page.unroute(`${ASSET_URL_PREFIX}**`);
    }

    if (cdpSession) {
      await cdpSession.detach();
    }

    if (browserContext) {
      await browserContext.close();
    }

    if (browser) {
      await browser.close();
    }

    logRenderProfile(profiler, job, logger);
  }
}

async function createRenderPage({
  browser,
  width,
  height,
  preferBeginFrame
}: {
  browser: Browser;
  width: number;
  height: number;
  preferBeginFrame: boolean;
}): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: {
      width,
      height
    },
    deviceScaleFactor: 1
  });

  if (!preferBeginFrame) {
    const page = await context.newPage();
    return { context, page };
  }

  const browserSession = await browser.newBrowserCDPSession();

  try {
    const internalContext = (context as BrowserContext & {
      _connection?: { toImpl?: (object: unknown) => { _browserContextId?: string } };
    })._connection?.toImpl?.(context);
    const browserContextId = internalContext?._browserContextId;
    if (!browserContextId) {
      throw new Error("Playwright did not expose the Chromium browserContextId required for BeginFrameControl.");
    }

    const pagePromise = context.waitForEvent("page");
    await browserSession.send("Target.createTarget", {
      url: "about:blank",
      browserContextId,
      enableBeginFrameControl: true
    });
    const page = await pagePromise;
    return { context, page };
  } finally {
    await browserSession.detach();
  }
}

export function buildCompositeFrameMarkup({
  job,
  componentLookup,
  components,
  frame,
  timeMs,
  lyrics,
  assets,
  prepared
}: {
  job: RenderJob;
  componentLookup: Map<string, SceneComponentDefinition<Record<string, unknown>>>;
  components: ValidatedSceneComponentInstance[];
  frame: number;
  timeMs: number;
  lyrics: ReturnType<typeof createLyricRuntime>;
  assets: Pick<SceneAssetAccessor, "getUrl">;
  prepared: PreparedSceneStackData;
}): string {
  const layerElements = components.map((instance) => {
    const definition = componentLookup.get(instance.componentId);
    if (!definition) {
      throw new Error(`Scene component definition "${instance.componentId}" is not registered.`);
    }

    const renderedLayer = definition.Component({
      instance,
      options: instance.options,
      frame,
      timeMs,
      video: job.video,
      lyrics,
      assets,
      prepared: prepared[instance.id] ?? {}
    });

    if (!renderedLayer) {
      return null;
    }

    return createElement(
      "div",
      {
        key: instance.id,
        "data-scene-component-id": instance.componentId,
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden"
        }
      },
      renderedLayer
    );
  });

  return renderFrameMarkup(
    createElement(
      "div",
      {
        style: {
          position: "relative",
          width: job.video.width,
          height: job.video.height,
          overflow: "hidden",
          background: "#09090f"
        }
      },
      layerElements
    )
  );
}

function renderFrameMarkup(markup: ReactElement): string {
  return renderToStaticMarkup(markup);
}

async function prepareSceneComponents(
  components: ValidatedSceneComponentInstance[],
  componentLookup: Map<string, SceneComponentDefinition<Record<string, unknown>>>,
  context: {
    video: RenderJob["video"];
    lyrics: ReturnType<typeof createLyricRuntime>;
    assets: SceneAssetAccessor;
    audio: ReturnType<typeof createAudioAnalysisAccessor>;
    signal?: AbortSignal;
    logger: RenderLogger;
  }
): Promise<PreparedSceneStackData> {
  const prepared: PreparedSceneStackData = {};

  for (const instance of components) {
    const definition = componentLookup.get(instance.componentId);
    if (!definition) {
      throw new Error(`Scene component definition "${instance.componentId}" is not registered.`);
    }

    prepared[instance.id] =
      (await definition.prepare?.({
        instance,
        options: instance.options,
        video: context.video,
        lyrics: context.lyrics,
        assets: context.assets,
        audio: context.audio,
        signal: context.signal
      })) ?? {};

    context.logger.info(`Prepared component "${instance.componentName}" (${instance.id}).`);
  }

  return prepared;
}

export async function preloadSceneAssets(
  components: ValidatedSceneComponentInstance[],
  componentLookup: Map<string, SceneComponentDefinition<Record<string, unknown>>>,
  video: RenderJob["video"],
  logger: RenderLogger,
  signal?: AbortSignal
): Promise<Map<string, PreloadedAsset>> {
  const assets = new Map<string, PreloadedAsset>();

  for (const instance of components) {
    const definition = componentLookup.get(instance.componentId);
    if (!definition) {
      throw new Error(`Scene component definition "${instance.componentId}" is not registered.`);
    }

    for (const field of definition.options) {
      if (field.type !== "image") {
        continue;
      }

      const optionValue = instance.options[field.id];
      if (typeof optionValue !== "string" || !optionValue) {
        continue;
      }

      const normalizedBody = await normalizeImageAsset(optionValue, video, signal, logger);
      const originalBody = normalizedBody ? null : await readFile(optionValue);
      const asset = {
        instanceId: instance.id,
        optionId: field.id,
        path: optionValue,
        url: `${ASSET_URL_PREFIX}${encodeURIComponent(instance.id)}-${encodeURIComponent(field.id)}${getExtensionSuffix(optionValue)}`,
        contentType: normalizedBody ? "image/png" : getMimeType(optionValue),
        body: normalizedBody ?? originalBody!
      } satisfies PreloadedAsset;

      assets.set(getAssetKey(instance.id, field.id), asset);
      logger.info(
        `Preloaded image asset "${instance.id}/${field.id}" from ${optionValue}${normalizedBody ? " (normalized)" : ""}`
      );
    }
  }

  return assets;
}

export function areAllComponentsStaticWhenMarkupUnchanged(
  components: ValidatedSceneComponentInstance[],
  componentLookup: Map<string, SceneComponentDefinition<Record<string, unknown>>>
) {
  return components.every(
    (instance) => componentLookup.get(instance.componentId)?.staticWhenMarkupUnchanged === true
  );
}

async function registerAssetRoutes(
  page: Page,
  assets: Map<string, PreloadedAsset>,
  logger: RenderLogger
) {
  await page.route(`${ASSET_URL_PREFIX}**`, async (route) => {
    await fulfillAssetRoute(route, assets, logger);
  });
}

async function fulfillAssetRoute(
  route: Route,
  assets: Map<string, PreloadedAsset>,
  logger: RenderLogger
) {
  const url = route.request().url();
  const asset = [...assets.values()].find((candidate) => candidate.url === url);

  if (!asset) {
    logger.warn(`Asset request had no registered payload: ${url}`);
    await route.fulfill({
      status: 404,
      body: "Not found",
      headers: {
        "Content-Type": "text/plain"
      }
    });
    return;
  }

  await route.fulfill({
    status: 200,
    body: asset.body,
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}

function createAssetAccessor(
  components: ValidatedSceneComponentInstance[],
  preloadedAssets: Map<string, PreloadedAsset>
): SceneAssetAccessor {
  const componentLookup = new Map(components.map((component) => [component.id, component]));

  return {
    getPath(instanceId, optionId) {
      const instance = componentLookup.get(instanceId);
      if (!instance) {
        return null;
      }

      const value = instance.options[optionId];
      return typeof value === "string" ? value : null;
    },
    getUrl(instanceId, optionId) {
      return preloadedAssets.get(getAssetKey(instanceId, optionId))?.url ?? null;
    }
  };
}

function getAssetKey(instanceId: string, optionId: string) {
  return `${instanceId}:${optionId}`;
}

async function captureFrameBuffer({
  cdpSession,
  fps,
  preferBeginFrame,
  logger,
  beginFrameFallbackLogged
}: {
  cdpSession: CDPSession;
  fps: number;
  preferBeginFrame: boolean;
  logger: RenderLogger;
  beginFrameFallbackLogged: boolean;
}): Promise<{ buffer: Buffer; beginFrameFallbackLogged: boolean }> {
  if (preferBeginFrame) {
    try {
      const frame = await cdpSession.send("HeadlessExperimental.beginFrame", {
        interval: 1000 / Math.max(fps, 1),
        noDisplayUpdates: false,
        screenshot: {
          format: "png",
          optimizeForSpeed: true
        }
      });

      if (frame?.screenshotData) {
        return {
          buffer: Buffer.from(frame.screenshotData, "base64"),
          beginFrameFallbackLogged
        };
      }
    } catch (error) {
      if (!beginFrameFallbackLogged) {
        logger.warn(
          `HeadlessExperimental.beginFrame failed; falling back to Page.captureScreenshot. ${error instanceof Error ? error.message : String(error)}`
        );
        beginFrameFallbackLogged = true;
      }
    }
  }

  const screenshot = await cdpSession.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
    optimizeForSpeed: true
  });

  return {
    buffer: Buffer.from(screenshot.data, "base64"),
    beginFrameFallbackLogged
  };
}

function toBrowserLyricRuntime(
  lyrics: Pick<BrowserLyricRuntime, "current" | "next">
): BrowserLyricRuntime {
  return {
    current: lyrics.current,
    next: lyrics.next
  };
}

function shouldUseBeginFrame() {
  return process.env.LYRIC_VIDEO_RENDER_USE_BEGIN_FRAME !== "0";
}

function createProgressEmitter(onProgress: RenderLyricVideoInput["onProgress"]): ProgressEmitter {
  let lastStatus: RenderStatus | null = null;
  let lastProgress = Number.NaN;
  let lastOutputPath: string | undefined;
  let lastError: string | undefined;
  let lastEtaMs: number | undefined;
  let lastRenderFps: number | undefined;
  let lastLogKey: string | undefined;

  return {
    emit(event) {
      const nextLogKey = event.logEntry
        ? `${event.logEntry.timestamp}|${event.logEntry.level}|${event.logEntry.message}`
        : undefined;

      if (
        event.status === lastStatus &&
        numbersMatch(event.progress, lastProgress) &&
        event.outputPath === lastOutputPath &&
        event.error === lastError &&
        numbersMatch(event.etaMs, lastEtaMs) &&
        numbersMatch(event.renderFps, lastRenderFps) &&
        nextLogKey === lastLogKey
      ) {
        return;
      }

      lastStatus = event.status;
      lastProgress = event.progress;
      lastOutputPath = event.outputPath;
      lastError = event.error;
      lastEtaMs = event.etaMs;
      lastRenderFps = event.renderFps;
      lastLogKey = nextLogKey;
      onProgress?.(event);
    }
  };
}

function numbersMatch(left: number | undefined, right: number | undefined) {
  return left === right || (Number.isNaN(left) && Number.isNaN(right));
}

function createRenderLogger(jobId: string, progress: ProgressEmitter): RenderLogger {
  return {
    info(message) {
      emitLog("info", message);
    },
    warn(message) {
      emitLog("warning", message);
    },
    error(message) {
      emitLog("error", message);
    }
  };

  function emitLog(level: RenderLogLevel, message: string) {
    const entry = createLogEntry(level, message);
    const output =
      level === "error" ? console.error : level === "warning" ? console.warn : console.info;
    output(`[lyric-video-render:${jobId}] ${message}`);
    progress.emit({
      jobId,
      status: "rendering",
      progress: Number.NaN,
      message,
      logEntry: entry
    });
  }
}

function createLogEntry(level: RenderLogLevel, message: string): RenderLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message
  };
}

function wirePageDiagnostics(page: Page, logger: RenderLogger) {
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      const log = msg.text().trim();
      if (log) {
        if (msg.type() === "error") {
          logger.error(`Browser console: ${log}`);
        } else {
          logger.warn(`Browser console: ${log}`);
        }
      }
    }
  });

  page.on("pageerror", (error) => {
    logger.error(`Page error: ${error.message}`);
  });

  page.on("requestfailed", (request) => {
    logger.warn(`Request failed: ${request.url()}${request.failure()?.errorText ? ` (${request.failure()?.errorText})` : ""}`);
  });
}

function createRenderProfiler(): RenderProfiler {
  return {
    enabled: process.env.LYRIC_VIDEO_RENDER_DEBUG === "1",
    totalStartMs: performance.now(),
    stages: {
      prepare: 0,
      frameState: 0,
      browserUpdate: 0,
      capture: 0,
      queueWait: 0,
      muxWrite: 0,
      muxFinalize: 0
    }
  };
}

function measureSync<T>(
  profiler: RenderProfiler,
  stage: RenderProfileStage,
  run: () => T
): T {
  if (!profiler.enabled) {
    return run();
  }

  const startMs = performance.now();
  try {
    return run();
  } finally {
    profiler.stages[stage] += performance.now() - startMs;
  }
}

async function measureAsync<T>(
  profiler: RenderProfiler,
  stage: RenderProfileStage,
  run: () => Promise<T>
): Promise<T> {
  if (!profiler.enabled) {
    return await run();
  }

  const startMs = performance.now();
  try {
    return await run();
  } finally {
    profiler.stages[stage] += performance.now() - startMs;
  }
}

function logRenderProfile(
  profiler: RenderProfiler,
  job: RenderJob,
  logger: RenderLogger
) {
  if (!profiler.enabled) {
    return;
  }

  const totalMs = performance.now() - profiler.totalStartMs;
  const renderedFps = job.video.durationInFrames / Math.max(totalMs / 1000, 0.001);
  logger.info(
    `Profile ${JSON.stringify(
      {
        jobId: job.id,
        frames: job.video.durationInFrames,
        totalMs: roundMs(totalMs),
        renderedFps: Number(renderedFps.toFixed(2)),
        stagesMs: {
          prepare: roundMs(profiler.stages.prepare),
          frameState: roundMs(profiler.stages.frameState),
          browserUpdate: roundMs(profiler.stages.browserUpdate),
          capture: roundMs(profiler.stages.capture),
          queueWait: roundMs(profiler.stages.queueWait),
          muxWrite: roundMs(profiler.stages.muxWrite),
          muxFinalize: roundMs(profiler.stages.muxFinalize)
        }
      },
      null,
      2
    )}`
  );
}

function roundMs(value: number): number {
  return Number(value.toFixed(2));
}

function createFrameWriteQueue({
  muxer,
  profiler,
  signal,
  maxBufferedFrames = 3
}: {
  muxer: FrameMuxer;
  profiler: RenderProfiler;
  signal?: AbortSignal;
  maxBufferedFrames?: number;
}): FrameWriteQueue {
  let bufferedFrames = 0;
  let writeError: unknown;
  let spaceResolvers: (() => void)[] = [];
  let writeChain = Promise.resolve();

  return {
    async enqueue(frame) {
      throwIfAborted(signal);
      if (writeError) {
        throw writeError;
      }

      const waitStartMs = profiler.enabled ? performance.now() : 0;
      while (bufferedFrames >= maxBufferedFrames) {
        await new Promise<void>((resolve) => {
          spaceResolvers.push(resolve);
        });
        throwIfAborted(signal);
        if (writeError) {
          throw writeError;
        }
      }

      if (profiler.enabled) {
        profiler.stages.queueWait += performance.now() - waitStartMs;
      }

      bufferedFrames += 1;
      writeChain = writeChain
        .then(async () => {
          await measureAsync(profiler, "muxWrite", async () => {
            await muxer.writeFrame(frame);
          });
        })
        .catch((error) => {
          writeError = error;
          throw error;
        })
        .finally(() => {
          bufferedFrames = Math.max(0, bufferedFrames - 1);
          const resolvers = spaceResolvers;
          spaceResolvers = [];
          for (const resolve of resolvers) {
            resolve();
          }
        });
    },
    async finish() {
      await writeChain;
      if (writeError) {
        throw writeError;
      }
      await muxer.finish();
    },
    async abort() {
      const resolvers = spaceResolvers;
      spaceResolvers = [];
      for (const resolve of resolvers) {
        resolve();
      }
      await muxer.abort();
    }
  };
}

function startFrameMuxer(
  job: RenderJob,
  signal: AbortSignal | undefined,
  logger: RenderLogger
): FrameMuxer {
  let aborted = false;
  let finished = false;

  const child = spawn(
    "ffmpeg",
    [
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(job.video.fps),
      "-vcodec",
      "png",
      "-i",
      "-",
      "-i",
      job.audioPath,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "-shortest",
      job.outputPath
    ],
    {
      stdio: ["pipe", "ignore", "pipe"]
    }
  );

  logger.info("Spawned ffmpeg muxer process.");

  const stderr: Buffer[] = [];
  const exitPromise = new Promise<void>((resolve, reject) => {
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", reject);
    child.on("close", (code) => {
      cleanup();

      if (code === 0) {
        resolve();
        return;
      }

      if (aborted) {
        reject(createAbortError());
        return;
      }

      reject(
        new Error(`ffmpeg exited with code ${code}: ${Buffer.concat(stderr).toString("utf8").trim()}`)
      );
    });
  });

  const abortHandler = () => {
    aborted = true;
    child.kill();
  };

  signal?.addEventListener("abort", abortHandler, { once: true });

  return {
    async writeFrame(frame) {
      if (finished) {
        throw new Error("Cannot write additional frames after the muxer has finished.");
      }

      throwIfAborted(signal);

      await new Promise<void>((resolve, reject) => {
        const handleError = (error: Error) => {
          child.stdin.off("error", handleError);
          reject(error);
        };

        child.stdin.once("error", handleError);
        child.stdin.write(frame, (error) => {
          child.stdin.off("error", handleError);
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
    async finish() {
      if (finished) {
        await exitPromise;
        return;
      }

      finished = true;
      child.stdin.end();
      await exitPromise;
      logger.info("ffmpeg muxing finished successfully.");
    },
    async abort() {
      if (finished) {
        return;
      }

      aborted = true;
      finished = true;
      child.stdin.end();
      child.kill();

      try {
        await exitPromise;
      } catch (error) {
        if (!isAbortError(error)) {
          throw error;
        }
      }
    }
  };

  function cleanup() {
    signal?.removeEventListener("abort", abortHandler);
  }
}

function getMimeType(path: string): string {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith(".png")) {
    return "image/png";
  }
  if (lowerPath.endsWith(".webp")) {
    return "image/webp";
  }
  if (lowerPath.endsWith(".gif")) {
    return "image/gif";
  }

  return "image/jpeg";
}

function getExtensionSuffix(path: string): string {
  const match = /\.[^./\\]+$/.exec(path);
  return match ? match[0] : "";
}

async function normalizeImageAsset(
  path: string,
  video: RenderJob["video"],
  signal: AbortSignal | undefined,
  logger: RenderLogger
): Promise<Buffer | null> {
  try {
    return await runBinaryCommand(
      "ffmpeg",
      [
        "-v",
        "error",
        "-i",
        path,
        "-vf",
        `scale=${video.width}:${video.height}:force_original_aspect_ratio=increase,crop=${video.width}:${video.height}`,
        "-frames:v",
        "1",
        "-f",
        "image2pipe",
        "-vcodec",
        "png",
        "-"
      ],
      signal
    );
  } catch (error) {
    logger.warn(
      `Image normalization failed for ${path}; falling back to original asset. ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function createAbortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function runCommand(
  command: string,
  args: string[],
  signal?: AbortSignal
): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    const abortHandler = () => {
      child.kill();
      reject(createAbortError());
    };

    signal?.addEventListener("abort", abortHandler, { once: true });

    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", (error) => {
      signal?.removeEventListener("abort", abortHandler);
      reject(error);
    });
    child.on("close", (code) => {
      signal?.removeEventListener("abort", abortHandler);
      if (code === 0) {
        resolve(Buffer.concat(stdout).toString("utf8"));
        return;
      }

      reject(
        new Error(
          `${command} exited with code ${code}: ${Buffer.concat(stderr).toString("utf8").trim()}`
        )
      );
    });
  });
}

async function runBinaryCommand(
  command: string,
  args: string[],
  signal?: AbortSignal
): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    const abortHandler = () => {
      child.kill();
      reject(createAbortError());
    };

    signal?.addEventListener("abort", abortHandler, { once: true });

    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", (error) => {
      signal?.removeEventListener("abort", abortHandler);
      reject(error);
    });
    child.on("close", (code) => {
      signal?.removeEventListener("abort", abortHandler);
      if (code === 0) {
        resolve(Buffer.concat(stdout));
        return;
      }

      reject(
        new Error(
          `${command} exited with code ${code}: ${Buffer.concat(stderr).toString("utf8").trim()}`
        )
      );
    });
  });
}
