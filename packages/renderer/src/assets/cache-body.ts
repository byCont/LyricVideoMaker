import { readFile } from "node:fs/promises";
import type { RenderJob } from "@lyric-video-maker/core";
import type { CachedAssetBody, PreviewAssetCache, RenderLogger } from "../types";
import { getMimeType } from "./mime";

/**
 * Asset kinds the cache understands. Both images and videos are read directly
 * from disk and served with their detected MIME type. The cache-key format
 * includes dimensions for historical reasons but asset bodies are not
 * dimension-dependent.
 */
export type CachedAssetKind = "image" | "video";

export async function loadCachedAssetBody(
  path: string,
  video: RenderJob["video"],
  signal: AbortSignal | undefined,
  logger: RenderLogger,
  assetCache?: PreviewAssetCache,
  kind: CachedAssetKind = "image"
): Promise<CachedAssetBody> {
  const cacheKey = `${path}::${video.width}x${video.height}`;
  if (!assetCache) {
    return await createCachedAssetBody(path, video, signal, logger, kind);
  }

  const cached = assetCache.get(cacheKey);
  if (cached) {
    return await cached;
  }

  const pending = createCachedAssetBody(path, video, signal, logger, kind).catch((error) => {
    assetCache.delete(cacheKey);
    throw error;
  });
  assetCache.set(cacheKey, pending);
  return await pending;
}

export async function createCachedAssetBody(
  path: string,
  _video: RenderJob["video"],
  _signal: AbortSignal | undefined,
  _logger: RenderLogger,
  _kind: CachedAssetKind = "image"
): Promise<CachedAssetBody> {
  return {
    body: await readFile(path),
    contentType: getMimeType(path)
  };
}
