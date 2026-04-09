import { useEffect, useMemo, useState } from "react";
import type {
  VideoSettings,
  RenderHistoryEntry,
  RenderProgressEvent,
  SceneOptionCategory,
  SceneOptionEntry,
  SceneOptionField,
  SerializedSceneDefinition
} from "@lyric-video-maker/core";
import {
  DEFAULT_VIDEO_FPS,
  DEFAULT_VIDEO_HEIGHT,
  DEFAULT_VIDEO_WIDTH,
  isSceneOptionCategory
} from "@lyric-video-maker/core";
import type { AppBootstrapData } from "./electron-api";

interface ComposerState {
  audioPath: string;
  subtitlePath: string;
  outputPath: string;
  sceneId: string;
  options: Record<string, unknown>;
  video: Pick<VideoSettings, "width" | "height" | "fps">;
}

const emptyState: ComposerState = {
  audioPath: "",
  subtitlePath: "",
  outputPath: "",
  sceneId: "",
  options: {},
  video: {
    width: DEFAULT_VIDEO_WIDTH,
    height: DEFAULT_VIDEO_HEIGHT,
    fps: DEFAULT_VIDEO_FPS
  }
};

export function App() {
  const [bootstrap, setBootstrap] = useState<AppBootstrapData | null>(null);
  const [composer, setComposer] = useState<ComposerState>(emptyState);
  const [history, setHistory] = useState<RenderHistoryEntry[]>([]);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void window.lyricVideoApp.getBootstrapData().then((data) => {
      setBootstrap(data);
      setHistory(data.history);

      const initialScene = data.scenes[0];
      if (initialScene) {
        setComposer((current) => ({
          ...current,
          sceneId: initialScene.id,
          options: structuredClone(initialScene.defaultOptions)
        }));
      }
    });

    unsubscribe = window.lyricVideoApp.onRenderProgress((event) => {
      setHistory((current) => upsertHistory(current, event));
      setIsSubmitting(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const selectedScene = useMemo(
    () => bootstrap?.scenes.find((scene) => scene.id === composer.sceneId) ?? null,
    [bootstrap?.scenes, composer.sceneId]
  );
  const topLevelOptions = useMemo(
    () => selectedScene?.options.filter((option): option is SceneOptionField => !isSceneOptionCategory(option)) ?? [],
    [selectedScene]
  );
  const categorizedOptions = useMemo(
    () => selectedScene?.options.filter(isSceneOptionCategory) ?? [],
    [selectedScene]
  );

  const hasActiveRender = history.some((entry) =>
    ["queued", "preparing", "rendering", "muxing"].includes(entry.status)
  );

  useEffect(() => {
    if (!selectedScene) {
      return;
    }

    setExpandedCategories((current) => {
      const nextState = { ...current };

      for (const option of selectedScene.options) {
        if (isSceneOptionCategory(option)) {
          const categoryKey = getCategoryStateKey(selectedScene.id, option.id);
          if (nextState[categoryKey] === undefined) {
            nextState[categoryKey] = option.defaultExpanded ?? true;
          }
        }
      }

      return nextState;
    });
  }, [selectedScene]);

  if (!bootstrap || !selectedScene) {
    return <div className="app-shell loading">Loading composer...</div>;
  }

  async function handlePickPath(kind: "audio" | "subtitle" | "image" | "output", optionId?: string) {
    const suggestedName =
      kind === "output" && composer.audioPath
        ? `${stripExtension(getFileName(composer.audioPath))}.mp4`
        : undefined;

    const result = await window.lyricVideoApp.pickPath(kind, suggestedName);
    if (!result) {
      return;
    }

    setError("");

    if (kind === "audio") {
      setComposer((current) => ({ ...current, audioPath: result }));
      return;
    }

    if (kind === "subtitle") {
      setComposer((current) => ({ ...current, subtitlePath: result }));
      return;
    }

    if (kind === "output") {
      setComposer((current) => ({ ...current, outputPath: result }));
      return;
    }

    if (optionId) {
      setComposer((current) => ({
        ...current,
        options: {
          ...current.options,
          [optionId]: result
        }
      }));
    }
  }

  async function handleSubmit() {
    if (!composer.audioPath || !composer.subtitlePath || !composer.outputPath) {
      setError("Audio, subtitles, and output path are required.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const entry = await window.lyricVideoApp.startRender({
        audioPath: composer.audioPath,
        subtitlePath: composer.subtitlePath,
        outputPath: composer.outputPath,
        sceneId: composer.sceneId,
        options: composer.options,
        video: composer.video
      });

      setHistory((current) => upsertHistory(current, entry));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : String(submissionError));
      setIsSubmitting(false);
    }
  }

  function handleSceneChange(sceneId: string) {
    if (!bootstrap) {
      return;
    }

    const nextScene = bootstrap.scenes.find((scene) => scene.id === sceneId);
    if (!nextScene) {
      return;
    }

    setComposer((current) => ({
      ...current,
      sceneId,
      options: structuredClone(nextScene.defaultOptions)
    }));
  }

  return (
    <div className="app-shell">
      <main className="workspace">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Import</p>
              <h2>Source files</h2>
            </div>
            <button className="secondary" onClick={() => handlePickPath("output")}>
              Choose output
            </button>
          </div>

          <div className="field-grid">
            <FileField
              label="Song audio"
              value={composer.audioPath}
              buttonLabel="Pick MP3"
              onPick={() => handlePickPath("audio")}
            />
            <FileField
              label="Lyric subtitles"
              value={composer.subtitlePath}
              buttonLabel="Pick SRT"
              onPick={() => handlePickPath("subtitle")}
            />
            <FileField
              label="Output MP4"
              value={composer.outputPath}
              buttonLabel="Save As"
              onPick={() => handlePickPath("output")}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Video</p>
              <h2>Video parameters</h2>
            </div>
          </div>

          <div className="video-param-grid">
            <NumberField
              label="Width"
              value={composer.video.width}
              min={16}
              step={1}
              onChange={(value) =>
                setComposer((current) => ({
                  ...current,
                  video: {
                    ...current.video,
                    width: value
                  }
                }))
              }
            />
            <NumberField
              label="Height"
              value={composer.video.height}
              min={16}
              step={1}
              onChange={(value) =>
                setComposer((current) => ({
                  ...current,
                  video: {
                    ...current.video,
                    height: value
                  }
                }))
              }
            />
            <NumberField
              label="Frame rate"
              value={composer.video.fps}
              min={1}
              step={1}
              onChange={(value) =>
                setComposer((current) => ({
                  ...current,
                  video: {
                    ...current.video,
                    fps: value
                  }
                }))
              }
            />
          </div>

          <p className="video-param-hint">
            Default render target is {DEFAULT_VIDEO_WIDTH}x{DEFAULT_VIDEO_HEIGHT} at {DEFAULT_VIDEO_FPS} fps.
          </p>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Scene</p>
              <h2>Built-in scenes</h2>
            </div>
          </div>

          <label className="field">
            <span>Scene preset</span>
            <select value={composer.sceneId} onChange={(event) => handleSceneChange(event.target.value)}>
              {bootstrap.scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.name}
                </option>
              ))}
            </select>
          </label>

          <p className="scene-description">{selectedScene.description}</p>

          <div className="scene-options">
            {topLevelOptions.length > 0 ? (
              <div className="option-list top-level-options">
                {topLevelOptions.map((field) => (
                  <OptionField
                    key={field.id}
                    field={field}
                    sceneId={selectedScene.id}
                    fonts={bootstrap.fonts}
                    value={composer.options[field.id]}
                    onChange={(value) =>
                      setComposer((current) => ({
                        ...current,
                        options: {
                          ...current.options,
                          [field.id]: value
                        }
                      }))
                    }
                    onPickImage={() => handlePickPath("image", field.id)}
                  />
                ))}
              </div>
            ) : null}

            {categorizedOptions.map((category) => (
              <OptionCategorySection
                key={category.id}
                category={category}
                isExpanded={
                  expandedCategories[getCategoryStateKey(selectedScene.id, category.id)] ??
                  category.defaultExpanded ??
                  true
                }
                onToggle={() =>
                  setExpandedCategories((current) => ({
                    ...current,
                    [getCategoryStateKey(selectedScene.id, category.id)]:
                      !(current[getCategoryStateKey(selectedScene.id, category.id)] ??
                        category.defaultExpanded ??
                        true)
                  }))
                }
              >
                {category.options.map((field) => (
                  <OptionField
                    key={field.id}
                    field={field}
                    sceneId={selectedScene.id}
                    fonts={bootstrap.fonts}
                    value={composer.options[field.id]}
                    onChange={(value) =>
                      setComposer((current) => ({
                        ...current,
                        options: {
                          ...current.options,
                          [field.id]: value
                        }
                      }))
                    }
                    onPickImage={() => handlePickPath("image", field.id)}
                  />
                ))}
              </OptionCategorySection>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Render</p>
              <h2>Job control</h2>
            </div>
            <button className="primary" disabled={isSubmitting || hasActiveRender} onClick={handleSubmit}>
              {isSubmitting || hasActiveRender ? "Rendering..." : "Render MP4"}
            </button>
          </div>

          {error ? <p className="error-banner">{error}</p> : null}

          <ul className="history-list">
            {history.length === 0 ? (
              <li className="history-empty">No renders yet.</li>
            ) : (
              history.map((entry) => {
                const active = ["queued", "preparing", "rendering", "muxing"].includes(entry.status);

                return (
                  <li key={entry.id} className="history-item">
                    <div className="history-meta">
                      <div>
                        <strong>{entry.sceneId}</strong>
                        <p>{getFileName(entry.outputPath)}</p>
                      </div>
                      <span className={`status status-${entry.status}`}>{entry.status}</span>
                    </div>
                    <p className="history-message">{entry.message}</p>
                    <div className="progress-track">
                      <div className="progress-value" style={{ width: `${Math.max(0, Math.min(100, entry.progress))}%` }} />
                    </div>
                    {entry.status === "rendering" ? (
                      <div className="history-stats">
                        <span>{entry.renderFps ? `${entry.renderFps.toFixed(2)} fps` : "Measuring speed..."}</span>
                        <span>{entry.etaMs !== undefined ? `ETA ${formatEta(entry.etaMs)}` : "ETA calculating..."}</span>
                      </div>
                    ) : null}
                    <div className="history-footer">
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      {active ? (
                        <button className="secondary danger" onClick={() => window.lyricVideoApp.cancelRender(entry.id)}>
                          Cancel
                        </button>
                      ) : null}
                    </div>
                    {entry.error ? <p className="history-error">{entry.error}</p> : null}
                    {entry.logs && entry.logs.length > 0 ? (
                      <details className="history-logs">
                        <summary>Logs ({entry.logs.length})</summary>
                        <div className="history-log-list">
                          {entry.logs.map((log, index) => (
                            <div key={`${log.timestamp}-${index}`} className={`history-log history-log-${log.level}`}>
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                              <strong>{log.level}</strong>
                              <p>{log.message}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}

function OptionCategorySection({
  category,
  isExpanded,
  onToggle,
  children
}: {
  category: SceneOptionCategory;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="option-category">
      <button type="button" className="option-category-toggle" onClick={onToggle}>
        <span>{category.label}</span>
        <span className="option-category-chevron">{isExpanded ? "−" : "+"}</span>
      </button>
      {isExpanded ? <div className="option-list">{children}</div> : null}
    </section>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function FileField({
  label,
  value,
  buttonLabel,
  onPick
}: {
  label: string;
  value: string;
  buttonLabel: string;
  onPick: () => void;
}) {
  return (
    <div className="field file-field">
      <span>{label}</span>
      <div className="file-pill">{value || "Not selected"}</div>
      <button className="secondary" onClick={onPick}>
        {buttonLabel}
      </button>
    </div>
  );
}

function OptionField({
  field,
  sceneId,
  value,
  fonts,
  onChange,
  onPickImage
}: {
  field: SceneOptionField;
  sceneId: string;
  value: unknown;
  fonts: string[];
  onChange: (value: unknown) => void;
  onPickImage: () => void;
}) {
  const inputId = `${sceneId}-${field.id}`;

  switch (field.type) {
    case "boolean":
      return (
        <div className="option-row">
          <label className="option-label" htmlFor={inputId}>
            {field.label}
          </label>
          <div className="option-input checkbox-input">
            <input
              id={inputId}
              type="checkbox"
              checked={Boolean(value ?? field.defaultValue ?? false)}
              onChange={(event) => onChange(event.target.checked)}
            />
          </div>
        </div>
      );
    case "number":
      return (
        <div className="option-row">
          <label className="option-label" htmlFor={inputId}>
            {field.label}
          </label>
          <div className="option-input">
            <input
              id={inputId}
              type="number"
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              value={typeof value === "number" ? value : field.defaultValue ?? 0}
              onChange={(event) => onChange(Number(event.target.value))}
            />
          </div>
        </div>
      );
    case "text":
      return (
        <div className="option-row option-row-multiline">
          <label className="option-label" htmlFor={inputId}>
            {field.label}
          </label>
          <div className="option-input">
            {field.multiline ? (
              <textarea id={inputId} value={String(value ?? field.defaultValue ?? "")} onChange={(event) => onChange(event.target.value)} />
            ) : (
              <input id={inputId} value={String(value ?? field.defaultValue ?? "")} onChange={(event) => onChange(event.target.value)} />
            )}
          </div>
        </div>
      );
    case "color":
      return (
        <div className="option-row">
          <label className="option-label" htmlFor={inputId}>
            {field.label}
          </label>
          <div className="option-input">
            <input
              id={inputId}
              type="color"
              value={String(value ?? field.defaultValue ?? "#ffffff")}
              onChange={(event) => onChange(event.target.value)}
            />
          </div>
        </div>
      );
    case "font":
      return (
        <div className="option-row">
          <label className="option-label" htmlFor={inputId}>
            {field.label}
          </label>
          <div className="option-input">
            <select id={inputId} value={String(value ?? field.defaultValue ?? fonts[0])} onChange={(event) => onChange(event.target.value)}>
              {fonts.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    case "image":
      return (
        <div className="option-row option-row-multiline">
          <div className="option-label">{field.label}</div>
          <div className="option-input file-picker-input">
            <div className="file-pill">{String(value ?? "") || "Not selected"}</div>
            <button className="secondary" onClick={onPickImage}>
              Pick image
            </button>
          </div>
        </div>
      );
    case "select":
      return (
        <div className="option-row">
          <label className="option-label" htmlFor={inputId}>
            {field.label}
          </label>
          <div className="option-input">
            <select id={inputId} value={String(value ?? field.defaultValue ?? "")} onChange={(event) => onChange(event.target.value)}>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function upsertHistory(
  history: RenderHistoryEntry[],
  event: RenderProgressEvent | RenderHistoryEntry
): RenderHistoryEntry[] {
  const currentEntry =
    "sceneId" in event ? history.find((entry) => entry.id === event.id) : history.find((entry) => entry.id === event.jobId);
  const nextEntry: RenderHistoryEntry =
    "sceneId" in event
      ? event
      : {
          id: event.jobId,
          sceneId: currentEntry?.sceneId ?? "unknown-scene",
          outputPath: event.outputPath ?? currentEntry?.outputPath ?? "",
          createdAt: currentEntry?.createdAt ?? new Date().toISOString(),
          status: Number.isFinite(event.progress) ? event.status : currentEntry?.status ?? event.status,
          progress: Number.isFinite(event.progress) ? event.progress : currentEntry?.progress ?? 0,
          message:
            event.logEntry && !Number.isFinite(event.progress)
              ? currentEntry?.message ?? event.message
              : event.message,
          etaMs: Number.isFinite(event.progress) ? event.etaMs : currentEntry?.etaMs,
          renderFps: Number.isFinite(event.progress) ? event.renderFps : currentEntry?.renderFps,
          error: event.error ?? currentEntry?.error,
          logs: event.logEntry ? [...(currentEntry?.logs ?? []), event.logEntry] : currentEntry?.logs
        };

  const withoutEntry = history.filter((entry) => entry.id !== nextEntry.id);
  return [nextEntry, ...withoutEntry].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function getFileName(path: string) {
  return path.split(/[\\/]/).pop() ?? path;
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function formatEta(etaMs: number) {
  const totalSeconds = Math.max(0, Math.round(etaMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getCategoryStateKey(sceneId: string, categoryId: string) {
  return `${sceneId}:${categoryId}`;
}
