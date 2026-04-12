import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { ASSET_URL_PREFIX, FONT_URL_PREFIX, VIDEO_FRAME_URL_PREFIX } from "../constants";
import type { PreloadedAsset, RenderLogger } from "../types";
import type { VideoFrameExtractionEntry } from "../video-frame-extraction";
import type { PageClient } from "./cdp-session";

/**
 * Asset route handler (cavekit-video-field-type R6 / T-012).
 *
 * Replaces Playwright's `page.route` with CDP's `Fetch` domain. Three URL
 * prefixes are intercepted (assets, extracted video frames, cached fonts);
 * each is dispatched to a handler that produces a `RouteLike` fulfillment
 * which the dispatcher then translates into `Fetch.fulfillRequest`.
 *
 * The fulfillment helpers below take a `RouteLike` rather than a CDP
 * request directly so they remain trivially unit-testable with hand-built
 * mock routes (see tests/asset-route-video.test.ts and friends).
 */

/**
 * The fulfillment surface the helpers below depend on. Designed to match
 * the small subset of Playwright's `Route` API that the helpers used.
 */
export interface RouteLike {
  request(): {
    url(): string;
    headers?(): Record<string, string>;
  };
  fulfill(args: RouteFulfillArgs): Promise<void>;
}

export interface RouteFulfillArgs {
  status: number;
  body?: Buffer | string;
  /** Path to a file whose contents should be served as the response body. */
  path?: string;
  headers?: Record<string, string>;
}

interface FetchRequestPausedEvent {
  requestId: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
  };
}

/**
 * Wire up CDP `Fetch` interception for the renderer's three custom URL
 * prefixes. Returns a `dispose` function that detaches the listener and
 * disables the Fetch domain.
 */
export async function registerAssetRoutes(
  page: PageClient,
  assets: Map<string, PreloadedAsset>,
  logger: RenderLogger,
  videoFrameExtractions: VideoFrameExtractionEntry[] = [],
  fontCacheDir?: string
): Promise<{ dispose: () => Promise<void> }> {
  await page.send("Fetch.enable", {
    patterns: [
      { urlPattern: `${ASSET_URL_PREFIX}*`, requestStage: "Request" },
      { urlPattern: `${VIDEO_FRAME_URL_PREFIX}*`, requestStage: "Request" },
      { urlPattern: `${FONT_URL_PREFIX}*`, requestStage: "Request" }
    ]
  });

  const removeListener = page.on("Fetch.requestPaused", (raw) => {
    const event = raw as FetchRequestPausedEvent;
    void handleRequestPaused(page, event, assets, logger, videoFrameExtractions, fontCacheDir);
  });

  return {
    async dispose() {
      removeListener();
      try {
        await page.send("Fetch.disable");
      } catch {
        // The browser may already be shutting down — ignore.
      }
    }
  };
}

async function handleRequestPaused(
  page: PageClient,
  event: FetchRequestPausedEvent,
  assets: Map<string, PreloadedAsset>,
  logger: RenderLogger,
  videoFrameExtractions: VideoFrameExtractionEntry[],
  fontCacheDir: string | undefined
): Promise<void> {
  const route = createCdpRoute(page, event);
  const url = event.request.url;

  try {
    if (url.startsWith(ASSET_URL_PREFIX)) {
      await fulfillAssetRoute(route, assets, logger);
    } else if (url.startsWith(VIDEO_FRAME_URL_PREFIX)) {
      await fulfillVideoFrameRoute(route, videoFrameExtractions, logger);
    } else if (url.startsWith(FONT_URL_PREFIX)) {
      await fulfillFontRoute(route, fontCacheDir, logger);
    } else {
      // Pattern matched something we don't own — let it through unchanged.
      await page.send("Fetch.continueRequest", { requestId: event.requestId });
    }
  } catch (error) {
    logger.error(`Asset route handler failed for ${url}: ${(error as Error).message}`);
    try {
      await page.send("Fetch.failRequest", {
        requestId: event.requestId,
        errorReason: "Failed"
      });
    } catch {
      // Ignore — the request may already be aborted.
    }
  }
}

function createCdpRoute(page: PageClient, event: FetchRequestPausedEvent): RouteLike {
  return {
    request() {
      return {
        url: () => event.request.url,
        headers: () => normaliseHeaderKeys(event.request.headers ?? {})
      };
    },
    async fulfill(args: RouteFulfillArgs) {
      const body = await resolveResponseBody(args);
      const responseHeaders = headersToCdp(args.headers ?? {});
      await page.send("Fetch.fulfillRequest", {
        requestId: event.requestId,
        responseCode: args.status,
        responseHeaders,
        body
      });
    }
  };
}

async function resolveResponseBody(args: RouteFulfillArgs): Promise<string> {
  if (args.path) {
    const fileBytes = await readFile(args.path);
    return fileBytes.toString("base64");
  }

  if (args.body === undefined || args.body === null) {
    return "";
  }

  if (typeof args.body === "string") {
    return Buffer.from(args.body, "utf8").toString("base64");
  }

  return args.body.toString("base64");
}

function headersToCdp(headers: Record<string, string>): Array<{ name: string; value: string }> {
  return Object.entries(headers).map(([name, value]) => ({ name, value: String(value) }));
}

function normaliseHeaderKeys(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    result[name.toLowerCase()] = value;
  }
  return result;
}

export async function fulfillAssetRoute(
  route: RouteLike,
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

  const request = route.request();
  const headers = typeof request.headers === "function" ? request.headers() : {};
  const rangeHeader = headers["range"];
  if (rangeHeader && asset.contentType.startsWith("video/")) {
    const range = parseByteRange(rangeHeader, asset.body.byteLength);
    if (!range) {
      await route.fulfill({
        status: 416,
        body: "",
        headers: {
          "Content-Range": `bytes */${asset.body.byteLength}`,
          "Accept-Ranges": "bytes"
        }
      });
      return;
    }

    const chunk = asset.body.subarray(range.start, range.end + 1);
    await route.fulfill({
      status: 206,
      body: chunk,
      headers: {
        "Content-Type": asset.contentType,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${asset.body.byteLength}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
    return;
  }

  await route.fulfill({
    status: 200,
    body: asset.body,
    headers: {
      "Content-Type": asset.contentType,
      "Content-Length": String(asset.body.byteLength),
      ...(asset.contentType.startsWith("video/") ? { "Accept-Ranges": "bytes" } : {}),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}

export async function fulfillVideoFrameRoute(
  route: RouteLike,
  entries: VideoFrameExtractionEntry[],
  logger: RenderLogger
) {
  const url = route.request().url();
  const resolved = resolveVideoFrameRequest(url, entries);
  const canServe = resolved ? await canServeVideoFrameRequest(url, entries) : false;
  if (!resolved || !canServe) {
    logger.warn(`Video frame request had no registered file: ${url}`);
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
    path: resolved.path,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}

export async function fulfillFontRoute(
  route: RouteLike,
  fontCacheDir: string | undefined,
  logger: RenderLogger
) {
  const url = route.request().url();
  const fileName = resolveFontRequest(url);
  const filePath = fileName && fontCacheDir ? join(fontCacheDir, "files", fileName) : null;
  const canServe = filePath ? await canServeFile(filePath) : false;
  if (!filePath || !canServe) {
    logger.warn(`Font request had no cached file: ${url}`);
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
    path: filePath,
    headers: {
      "Content-Type": "font/woff2",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}

export async function canServeVideoFrameRequest(
  url: string,
  entries: VideoFrameExtractionEntry[]
) {
  const resolved = resolveVideoFrameRequest(url, entries);
  if (!resolved) {
    return false;
  }

  try {
    const result = await stat(resolved.path);
    return result.isFile();
  } catch {
    return false;
  }
}

async function canServeFile(path: string) {
  try {
    const result = await stat(path);
    return result.isFile();
  } catch {
    return false;
  }
}

function resolveFontRequest(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const prefix = new URL(FONT_URL_PREFIX);
  if (parsed.origin !== prefix.origin || !parsed.pathname.startsWith(prefix.pathname)) {
    return null;
  }
  const fileName = decodeUrlPathPart(parsed.pathname.slice(prefix.pathname.length));
  if (!fileName || !/^[a-f0-9]{32}\.woff2$/.test(fileName)) {
    return null;
  }
  return fileName;
}

function resolveVideoFrameRequest(
  url: string,
  entries: VideoFrameExtractionEntry[]
): { path: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const prefix = new URL(VIDEO_FRAME_URL_PREFIX);
  if (parsed.origin !== prefix.origin || !parsed.pathname.startsWith(prefix.pathname)) {
    return null;
  }

  const tail = parsed.pathname.slice(prefix.pathname.length);
  const parts = tail.split("/");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedExtractionId, encodedFrameName] = parts;
  const extractionId = decodeUrlPathPart(encodedExtractionId);
  const frameName = decodeUrlPathPart(encodedFrameName);
  if (
    !extractionId ||
    !frameName ||
    !/^[a-zA-Z0-9_-]+$/.test(extractionId) ||
    !/^frame-\d{8}\.jpg$/.test(frameName)
  ) {
    return null;
  }

  const entry = entries.find((candidate) => candidate.extractionId === extractionId);
  if (!entry) {
    return null;
  }

  const match = /^frame-(\d{8})\.jpg$/.exec(frameName);
  const frameNumber = match ? Number(match[1]) : 0;
  if (!Number.isInteger(frameNumber) || frameNumber < 1 || frameNumber > entry.frameCount) {
    return null;
  }

  return {
    path: join(entry.tempDir, frameName)
  };
}

function decodeUrlPathPart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function parseByteRange(
  rangeHeader: string,
  size: number
): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match || size <= 0) {
    return null;
  }

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) {
    return null;
  }

  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
      return null;
    }
    const start = Math.max(size - suffixLength, 0);
    return { start, end: size - 1 };
  }

  const start = Number(rawStart);
  const end = rawEnd ? Number(rawEnd) : size - 1;
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return null;
  }

  return {
    start,
    end: Math.min(end, size - 1)
  };
}
