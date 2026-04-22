import React, { useCallback, useEffect, useRef, useState } from "react";
import { lyricVideoApp } from "../../ipc/lyric-video-app";
import type { LyricCue } from "@lyric-video-maker/core";
import { InfoTip } from "../../components/ui/form-fields";
import {
  formatMsToLrc,
  updateCueTime,
  addCueAfter,
  deleteCue,
  joinCues,
  splitCue,
  shiftAllCues
} from "../../lib/subtitle-utils";

export function SubtitleEditorDialog({
  isOpen,
  cues,
  audioPath,
  onSave,
  onDismiss
}: {
  isOpen: boolean;
  cues: LyricCue[];
  audioPath: string;
  onSave: (cues: LyricCue[]) => void | Promise<void>;
  onDismiss: () => void;
}) {
  const [localCues, setLocalCues] = useState<LyricCue[]>([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cueRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioUrl]);

  useEffect(() => {
    let active = true;
    let url: string | undefined;

    if (audioPath && isOpen) {
      lyricVideoApp.readFileBytes(audioPath).then((bytes) => {
        if (!active) return;
        const blob = new Blob([new Uint8Array(bytes)], { type: "audio/mpeg" });
        url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }).catch(err => console.error("Failed to load audio:", err));
    }
    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [audioPath, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLocalCues(cues);
    }
  }, [isOpen, cues]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTimeMs(audioRef.current.currentTime * 1000);
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isPlaying]);

  const updatePreviewTime = useCallback((ms: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000;
    }
  }, []);

  const seekToCue = useCallback((ms: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const handleSave = useCallback(async () => {
    await onSave(localCues);
    onDismiss();
  }, [localCues, onSave, onDismiss]);

  const activeIndex = localCues.findIndex(
    (cue) => currentTimeMs >= cue.startMs && currentTimeMs < cue.endMs
  );

  useEffect(() => {
    if (activeIndex !== -1) {
      const el = cueRefs.current.get(activeIndex);
      if (el && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const offsetTop = el.offsetTop - container.offsetTop;
        if (
          offsetTop < container.scrollTop ||
          offsetTop + el.clientHeight > container.scrollTop + container.clientHeight
        ) {
          container.scrollTo({
            top: offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
            behavior: "smooth"
          });
        }
      }
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        className="dialog-card subtitle-editor-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subtitle-editor-title"
      >
        <div className="panel-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
            <div>
              <p className="eyebrow">Editor</p>
              <div className="panel-title-row">
                <h2 id="subtitle-editor-title">Edit Subtitles</h2>
                <InfoTip text="Adjust timings, edit text, and sync with audio." />
              </div>
            </div>
            <button className="icon-button" onClick={onDismiss} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div className="subtitle-editor-audio-player">
          {audioUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-stack-sm)" }}>
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => setDurationMs(e.currentTarget.duration * 1000)}
                style={{ display: "none" }}
              />
              <div className="preview-transport-row" style={{ display: "flex", alignItems: "center", gap: "var(--space-inline-md)" }}>
                <div className="preview-transport" style={{ display: "flex", alignItems: "center", gap: "var(--space-inline-sm)" }}>
                  <button
                    className={`secondary icon-button preview-play-button${isPlaying ? " is-active" : ""}`}
                    onClick={togglePlayback}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? "\u23F8" : "\u25B6"}
                  </button>
                </div>
                <label className="field preview-scrubber" style={{ flex: 1, margin: 0 }}>
                  <input
                    type="range"
                    min={0}
                    max={durationMs || 100}
                    step={10}
                    value={currentTimeMs}
                    onChange={(e) => updatePreviewTime(Number(e.target.value))}
                  />
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1rem", color: "var(--text-soft)" }}>
                    {volume === 0 ? "🔇" : volume > 0.5 ? "🔊" : "🔉"}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={{ width: "80px", margin: 0, appearance: "auto" }}
                    title="Volume"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Loading audio...</p>
          )}
        </div>

        <div className="subtitle-editor-global-actions">
          <button className="secondary" onClick={() => setLocalCues(shiftAllCues(localCues, -1000))}>
            -1s All
          </button>
          <button className="secondary" onClick={() => setLocalCues(shiftAllCues(localCues, 1000))}>
            +1s All
          </button>
          <button className="secondary" onClick={() => setLocalCues(shiftAllCues(localCues, -100))}>
            -0.1s All
          </button>
          <button className="secondary" onClick={() => setLocalCues(shiftAllCues(localCues, 100))}>
            +0.1s All
          </button>
        </div>

        <div className="dialog-body subtitle-editor-body" ref={scrollContainerRef}>
          <div className="subtitle-cue-list">
            {localCues.map((cue, index) => (
              <div
                key={cue.index}
                ref={(el) => {
                  if (el) cueRefs.current.set(index, el);
                  else cueRefs.current.delete(index);
                }}
                className={`subtitle-cue-entry ${index === activeIndex ? "is-active" : ""}`}
                onClick={() => seekToCue(cue.startMs)}
              >
                <div className="cue-timing-row">
                  <input
                    type="text"
                    value={formatMsToLrc(cue.startMs)}
                    className="time-input"
                    onFocus={() => seekToCue(cue.startMs)}
                    onChange={(e) =>
                      setLocalCues(updateCueTime(localCues, index, "start", e.target.value))
                    }
                  />
                  <span className="timing-sep">→</span>
                  <input
                    type="text"
                    value={formatMsToLrc(cue.endMs)}
                    className="time-input"
                    onFocus={() => seekToCue(cue.startMs)}
                    onChange={(e) =>
                      setLocalCues(updateCueTime(localCues, index, "end", e.target.value))
                    }
                  />
                  <div className="cue-actions">
                    <button
                      className="icon-button"
                      title="Add segment after"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalCues(addCueAfter(localCues, index));
                      }}
                    >
                      +
                    </button>
                    {index > 0 && (
                      <button
                        className="icon-button"
                        title="Join with previous"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalCues(joinCues(localCues, index));
                        }}
                      >
                        ⋈
                      </button>
                    )}
                    <button
                      className="icon-button danger"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalCues(deleteCue(localCues, index));
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <textarea
                  value={cue.text}
                  className="cue-text-input"
                  onFocus={() => seekToCue(cue.startMs)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.shiftKey) {
                      e.preventDefault();
                      setLocalCues(
                        splitCue(localCues, index, (e.target as HTMLTextAreaElement).selectionStart)
                      );
                    }
                  }}
                  onChange={(e) => {
                    const next = [...localCues];
                    next[index] = { ...cue, text: e.target.value, lines: e.target.value.split("\n") };
                    setLocalCues(next);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onDismiss}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
