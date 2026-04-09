import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createLyricRuntime,
  createSceneFrameContext,
  type RenderJob,
  type RenderProgressEvent,
  type SceneAssetAccessor,
  type SceneDefinition
} from "@lyric-video-maker/core";

export interface RenderLyricVideoInput {
  job: RenderJob;
  scene: SceneDefinition<Record<string, unknown>>;
  signal?: AbortSignal;
  onProgress?: (event: RenderProgressEvent) => void;
}

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
  scene,
  signal,
  onProgress
}: RenderLyricVideoInput): Promise<string> {
  emitProgress(onProgress, {
    jobId: job.id,
    status: "preparing",
    progress: 0,
    message: "Preparing scene assets"
  });

  const temporaryDirectory = await mkdtemp(join(tmpdir(), "lyric-video-maker-"));
  const framePattern = join(temporaryDirectory, "frame-%06d.png");
  const assetUrls = await preloadAssetUrls(scene, job.options);
  const assets = createAssetAccessor(job.options, assetUrls);

  try {
    throwIfAborted(signal);

    const initialLyrics = createLyricRuntime(job.lyrics, 0);
    const prepared =
      (await scene.prepare?.({
        options: job.options,
        video: job.video,
        lyrics: initialLyrics,
        assets,
        signal
      })) ?? {};

    const browser = await chromium.launch({
      headless: true
    });

    try {
      const page = await browser.newPage({
        viewport: {
          width: job.video.width,
          height: job.video.height
        },
        deviceScaleFactor: 1
      });

      for (let frame = 0; frame < job.video.durationInFrames; frame += 1) {
        throwIfAborted(signal);

        const { lyrics, timeMs } = createSceneFrameContext(job, frame);
        const html = renderFrameHtml(
          scene.Component({
            options: job.options,
            frame,
            timeMs,
            video: job.video,
            lyrics,
            assets,
            prepared
          })
        );

        await page.setContent(html, { waitUntil: "load" });
        await page.screenshot({
          path: join(temporaryDirectory, `frame-${frame.toString().padStart(6, "0")}.png`),
          type: "png"
        });

        emitProgress(onProgress, {
          jobId: job.id,
          status: "rendering",
          progress: Math.round(((frame + 1) / job.video.durationInFrames) * 85),
          message: `Rendering frame ${frame + 1} of ${job.video.durationInFrames}`
        });
      }
    } finally {
      await browser.close();
    }

    throwIfAborted(signal);

    emitProgress(onProgress, {
      jobId: job.id,
      status: "muxing",
      progress: 90,
      message: "Muxing frames with source audio"
    });

    await runCommand(
      "ffmpeg",
      [
        "-y",
        "-framerate",
        String(job.video.fps),
        "-i",
        framePattern,
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
      signal
    );

    emitProgress(onProgress, {
      jobId: job.id,
      status: "completed",
      progress: 100,
      message: "Render complete",
      outputPath: job.outputPath
    });

    return job.outputPath;
  } catch (error) {
    if (isAbortError(error)) {
      emitProgress(onProgress, {
        jobId: job.id,
        status: "cancelled",
        progress: 0,
        message: "Render cancelled"
      });
      throw error;
    }

    emitProgress(onProgress, {
      jobId: job.id,
      status: "failed",
      progress: 0,
      message: "Render failed",
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

function renderFrameHtml(markup: ReactElement): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body, #app {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
      }
      * {
        box-sizing: border-box;
      }
      body {
        font-synthesis-weight: none;
        text-rendering: geometricPrecision;
      }
    </style>
  </head>
  <body>
    <div id="app">${renderToStaticMarkup(markup)}</div>
  </body>
</html>`;
}

async function preloadAssetUrls(
  scene: SceneDefinition<Record<string, unknown>>,
  options: Record<string, unknown>
): Promise<Map<string, string>> {
  const assetUrls = new Map<string, string>();

  await Promise.all(
    scene.options
      .filter((field) => field.type === "image")
      .map(async (field) => {
        const optionValue = options[field.id];
        if (typeof optionValue !== "string" || !optionValue) {
          return;
        }

        assetUrls.set(field.id, await readFileAsDataUrl(optionValue));
      })
  );

  return assetUrls;
}

function createAssetAccessor(
  options: Record<string, unknown>,
  assetUrls: Map<string, string>
): SceneAssetAccessor {
  return {
    getPath(optionId) {
      const value = options[optionId];
      return typeof value === "string" ? value : null;
    },
    getUrl(optionId) {
      return assetUrls.get(optionId) ?? null;
    }
  };
}

async function readFileAsDataUrl(path: string): Promise<string> {
  const file = await readFile(path);
  return `data:${getMimeType(path)};base64,${file.toString("base64")}`;
}

function getMimeType(path: string): string {
  switch (extname(path).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".jpg":
    case ".jpeg":
    default:
      return "image/jpeg";
  }
}

function emitProgress(
  onProgress: RenderLyricVideoInput["onProgress"],
  event: RenderProgressEvent
) {
  onProgress?.(event);
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
