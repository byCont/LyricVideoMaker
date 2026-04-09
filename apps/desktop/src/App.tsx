import { useEffect, useMemo, useState } from "react";
import type {
  RenderHistoryEntry,
  RenderProgressEvent,
  SceneOptionField,
  SerializedSceneDefinition
} from "@lyric-video-maker/core";
import type { AppBootstrapData } from "./electron-api";

interface ComposerState {
  audioPath: string;
  subtitlePath: string;
  outputPath: string;
  sceneId: string;
  options: Record<string, unknown>;
}

const emptyState: ComposerState = {
  audioPath: "",
  subtitlePath: "",
  outputPath: "",
  sceneId: "",
  options: {}
};

export function App() {
  const [bootstrap, setBootstrap] = useState<AppBootstrapData | null>(null);
  const [composer, setComposer] = useState<ComposerState>(emptyState);
  const [history, setHistory] = useState<RenderHistoryEntry[]>([]);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const hasActiveRender = history.some((entry) =>
    ["queued", "preparing", "rendering", "muxing"].includes(entry.status)
  );

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
        options: composer.options
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
      <aside className="hero-panel">
        <p className="eyebrow">Lyric Video Composer v1</p>
        <h1>Local full-song lyric video rendering with one HTML/CSS scene contract.</h1>
        <p className="lede">
          Import an <code>.mp3</code> and <code>.srt</code>, choose a built-in scene, fill the schema-driven
          options, and render an <code>.mp4</code> locally through Chromium and <code>ffmpeg</code>.
        </p>
        <div className="hero-stats">
          <div>
            <span>Scenes</span>
            <strong>{bootstrap.scenes.length}</strong>
          </div>
          <div>
            <span>Fonts</span>
            <strong>{bootstrap.fonts.length}</strong>
          </div>
          <div>
            <span>History</span>
            <strong>{history.length}</strong>
          </div>
        </div>
      </aside>

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

          <div className="field-grid options-grid">
            {selectedScene.options.map((field) => (
              <OptionField
                key={field.id}
                field={field}
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
                      <div className="progress-value" style={{ width: `${entry.progress}%` }} />
                    </div>
                    <div className="history-footer">
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      {active ? (
                        <button className="secondary danger" onClick={() => window.lyricVideoApp.cancelRender(entry.id)}>
                          Cancel
                        </button>
                      ) : null}
                    </div>
                    {entry.error ? <p className="history-error">{entry.error}</p> : null}
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
  value,
  fonts,
  onChange,
  onPickImage
}: {
  field: SceneOptionField;
  value: unknown;
  fonts: string[];
  onChange: (value: unknown) => void;
  onPickImage: () => void;
}) {
  switch (field.type) {
    case "number":
      return (
        <label className="field">
          <span>{field.label}</span>
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={typeof value === "number" ? value : field.defaultValue ?? 0}
            onChange={(event) => onChange(Number(event.target.value))}
          />
        </label>
      );
    case "text":
      return (
        <label className="field">
          <span>{field.label}</span>
          {field.multiline ? (
            <textarea value={String(value ?? field.defaultValue ?? "")} onChange={(event) => onChange(event.target.value)} />
          ) : (
            <input value={String(value ?? field.defaultValue ?? "")} onChange={(event) => onChange(event.target.value)} />
          )}
        </label>
      );
    case "color":
      return (
        <label className="field">
          <span>{field.label}</span>
          <input type="color" value={String(value ?? field.defaultValue ?? "#ffffff")} onChange={(event) => onChange(event.target.value)} />
        </label>
      );
    case "font":
      return (
        <label className="field">
          <span>{field.label}</span>
          <select value={String(value ?? field.defaultValue ?? fonts[0])} onChange={(event) => onChange(event.target.value)}>
            {fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>
      );
    case "image":
      return (
        <div className="field file-field">
          <span>{field.label}</span>
          <div className="file-pill">{String(value ?? "") || "Not selected"}</div>
          <button className="secondary" onClick={onPickImage}>
            Pick image
          </button>
        </div>
      );
    case "select":
      return (
        <label className="field">
          <span>{field.label}</span>
          <select value={String(value ?? field.defaultValue ?? "")} onChange={(event) => onChange(event.target.value)}>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    default:
      return null;
  }
}

function upsertHistory(
  history: RenderHistoryEntry[],
  event: RenderProgressEvent | RenderHistoryEntry
): RenderHistoryEntry[] {
  const nextEntry: RenderHistoryEntry =
    "sceneId" in event
      ? event
      : {
          id: event.jobId,
          sceneId: history.find((entry) => entry.id === event.jobId)?.sceneId ?? "unknown-scene",
          outputPath: event.outputPath ?? history.find((entry) => entry.id === event.jobId)?.outputPath ?? "",
          createdAt: history.find((entry) => entry.id === event.jobId)?.createdAt ?? new Date().toISOString(),
          status: event.status,
          progress: event.progress,
          message: event.message,
          error: event.error
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
