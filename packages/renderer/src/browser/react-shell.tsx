/**
 * React shell for Chromium render pages.
 *
 * This file is bundled (via esbuild) into a self-contained IIFE that runs
 * inside headless Chromium. It provides:
 *
 *   window.__registerReactComponent(id, Component)  — register a component
 *   window.__mountReactScene(config)                — mount the scene
 *   window.__updateFrameProps(payload)              — update per-frame state
 *
 * The frame readiness gate (window.__frameReadiness) is installed before
 * this shell mounts, so components and the post-commit image scan can
 * register async tasks that must settle before capture.
 */

import React, { useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";

// ---------------------------------------------------------------------------
// Types — duplicated from core since this runs in the browser, not Node.
// ---------------------------------------------------------------------------

interface LyricCue {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
  lines: string[];
}

interface VideoSettings {
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  durationInFrames: number;
}

interface LyricRuntime {
  cues: LyricCue[];
  current: LyricCue | null;
  next: LyricCue | null;
  getCueAt(ms: number): LyricCue | null;
  getNextCue(ms: number): LyricCue | null;
  getCuesInRange(startMs: number, endMs: number): LyricCue[];
  getCueProgress(cue: LyricCue, ms: number): number;
}

interface ValidatedSceneComponentInstance {
  id: string;
  componentId: string;
  componentName: string;
  enabled: boolean;
  options: Record<string, unknown>;
}

interface SceneRenderProps<TOptions = Record<string, unknown>> {
  instance: ValidatedSceneComponentInstance;
  options: TOptions;
  frame: number;
  timeMs: number;
  video: VideoSettings;
  lyrics: LyricRuntime;
  assets: { getUrl(instanceId: string, optionId: string): string | null };
  prepared: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Component registry — populated by the browser bundle before mount.
// ---------------------------------------------------------------------------

type ComponentFunction = (props: SceneRenderProps<any>) => React.ReactElement | null;
const componentRegistry = new Map<string, ComponentFunction>();

(window as any).__registerReactComponent = function (
  id: string,
  component: ComponentFunction
) {
  componentRegistry.set(id, component);
};

// ---------------------------------------------------------------------------
// Scene configuration (sent once at mount time)
// ---------------------------------------------------------------------------

interface ComponentInstanceConfig {
  instanceId: string;
  componentId: string;
  componentName: string;
  options: Record<string, unknown>;
  prepared: Record<string, unknown>;
  resolvedAssets: Record<string, string | null>;
}

export interface ReactSceneConfig {
  video: VideoSettings;
  lyricCues: LyricCue[];
  components: ComponentInstanceConfig[];
}

// ---------------------------------------------------------------------------
// Per-frame payload (sent each frame — intentionally minimal)
// ---------------------------------------------------------------------------

export interface ReactFramePayload {
  frame: number;
  timeMs: number;
}

// ---------------------------------------------------------------------------
// Lyric runtime builder (browser-side)
// ---------------------------------------------------------------------------

function buildLyricRuntime(cues: LyricCue[], timeMs: number): LyricRuntime {
  let current: LyricCue | null = null;
  let next: LyricCue | null = null;

  for (const cue of cues) {
    if (timeMs >= cue.startMs && timeMs < cue.endMs) {
      current = cue;
    } else if (cue.startMs > timeMs && !next) {
      next = cue;
    }
    if (current && next) break;
  }

  return {
    cues,
    current,
    next,
    getCueAt(ms) {
      return cues.find((c) => ms >= c.startMs && ms < c.endMs) ?? null;
    },
    getNextCue(ms) {
      return cues.find((c) => c.startMs > ms) ?? null;
    },
    getCuesInRange(startMs, endMs) {
      return cues.filter((c) => c.endMs > startMs && c.startMs < endMs);
    },
    getCueProgress(cue, ms) {
      const d = cue.endMs - cue.startMs;
      return d <= 0 ? 1 : Math.max(0, Math.min(1, (ms - cue.startMs) / d));
    }
  };
}

// ---------------------------------------------------------------------------
// Scene root — renders all component layers
// ---------------------------------------------------------------------------

function SceneRoot({
  config,
  frameState
}: {
  config: ReactSceneConfig;
  frameState: ReactFramePayload;
}) {
  const lyrics = buildLyricRuntime(config.lyricCues, frameState.timeMs);

  return (
    <div
      style={{
        position: "relative",
        width: config.video.width,
        height: config.video.height,
        overflow: "hidden",
        background: "#09090f"
      }}
    >
      {config.components.map((comp) => {
        const Component = componentRegistry.get(comp.componentId);
        if (!Component) return null;

        const assets = {
          getUrl: (_instanceId: string, optionId: string) =>
            comp.resolvedAssets[optionId] ?? null
        };

        const props: SceneRenderProps = {
          instance: {
            id: comp.instanceId,
            componentId: comp.componentId,
            componentName: comp.componentName,
            enabled: true,
            options: comp.options
          },
          options: comp.options,
          frame: frameState.frame,
          timeMs: frameState.timeMs,
          video: config.video,
          lyrics,
          assets,
          prepared: comp.prepared
        };

        return (
          <div
            key={comp.instanceId}
            data-scene-component-id={comp.componentId}
            data-scene-instance-id={comp.instanceId}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              overflow: "hidden"
            }}
          >
            <Component {...props} />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// App wrapper — holds frame state
// ---------------------------------------------------------------------------

let updateFrameStateFn: ((state: ReactFramePayload) => void) | null = null;

function App({ initialConfig }: { initialConfig: ReactSceneConfig }) {
  const [frameState, setFrameState] = useState<ReactFramePayload>({
    frame: 0,
    timeMs: 0
  });
  updateFrameStateFn = setFrameState;
  return <SceneRoot config={initialConfig} frameState={frameState} />;
}

// ---------------------------------------------------------------------------
// Post-commit image readiness scan
//
// After React commits a DOM update, scan for <img> elements that are still
// loading and register readiness tasks so capture waits for them.
// ---------------------------------------------------------------------------

function scanPendingImages(root: HTMLElement): void {
  const readiness = (window as any).__frameReadiness;
  if (!readiness) return;

  const images = root.querySelectorAll("img");
  for (let i = 0; i < images.length; i++) {
    const img = images[i] as HTMLImageElement;
    if (img.complete && img.naturalWidth > 0) continue;
    if (!img.src) continue;

    const label = img.dataset.videoFrame !== undefined
      ? "video-frame"
      : "image-load";

    const task = new Promise<void>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve();
        }
      }, 1000);

      function finish() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      }

      img.addEventListener("load", () => {
        if (typeof img.decode === "function") {
          img.decode().then(finish, finish);
        } else {
          finish();
        }
      }, { once: true });
      img.addEventListener("error", finish, { once: true });

      if (img.complete) finish();
    });

    readiness.register(task, label);
  }
}

// ---------------------------------------------------------------------------
// Wait for all initial assets (images + fonts) after first mount.
// ---------------------------------------------------------------------------

function waitForAssets(root: HTMLElement): Promise<string[]> {
  const warnings: string[] = [];
  const pendingImages = Array.from(root.querySelectorAll("img")).filter(
    (image) => !image.hasAttribute("data-video-frame")
  );

  const waitForImages =
    pendingImages.length > 0
      ? Promise.all(
        pendingImages.map(
          (image) =>
            new Promise<void>((resolve) => {
              if (image.complete) {
                if (!image.naturalWidth) {
                  warnings.push(
                    "Image failed to decode: " +
                    (image.currentSrc || image.src)
                  );
                }
                resolve();
                return;
              }
              image.addEventListener(
                "load",
                () => {
                  if (!image.naturalWidth) {
                    warnings.push(
                      "Image loaded without pixels: " +
                      (image.currentSrc || image.src)
                    );
                  }
                  resolve();
                },
                { once: true }
              );
              image.addEventListener(
                "error",
                () => {
                  warnings.push(
                    "Image failed to load: " +
                    (image.currentSrc || image.src)
                  );
                  resolve();
                },
                { once: true }
              );
            })
        )
      )
      : Promise.resolve();

  return waitForImages.then(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    return warnings;
  });
}

// ---------------------------------------------------------------------------
// Global API — called from Node.js via CDP page.evaluate()
// ---------------------------------------------------------------------------

let reactRoot: Root | null = null;

(window as any).__mountReactScene = async function (config: ReactSceneConfig) {
  const app = document.getElementById("app");
  if (!app) throw new Error("Render shell app container is missing.");

  app.innerHTML = "";
  reactRoot = createRoot(app);

  flushSync(() => {
    reactRoot!.render(<App initialConfig={config} />);
  });

  const warnings = await waitForAssets(app);
  return { warnings };
};

(window as any).__updateFrameProps = function (payload: ReactFramePayload) {
  if (!updateFrameStateFn) {
    throw new Error("React scene not mounted.");
  }

  // Set current frame for readiness timeout reporting
  const setFrame = (window as any).__frameReadinessSetCurrentFrame;
  if (setFrame) setFrame(payload.frame);

  flushSync(() => {
    updateFrameStateFn!(payload);
  });

  // Scan for images that need loading after React commits
  const app = document.getElementById("app");
  if (app) scanPendingImages(app);
};
