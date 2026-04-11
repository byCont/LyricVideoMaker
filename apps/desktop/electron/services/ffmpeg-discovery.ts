import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const VERSION_PROBE_TIMEOUT_MS = 5000;
const PLATFORM_EXE_SUFFIX = process.platform === "win32" ? ".exe" : "";

export type FfmpegDiscoverySource =
  | "known"
  | "env"
  | "path"
  | "winget-links"
  | "scoop-shims"
  | "scoop-apps"
  | "chocolatey"
  | "program-files"
  | "c-root";

export type FfmpegDiscoveryResult =
  | {
      kind: "found";
      ffmpegPath: string;
      ffprobePath: string;
      source: FfmpegDiscoverySource;
    }
  | { kind: "missing"; reason: string };

export interface FfmpegDiscoveryOptions {
  knownFfmpegPath?: string;
  knownFfprobePath?: string;
}

interface DiscoveryDependencies {
  fileExists: (path: string) => boolean;
  validateBinary: (binaryPath: string) => Promise<boolean>;
  resolveOnPath: (command: string) => Promise<string | null>;
}

const defaultDependencies: DiscoveryDependencies = {
  fileExists: existsSync,
  validateBinary: defaultValidateBinary,
  resolveOnPath: defaultResolveOnPath
};

export async function discoverFfmpeg(
  options: FfmpegDiscoveryOptions = {},
  dependencies: Partial<DiscoveryDependencies> = {}
): Promise<FfmpegDiscoveryResult> {
  const deps: DiscoveryDependencies = { ...defaultDependencies, ...dependencies };
  const failures: string[] = [];

  const candidatesToTry: Array<{ source: FfmpegDiscoverySource; ffmpeg: string; ffprobe?: string }> = [];

  if (options.knownFfmpegPath) {
    candidatesToTry.push({
      source: "known",
      ffmpeg: options.knownFfmpegPath,
      ffprobe: options.knownFfprobePath
    });
  }

  const envFfmpeg = process.env.LYRIC_VIDEO_FFMPEG_PATH;
  const envFfprobe = process.env.LYRIC_VIDEO_FFPROBE_PATH;
  if (envFfmpeg && envFfmpeg.trim()) {
    candidatesToTry.push({
      source: "env",
      ffmpeg: envFfmpeg.trim(),
      ffprobe: envFfprobe?.trim() || undefined
    });
  }

  for (const candidate of candidatesToTry) {
    const result = await tryCandidate(candidate.ffmpeg, candidate.ffprobe, candidate.source, deps);
    if (result.kind === "found") {
      return result;
    }
    failures.push(`${candidate.source}: ${result.reason}`);
  }

  // PATH lookup
  const pathFfmpeg = await deps.resolveOnPath(`ffmpeg${PLATFORM_EXE_SUFFIX}`);
  if (pathFfmpeg) {
    const result = await tryCandidate(pathFfmpeg, undefined, "path", deps);
    if (result.kind === "found") {
      return result;
    }
    failures.push(`path: ${result.reason}`);
  }

  // Well-known Windows install dirs
  if (process.platform === "win32") {
    for (const candidate of getWindowsKnownLocations()) {
      const result = await tryCandidate(candidate.ffmpeg, undefined, candidate.source, deps);
      if (result.kind === "found") {
        return result;
      }
      failures.push(`${candidate.source}: ${result.reason}`);
    }
  }

  return {
    kind: "missing",
    reason:
      failures.length > 0
        ? `FFmpeg not found. Tried: ${failures.join("; ")}`
        : "FFmpeg not found in any known location."
  };
}

async function tryCandidate(
  ffmpegPath: string,
  ffprobePathHint: string | undefined,
  source: FfmpegDiscoverySource,
  deps: DiscoveryDependencies
): Promise<FfmpegDiscoveryResult> {
  if (!deps.fileExists(ffmpegPath)) {
    return { kind: "missing", reason: `${ffmpegPath} does not exist` };
  }

  const ffprobePath = ffprobePathHint ?? deriveFfprobePath(ffmpegPath);
  if (!deps.fileExists(ffprobePath)) {
    return { kind: "missing", reason: `${ffprobePath} does not exist` };
  }

  const ffmpegOk = await deps.validateBinary(ffmpegPath);
  if (!ffmpegOk) {
    return { kind: "missing", reason: `${ffmpegPath} failed -version probe` };
  }

  const ffprobeOk = await deps.validateBinary(ffprobePath);
  if (!ffprobeOk) {
    return { kind: "missing", reason: `${ffprobePath} failed -version probe` };
  }

  return { kind: "found", ffmpegPath, ffprobePath, source };
}

export function deriveFfprobePath(ffmpegPath: string): string {
  const dir = dirname(ffmpegPath);
  return join(dir, `ffprobe${PLATFORM_EXE_SUFFIX}`);
}

function getWindowsKnownLocations(): Array<{ source: FfmpegDiscoverySource; ffmpeg: string }> {
  const locations: Array<{ source: FfmpegDiscoverySource; ffmpeg: string }> = [];
  const localAppData = process.env.LOCALAPPDATA;
  const userProfile = process.env.USERPROFILE;

  if (localAppData) {
    locations.push({
      source: "winget-links",
      ffmpeg: join(localAppData, "Microsoft", "WinGet", "Links", "ffmpeg.exe")
    });
  }
  if (userProfile) {
    locations.push({
      source: "scoop-shims",
      ffmpeg: join(userProfile, "scoop", "shims", "ffmpeg.exe")
    });
    locations.push({
      source: "scoop-apps",
      ffmpeg: join(userProfile, "scoop", "apps", "ffmpeg", "current", "bin", "ffmpeg.exe")
    });
  }
  locations.push({
    source: "chocolatey",
    ffmpeg: "C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe"
  });
  locations.push({
    source: "program-files",
    ffmpeg: "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe"
  });
  locations.push({
    source: "c-root",
    ffmpeg: "C:\\ffmpeg\\bin\\ffmpeg.exe"
  });
  return locations;
}

async function defaultValidateBinary(binaryPath: string): Promise<boolean> {
  try {
    await execFileAsync(binaryPath, ["-version"], {
      timeout: VERSION_PROBE_TIMEOUT_MS,
      windowsHide: true
    });
    return true;
  } catch {
    return false;
  }
}

async function defaultResolveOnPath(command: string): Promise<string | null> {
  const lookupCommand = process.platform === "win32" ? "where" : "which";
  try {
    const { stdout } = await execFileAsync(lookupCommand, [command], {
      timeout: VERSION_PROBE_TIMEOUT_MS,
      windowsHide: true
    });
    const firstLine = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    return firstLine ?? null;
  } catch {
    return null;
  }
}
