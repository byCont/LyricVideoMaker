export const ASSET_URL_PREFIX = "http://lyric-video.local/assets/";
export const VIDEO_FRAME_URL_PREFIX = "http://lyric-video.local/video-frames/";
export const FONT_URL_PREFIX = "http://lyric-video.local/fonts/";
export const PROGRESS_INTERVAL_MS = 250;

const DEFAULT_FFMPEG_COMMAND = "ffmpeg";
const DEFAULT_FFPROBE_COMMAND = "ffprobe";

/**
 * Returns the ffmpeg command/path to spawn. Reads
 * `LYRIC_VIDEO_FFMPEG_PATH` from `process.env` on every call so the host
 * (Electron main process) can set it after `app.whenReady()` runs and
 * still have renderer modules pick up the value. Falls back to the bare
 * `ffmpeg` name so unit tests and shell-PATH dev still work.
 */
export function getFfmpegCommand(): string {
  const override = process.env.LYRIC_VIDEO_FFMPEG_PATH;
  return override && override.trim() ? override : DEFAULT_FFMPEG_COMMAND;
}

/** Same lazy-resolution behavior as `getFfmpegCommand`, for ffprobe. */
export function getFfprobeCommand(): string {
  const override = process.env.LYRIC_VIDEO_FFPROBE_PATH;
  return override && override.trim() ? override : DEFAULT_FFPROBE_COMMAND;
}

export const MUX_WRITE_TIMEOUT_MS =
  normalizePositiveInteger(process.env.LYRIC_VIDEO_FFMPEG_WRITE_TIMEOUT_MS) ?? 15000;
export const FRAME_STAGE_TIMEOUT_MS =
  normalizePositiveInteger(process.env.LYRIC_VIDEO_FRAME_STAGE_TIMEOUT_MS) ?? 15000;
export const WORKER_FRAME_RETRY_LIMIT =
  normalizePositiveInteger(process.env.LYRIC_VIDEO_WORKER_FRAME_RETRY_LIMIT) ?? 2;
export const FFMPEG_STDERR_BUFFER_LIMIT_BYTES = 64 * 1024;

export function normalizePositiveInteger(value: number | string | undefined) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : undefined;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  return undefined;
}
