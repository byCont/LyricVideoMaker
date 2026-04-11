import { describe, expect, it, vi } from "vitest";
import { discoverFfmpeg, type FfmpegDiscoveryResult } from "../electron/services/ffmpeg-discovery";

const isWindows = process.platform === "win32";
const ffmpegSuffix = isWindows ? ".exe" : "";

function buildPath(...parts: string[]) {
  return parts.join(isWindows ? "\\" : "/");
}

function makeDeps(overrides: {
  fileExists?: (path: string) => boolean;
  validateBinary?: (path: string) => Promise<boolean>;
  resolveOnPath?: (command: string) => Promise<string | null>;
} = {}) {
  return {
    fileExists: vi.fn(overrides.fileExists ?? (() => false)),
    validateBinary: vi.fn(overrides.validateBinary ?? (async () => true)),
    resolveOnPath: vi.fn(overrides.resolveOnPath ?? (async () => null))
  };
}

describe("discoverFfmpeg", () => {
  it("uses the known path when it exists and validates", async () => {
    const knownFfmpeg = buildPath("C:", "tools", "ffmpeg", "bin", `ffmpeg${ffmpegSuffix}`);
    const knownFfprobe = buildPath("C:", "tools", "ffmpeg", "bin", `ffprobe${ffmpegSuffix}`);
    const deps = makeDeps({
      fileExists: (path) => path === knownFfmpeg || path === knownFfprobe
    });

    const result = await discoverFfmpeg(
      { knownFfmpegPath: knownFfmpeg, knownFfprobePath: knownFfprobe },
      deps
    );

    expectFound(result);
    expect(result.ffmpegPath).toBe(knownFfmpeg);
    expect(result.ffprobePath).toBe(knownFfprobe);
    expect(result.source).toBe("known");
  });

  it("falls back to PATH when the known path is missing", async () => {
    const pathFfmpeg = buildPath("C:", "elsewhere", `ffmpeg${ffmpegSuffix}`);
    const pathFfprobe = buildPath("C:", "elsewhere", `ffprobe${ffmpegSuffix}`);
    const deps = makeDeps({
      fileExists: (path) => path === pathFfmpeg || path === pathFfprobe,
      resolveOnPath: async () => pathFfmpeg
    });

    const result = await discoverFfmpeg(
      { knownFfmpegPath: buildPath("C:", "missing", `ffmpeg${ffmpegSuffix}`) },
      deps
    );

    expectFound(result);
    expect(result.source).toBe("path");
  });

  it("returns missing when nothing validates", async () => {
    const deps = makeDeps({
      fileExists: () => false,
      resolveOnPath: async () => null
    });

    const result = await discoverFfmpeg({}, deps);

    expect(result.kind).toBe("missing");
    if (result.kind === "missing") {
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });

  it("treats failed -version probe as a candidate rejection", async () => {
    const candidate = buildPath("C:", "ffmpeg", "bin", `ffmpeg${ffmpegSuffix}`);
    const candidateProbe = buildPath("C:", "ffmpeg", "bin", `ffprobe${ffmpegSuffix}`);
    const deps = makeDeps({
      fileExists: (path) => path === candidate || path === candidateProbe,
      validateBinary: async () => false
    });

    const result = await discoverFfmpeg({ knownFfmpegPath: candidate }, deps);

    expect(result.kind).toBe("missing");
  });
});

function expectFound(
  result: FfmpegDiscoveryResult
): asserts result is Extract<FfmpegDiscoveryResult, { kind: "found" }> {
  expect(result.kind).toBe("found");
}
