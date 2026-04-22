import { LyricCue } from "./types";

const LRC_TIMESTAMP_PATTERN = /^\[(?<minutes>\d{1,3}):(?<seconds>\d{2}[.,]\d{2,3})\]/;

/**
 * Parses an LRC subtitle file string into LyricCue array.
 *
 * LRC format is primarily used for songs where each line has a start timestamp [mm:ss.xx]
 * but no explicit end timestamp. The end of a line is inferred from the start of the next.
 */
export function parseLrc(input: string): LyricCue[] {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    throw new Error("LRC file is empty.");
  }

  const lines = normalized.split("\n");
  const rawEntries: { startMs: number; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(LRC_TIMESTAMP_PATTERN);
    if (!match?.groups) {
      if (trimmed.match(/^\[[a-zA-Z]+:/)) {
        continue;
      }
      if (rawEntries.length > 0) {
        rawEntries[rawEntries.length - 1].text += "\n" + trimmed;
      }
      continue;
    }

    const startMs = parseLrcTimestamp(match.groups.minutes, match.groups.seconds);
    const text = trimmed.replace(LRC_TIMESTAMP_PATTERN, "").trim();

    rawEntries.push({ startMs, text });
  }

  if (rawEntries.length === 0) {
    throw new Error("No valid LRC cues found.");
  }

  rawEntries.sort((a, b) => a.startMs - b.startMs);

  const cues: LyricCue[] = [];

  for (let i = 0; i < rawEntries.length; i++) {
    const entry = rawEntries[i];
    if (!entry.text) continue;

    let endMs: number;
    if (i < rawEntries.length - 1) {
      const nextStart = rawEntries[i + 1].startMs;
      const duration = nextStart - entry.startMs;
      endMs = duration > 8000 ? entry.startMs + 7000 : nextStart;
    } else {
      endMs = entry.startMs + 8000;
    }

    cues.push({
      index: i + 1,
      startMs: entry.startMs,
      endMs,
      text: entry.text,
      lines: entry.text.split("\n")
    });
  }

  return cues;
}

/**
 * Converts mm:ss.xx or mm:ss.xxx to milliseconds.
 */
function parseLrcTimestamp(minutesStr: string, secondsStr: string): number {
  const minutes = Number(minutesStr);
  const secondsRaw = secondsStr.replace(",", ".");
  const seconds = parseFloat(secondsRaw);

  return (minutes * 60 + seconds) * 1000;
}

export function serializeLrc(cues: LyricCue[]): string {
  return cues
    .map((cue) => {
      const timestamp = formatLrcTimestamp(cue.startMs);
      return `[${timestamp}]${cue.text}`;
    })
    .join("\n");
}

function formatLrcTimestamp(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return `${String(minutes).padStart(2, "0")}:${seconds.padStart(5, "0")}`;
}

