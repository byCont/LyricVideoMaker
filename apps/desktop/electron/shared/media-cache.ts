import { readFile, stat } from "node:fs/promises";
import { parseLrc, parseSrt, type LyricCue } from "@lyric-video-maker/core";
import { probeAudioDurationMs } from "@lyric-video-maker/renderer";

/**
 * Each call to {@link createSubtitleCueLoader} returns a fresh loader bound to
 * its own in-memory `Map<string, LyricCue[]>`. The main process and the
 * preview worker thread each hold their own instance — runtime cache sharing
 * across the worker boundary would require IPC and is intentionally avoided.
 */
export function createSubtitleCueLoader() {
  const cache = new Map<string, { cues: LyricCue[]; mtime: number }>();
  return async (subtitlePath: string) => {
    let fileStat;
    try {
      fileStat = await stat(subtitlePath);
    } catch {
      return [];
    }

    const cached = cache.get(subtitlePath);
    if (cached && cached.mtime === fileStat.mtimeMs) {
      return cached.cues;
    }

    const subtitleSource = await readFile(subtitlePath, "utf8");
    const isLrc = subtitlePath.toLowerCase().endsWith(".lrc");
    const cues = isLrc ? parseLrc(subtitleSource) : parseSrt(subtitleSource);
    cache.set(subtitlePath, { cues, mtime: fileStat.mtimeMs });
    return cues;
  };
}

/**
 * Each call to {@link createAudioDurationLoader} returns a fresh loader bound
 * to its own in-memory `Map<string, number>`. See {@link createSubtitleCueLoader}
 * for the rationale behind per-process caches.
 */
export function createAudioDurationLoader() {
  const cache = new Map<string, number>();
  return async (audioPath: string) => {
    const cached = cache.get(audioPath);
    if (cached !== undefined) {
      return cached;
    }
    const durationMs = await probeAudioDurationMs(audioPath);
    cache.set(audioPath, durationMs);
    return durationMs;
  };
}
