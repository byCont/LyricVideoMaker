import type { LyricCue } from "@lyric-video-maker/core";

export function formatMsToLrc(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return `${String(minutes).padStart(2, "0")}:${seconds.padStart(5, "0")}`;
}

export function parseLrcTimeToMs(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return NaN;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseFloat(parts[1]);
  if (isNaN(minutes) || isNaN(seconds)) return NaN;
  return (minutes * 60 + seconds) * 1000;
}

export function updateCueTime(
  cues: LyricCue[],
  index: number,
  field: "start" | "end",
  value: string
): LyricCue[] {
  const ms = parseLrcTimeToMs(value);
  if (isNaN(ms)) return cues;

  const nextCues = [...cues];
  const cue = { ...nextCues[index] };
  if (field === "start") {
    cue.startMs = ms;
  } else {
    cue.endMs = ms;
  }
  nextCues[index] = cue;
  return nextCues;
}

export function addCueAfter(cues: LyricCue[], index: number): LyricCue[] {
  const previousCue = cues[index];
  const startMs = previousCue ? previousCue.endMs : 0;
  const endMs = startMs + 5000;
  const nextCues = [...cues];
  nextCues.splice(index + 1, 0, {
    index: 0, // Will be re-indexed if needed
    startMs,
    endMs,
    text: "",
    lines: []
  });
  return reIndexCues(nextCues);
}

export function deleteCue(cues: LyricCue[], index: number): LyricCue[] {
  const nextCues = [...cues];
  nextCues.splice(index, 1);
  return reIndexCues(nextCues);
}

export function joinCues(cues: LyricCue[], index: number): LyricCue[] {
  if (index <= 0 || index >= cues.length) return cues;

  const nextCues = [...cues];
  const prev = { ...nextCues[index - 1] };
  const curr = nextCues[index];

  prev.text = prev.text + (prev.text && curr.text ? "\n" : "") + curr.text;
  prev.lines = prev.text.split("\n");
  prev.endMs = curr.endMs;

  nextCues[index - 1] = prev;
  nextCues.splice(index, 1);
  return reIndexCues(nextCues);
}

export function splitCue(cues: LyricCue[], index: number, cursorPosition: number): LyricCue[] {
  const cue = cues[index];
  const textBefore = cue.text.slice(0, cursorPosition);
  const textAfter = cue.text.slice(cursorPosition);
  
  const totalDuration = cue.endMs - cue.startMs;
  const ratio = cursorPosition / (cue.text.length || 1);
  const splitMs = Math.round(cue.startMs + totalDuration * ratio);

  const nextCues = [...cues];
  nextCues[index] = {
    ...cue,
    text: textBefore.trim(),
    lines: textBefore.trim().split("\n"),
    endMs: splitMs
  };

  nextCues.splice(index + 1, 0, {
    index: 0,
    startMs: splitMs,
    endMs: cue.endMs,
    text: textAfter.trim(),
    lines: textAfter.trim().split("\n")
  });

  return reIndexCues(nextCues);
}

export function shiftAllCues(cues: LyricCue[], deltaMs: number): LyricCue[] {
  return cues.map((cue) => ({
    ...cue,
    startMs: Math.max(0, cue.startMs + deltaMs),
    endMs: Math.max(0, cue.endMs + deltaMs)
  }));
}

function reIndexCues(cues: LyricCue[]): LyricCue[] {
  return cues.map((cue, i) => ({
    ...cue,
    index: i + 1
  }));
}
