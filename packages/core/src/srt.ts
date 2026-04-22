import { LyricCue } from "./types";

const TIMESTAMP_PATTERN =
  /^(?<start>\d{2}:\d{2}:\d{2}[,.]\d{3})\s+-->\s+(?<end>\d{2}:\d{2}:\d{2}[,.]\d{3})$/;

export function parseSrt(input: string): LyricCue[] {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    throw new Error("SRT file is empty.");
  }

  const blocks = normalized.split(/\n{2,}/);
  const cues = blocks.map(parseCueBlock);

  for (let index = 0; index < cues.length; index += 1) {
    const cue = cues[index];
    if (cue.endMs <= cue.startMs) {
      throw new Error(`Cue ${cue.index} ends before it starts.`);
    }

    const previous = cues[index - 1];
    if (previous && cue.startMs < previous.startMs) {
      throw new Error("SRT cues must be in chronological order.");
    }
  }

  return cues;
}

function parseCueBlock(block: string, blockIndex: number): LyricCue {
  const lines = block.split("\n");
  if (lines.length < 2) {
    throw new Error(`Invalid cue block at position ${blockIndex + 1}.`);
  }

  const maybeIndex = lines[0]?.trim();
  const hasExplicitIndex = /^\d+$/.test(maybeIndex ?? "");
  const timingLine = hasExplicitIndex ? lines[1] : lines[0];
  const textLines = hasExplicitIndex ? lines.slice(2) : lines.slice(1);

  const match = timingLine.match(TIMESTAMP_PATTERN);
  if (!match?.groups) {
    throw new Error(`Invalid cue timing line: "${timingLine}".`);
  }

  const text = textLines.join("\n").trim();
  if (!text) {
    throw new Error(`Cue ${maybeIndex ?? blockIndex + 1} has no text.`);
  }

  return {
    index: hasExplicitIndex ? Number(maybeIndex) : blockIndex + 1,
    startMs: parseSrtTimestamp(match.groups.start),
    endMs: parseSrtTimestamp(match.groups.end),
    text,
    lines: text.split("\n")
  };
}

export function parseSrtTimestamp(value: string): number {
  const match = value.match(
    /^(?<hours>\d{2}):(?<minutes>\d{2}):(?<seconds>\d{2})[,.](?<milliseconds>\d{3})$/
  );

  if (!match?.groups) {
    throw new Error(`Invalid timestamp "${value}".`);
  }

  const hours = Number(match.groups.hours);
  const minutes = Number(match.groups.minutes);
  const seconds = Number(match.groups.seconds);
  const milliseconds = Number(match.groups.milliseconds);

  return (((hours * 60 + minutes) * 60 + seconds) * 1000) + milliseconds;
}

export function serializeSrt(cues: LyricCue[]): string {
  return cues
    .map((cue, i) => {
      const start = formatSrtTimestamp(cue.startMs);
      const end = formatSrtTimestamp(cue.endMs);
      return `${i + 1}\n${start} --> ${end}\n${cue.text}`;
    })
    .join("\n\n");
}

function formatSrtTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}
