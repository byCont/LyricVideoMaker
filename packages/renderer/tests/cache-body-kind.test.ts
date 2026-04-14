import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCachedAssetBody, loadCachedAssetBody } from "../src/assets/cache-body";
import type { CachedAssetBody, PreviewAssetCache, RenderLogger } from "../src/types";

const silentLogger: RenderLogger = {
  info: () => {},
  warn: () => {},
  error: () => {}
};

const video = { width: 640, height: 360 };

let tempDir: string;
let videoPath: string;
let imagePath: string;
const fakeVideoBytes = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
const fakeImageBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "cache-body-kind-"));
  videoPath = join(tempDir, "clip.mp4");
  imagePath = join(tempDir, "pic.png");
  await writeFile(videoPath, fakeVideoBytes);
  await writeFile(imagePath, fakeImageBytes);
});

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("createCachedAssetBody with kind", () => {
  it("video kind reads bytes directly with MIME type detection", async () => {
    const body = await createCachedAssetBody(videoPath, video, undefined, silentLogger, "video");
    expect(body.body.equals(fakeVideoBytes)).toBe(true);
    expect(body.contentType).toBe("video/mp4");
  });

  it("video cached asset carries content-type from MIME detection", async () => {
    const mp4 = await createCachedAssetBody(videoPath, video, undefined, silentLogger, "video");
    expect(mp4.contentType).toBe("video/mp4");

    const webmPath = join(tempDir, "clip.webm");
    await writeFile(webmPath, fakeVideoBytes);
    const webm = await createCachedAssetBody(webmPath, video, undefined, silentLogger, "video");
    expect(webm.contentType).toBe("video/webm");
  });

  it("image kind reads bytes directly with MIME type detection", async () => {
    const body = await createCachedAssetBody(imagePath, video, undefined, silentLogger);
    expect(body.body.equals(fakeImageBytes)).toBe(true);
    expect(body.contentType).toBe("image/png");
  });
});

describe("loadCachedAssetBody cache-key stability across kinds", () => {
  it("uses the same cache-key format regardless of kind", async () => {
    const cache: PreviewAssetCache = new Map();
    await loadCachedAssetBody(videoPath, video, undefined, silentLogger, cache, "video");
    const keys = Array.from(cache.keys());
    expect(keys).toHaveLength(1);
    expect(keys[0]).toBe(`${videoPath}::${video.width}x${video.height}`);
  });

  it("video loads return cached promise on repeat call", async () => {
    const cache: PreviewAssetCache = new Map();
    const first = await loadCachedAssetBody(
      videoPath,
      video,
      undefined,
      silentLogger,
      cache,
      "video"
    );
    const second = await loadCachedAssetBody(
      videoPath,
      video,
      undefined,
      silentLogger,
      cache,
      "video"
    );
    expect(second).toBe<CachedAssetBody>(first);
  });
});
