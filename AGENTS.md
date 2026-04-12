# AGENTS.md

## Purpose

Local desktop lyric-video renderer repo.

v1 scope:

- Electron desktop shell
- React renderer-process UI
- Shared `core` pkg — subtitle parsing, scene contracts, option validation, render-job creation
- `scene-registry` pkg — built-in scenes, reusable scene components
- `renderer` pkg — renders HTML/CSS scenes via headless Chromium, muxes w/ source audio via `ffmpeg`

One built-in scene for full song: `single-image-lyrics`.

## Start Here

New to repo, read these first:

1. [package.json](./package.json)
2. [apps/desktop/electron/main.ts](./apps/desktop/electron/main.ts) — slim composition entry; collaborators in `electron/services/` and `electron/ipc/`
3. [apps/desktop/electron/ipc/register-ipc-handlers.ts](./apps/desktop/electron/ipc/register-ipc-handlers.ts) — IPC surface, one file per feature under `electron/ipc/`
4. [apps/desktop/src/App.tsx](./apps/desktop/src/App.tsx) — slim composition; state in `src/state/*`, features in `src/features/*`
5. [packages/core/src/types/scene-component.ts](./packages/core/src/types/scene-component.ts) — scene contract types
6. [packages/core/src/scenes/option-validation.ts](./packages/core/src/scenes/option-validation.ts) — scene + option validation
7. [packages/core/src/scenes/render-job.ts](./packages/core/src/scenes/render-job.ts) — render-job builder
8. [packages/scene-registry/src/scenes/single-image-lyrics/index.ts](./packages/scene-registry/src/scenes/single-image-lyrics/index.ts) — built-in scene composition
9. [packages/scene-registry/src/components/equalizer/component.ts](./packages/scene-registry/src/components/equalizer/component.ts) — example folder-component assembly
10. [packages/renderer/src/index.ts](./packages/renderer/src/index.ts) — renderer public barrel
11. [packages/renderer/src/pipeline/render-lyric-video.ts](./packages/renderer/src/pipeline/render-lyric-video.ts) — main render orchestrator

Shows app boundary, IPC contract, UI composition, shared scene contract, built-in scene structure, render pipeline.

## Repo Layout

### `apps/desktop`

Electron + React desktop app, layered structure on both sides of IPC boundary.

#### Electron main process (`apps/desktop/electron/`)

- `main.ts`: tsup entry, ~60 lines. Wires services, registers IPC handlers, opens main window.
- `preload.ts`: tsup entry. Exposes safe renderer API on `window.lyricVideoApp`.
- `preview-worker-thread.ts`: tsup entry, ~40 lines. Worker thread bootstrap delegating to `services/preview/worker-runtime.ts`.
- `app/`: app lifecycle helpers — `create-window.ts`, `app-paths.ts` (sidecar root resolution), `preview-profiler.ts`.
- `ipc/`: one file per feature, each exports `registerXxxHandlers(deps)` called by `register-ipc-handlers.ts`. Files: `bootstrap-handlers`, `dialog-handlers`, `scene-handlers`, `render-handlers`, `subtitle-handlers`, `preview-handlers`. **All IPC channel strings live here** — never hardcoded in `main.ts`.
- `services/`: behavior decoupled from IPC plumbing. `render-history.ts`, `scene-catalog.ts`, `render-job-runner.ts`, `scene-library.ts` (user scene persistence), `subtitle-generator/` (Python sidecar runner), `preview/` (`worker-client.ts`, `worker-protocol.ts`, `render-queue.ts`, `worker-runtime.ts`).
- `shared/`: cross-cutting code for main process + worker thread — `media-cache.ts` (shared subtitle/audio loader factories), `clamp.ts`.

#### React renderer (`apps/desktop/src/`)

- `App.tsx`: slim composition. Hooks, memos, feature components into workspace layout.
- `main.tsx`: Vite entry. Imports `./styles/index.css`.
- `electron-api.ts`: shared IPC type contracts. Source of truth for `ElectronApi` interface + all IPC payload types — imported by `electron/preload.ts` and renderer code.
- `state/`: domain hooks — `use-bootstrap`, `use-composer`, `use-workspace-selection`, `use-render-job`, `use-subtitle-generation`, `use-layout-resize`. Domain types `composer-types.ts`, `workspace-types.ts` here too.
- `features/`: one folder per feature card w/ top-level component — `project-setup`, `workspace-nav`, `preview`, `scene-editor`, `component-editor`, `subtitle-generation`, `render-progress`.
- `components/ui/form-fields.tsx`: reusable form primitives (`InfoTip`, `FieldLabel`, `NumberField`, `SelectField`, `FileField`, `OptionField`, `OptionCategorySection`).
- `hooks/use-frame-preview.ts`: debounced preview-frame request hook w/ object-URL lifecycle.
- `ipc/`: thin renderer-side wrapper. `lyric-video-app.ts` — dynamic-lookup proxy around `window.lyricVideoApp` (tests can mock global). `use-render-progress.ts` and `use-subtitle-progress.ts` — tiny `useEffect` wrappers around subscription methods.
- `lib/`: pure non-React helpers — `composer-helpers`, `video-presets`, `path-utils`, `format`, `render-history`, `subtitle-request`, `clamp`.
- `styles/`: monolithic CSS in 5 cascade-ordered files — `index.css` imports `tokens.css` → `base.css` → `layout.css` → `forms.css` → `components.css`. Preserve cascade order when adding rules.
- `vite.config.ts`: renderer-process bundling; `base: "./"` matters for `file://` startup.

### `packages/core`

Shared domain logic. Put logic here when needed by both Electron and renderer. Layered into focused subdirs; `src/index.ts` barrel re-exports everything.

- `src/constants.ts`: defaults — video size, fps, scene-file version, supported fonts
- `src/srt.ts`: subtitle parsing (single-purpose)
- `src/timeline/`: cue lookup, frame/time conversion, stateful runtime cursor
  - `cue-lookup.ts`, `frame-time.ts`, `runtime.ts`
- `src/types/`: domain types split by concern
  - `lyric.ts`, `video.ts`, `scene-options.ts`, `scene-audio.ts`, `scene-component.ts`, `render.ts`
- `src/scenes/`: option validation, scene serialization, render-job creation
  - `option-validation.ts`, `serialization.ts`, `render-job.ts`

### `packages/scene-registry`

Built-in scenes + reusable scene components. `src/index.ts` public barrel.

- `src/index.ts`: exports built-in scenes/components + lookup helpers
- `src/shared/`: package-internal utils across components — `color.ts` (`withAlpha`, `mixHex`, `parseHexColor`, `rgbToHex`), `math.ts` (`clamp01`, `safeScale`). Components import via relative paths; not re-exported from barrel.
- `src/components/background-image.tsx`, `background-color.tsx`: small single-file components
- `src/components/lyrics-by-line/`: folder-component — `types.ts`, `options-schema.ts`, `caches.ts`, `measurement.ts`, `fade.ts`, `layout.ts`, `typography.ts`, `browser-state.ts`, `react/component.tsx`, `component.ts` (assembly), `index.ts`
- `src/components/equalizer/`: folder-component — `types.ts`, `options-schema.ts`, `validation.ts`, `prepare.ts`, `layout.ts`, `color-plan.ts`, `bar-plan.ts`, `line-geometry.ts`, `shadow.ts`, `static-values.ts`, `browser-state.ts`, `react/{component,equalizer-bar,equalizer-line-graph}.tsx`, `component.ts`, `index.ts`
- `src/scenes/single-image-lyrics/index.ts`: only built-in scene in v1

Heavy work belongs in component `prepare(...)`, not per-frame rendering.

### `packages/renderer`

Headless render coordinator. `src/index.ts` thin public barrel; behavior in focused subdirs.

- `src/index.ts`: public barrel — `renderLyricVideo`, `createFramePreviewSession`, `probeAudioDurationMs`, preview cache factories, test-exported helpers
- `src/constants.ts`: tunables + resolved ffmpeg/ffprobe paths
- `src/types.ts`: shared internal types (`RenderLogger`, `FrameMuxer`, profiling types, etc.)
- `src/abort.ts`: `throwIfAborted`, `createAbortError`, `isAbortError`
- `src/logging.ts`: `createRenderLogger`, `createLogEntry`
- `src/profiling.ts`: render/preview profilers, measure helpers, `traceRenderStep`
- `src/ffmpeg/`: subprocess + mux pipeline — `run-command.ts` (single source for `runCommand`/`runBinaryCommand`), `probe.ts`, `frame-muxer.ts`, `frame-writer.ts`, `bounded-output-buffer.ts`, `mux-diagnostics.ts`
- `src/browser/`: headless Chromium orchestration over CDP — `chromium-loader.ts` (resolves bundled Chromium binary), `launch.ts` (spawns Chromium with `--remote-debugging-port`), `cdp-session.ts` (CRI wrapper exposing `BrowserClient` / `PageClient`), `render-page.ts`, `asset-routes.ts`, `capture.ts`, `diagnostics.ts`, `dispose.ts`, `live-dom-session.ts`
- `src/react-ssr/`: server-side React markup — `composite-markup.ts`, `lyric-runtime-bridge.ts`
- `src/scene-prep/`: component prepare orchestration — `prepare-components.ts`, `cache-keys.ts`
- `src/assets/`: asset preload + serve — `preload.ts`, `cache-body.ts`, `mime.ts`, `preview-cache.ts`
- `src/pipeline/`: top-level orchestration — `render-lyric-video.ts`, `preview-session.ts`, `worker-frames.ts`, `parallelism.ts`, `frame-queue.ts`, `ordered-frame-queue.ts`, `progress.ts`, `static-detection.ts`
- `src/audio-analysis.ts`: audio spectrum extraction (uses shared `ffmpeg/run-command.ts`)
- `src/live-dom.ts`: live DOM scene mounting/update for Chromium render path. **Known coupling: hardcodes `runtimeRegistry` for four built-in component IDs (`background-image`, `background-color`, `lyrics-by-line`, `equalizer`).** New built-in component requires editing this file too. Decoupling intentionally deferred — needs contract change to `SceneBrowserRuntimeDefinition` + design pass for serialized browser-side runtime scripts.
- `tests/*`: render smoke, benchmark, preview-session, parallel-rendering, audio-analysis coverage

## Data And Render Flow

Happy path:

1. Renderer UI collects `mp3`, `srt`, scene selection, scene options, output path.
2. Electron main parses SRT, probes audio duration, validates options, creates `RenderJob`.
3. Electron main calls `renderLyricVideo(...)` from `packages/renderer`.
4. Renderer runs optional scene `prepare(...)`.
5. Each frame: server-render scene React component to static HTML.
6. Bundled headless Chromium (driven over CDP via `chrome-remote-interface`) captures each frame.
7. `ffmpeg` muxes frame sequence + source audio → H.264/AAC MP4.
8. Electron main emits progress updates to React UI.

Preview uses same job/build logic but keeps cached Chromium preview session, renders single frame on demand.

## Commands

Run from repo root:

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm test`
- `npm run benchmark:renderer`
- `npm run publish`

E2E smoke test gated (requires Chromium + `ffmpeg`):

- PowerShell: `$env:RUN_RENDER_SMOKE='1'; npx vitest run packages/renderer/tests/render-smoke.test.ts`

## What To Edit

Rule of thumb:

- `apps/desktop` — UI, dialogs, IPC wiring, scene library persistence, render-history.
- `packages/core` — subtitle parsing, normalized models, scene schemas, validation, shared helpers.
- `packages/scene-registry` — built-in scene behavior, component visuals, default scene composition.
- `packages/renderer` — frame rendering, browser capture, temp-file handling, audio analysis, `ffmpeg` orchestration.

Multi-layer changes: business rules in `core`, transport/UI in `desktop`.

### Within `apps/desktop`

Match new code to owning layer:

- **New IPC channel:** add type to `src/electron-api.ts`, bridge call in `electron/preload.ts`, handler in `electron/ipc/<feature>-handlers.ts` (or new one registered in `register-ipc-handlers.ts`), passthrough in `src/ipc/lyric-video-app.ts`. IPC channel strings in exactly one handler file + `preload.ts`.
- **New main-process behavior:** `electron/services/`, not `main.ts` or IPC handlers directly. Handlers stay thin — receive collaborators via `IpcDeps`, call services.
- **New shared logic (main + preview worker):** `electron/shared/`.
- **New renderer state slice:** custom hook under `src/state/`. No `useState`/`useEffect` in `App.tsx`.
- **New feature UI:** folder under `src/features/`. No new files in `src/components/` — reserved for `ui/` primitives.
- **New reusable form field:** extend `src/components/ui/form-fields.tsx`.
- **New renderer helper:** focused file under `src/lib/`. No grab-bag utility modules.
- **New styles:** appropriate `src/styles/<group>.css`. Preserve cascade order from `src/styles/index.css`.
- **New renderer-side IPC call:** import `lyricVideoApp` from `src/ipc/lyric-video-app.ts`. No direct `window.lyricVideoApp` — wrapper enables test mocking.

### Within `packages/core`

- **New shared type:** `src/types/` file matching concern (`lyric.ts`, `video.ts`, `scene-options.ts`, `scene-audio.ts`, `scene-component.ts`, `render.ts`). No grab-bag `types.ts`.
- **New scene logic:** validation → `src/scenes/option-validation.ts`, serialization → `src/scenes/serialization.ts`, render-job → `src/scenes/render-job.ts`. No merging into single `scenes.ts`.
- **New timeline helper:** `src/timeline/cue-lookup.ts`, `frame-time.ts`, or `runtime.ts` by responsibility.
- Barrels (`src/index.ts`, `src/types/index.ts`, `src/scenes/index.ts`, `src/timeline/index.ts`) re-export everything; new modules need parent barrel line.

### Within `packages/scene-registry`

- **New built-in scene component:** folder `src/components/<name>/` mirroring `equalizer/` or `lyrics-by-line/` — split into `types.ts`, `options-schema.ts`, `browser-state.ts`, `react/component.tsx`, `component.ts` (assembly), `index.ts`. Register in `src/components/index.ts`. **Also add `runtimeRegistry` entry in `packages/renderer/src/live-dom.ts`** — known coupling.
- **Shared color/math helpers:** `src/shared/color.ts` or `src/shared/math.ts`. No duplicating `withAlpha`, `clamp01`, etc.
- **New built-in scene:** copy `src/scenes/single-image-lyrics/index.ts` structure, register in `src/index.ts`'s `builtInScenes`.

### Within `packages/renderer`

- **New tunable / env var:** `src/constants.ts`. No inline `process.env` lookups in feature files.
- **New ffmpeg invocation:** `src/ffmpeg/`. Reuse `runCommand`/`runBinaryCommand` from `src/ffmpeg/run-command.ts` — single copy.
- **New browser orchestration:** `src/browser/`. Talk to Chromium only through `cdp-session.ts`'s `BrowserClient` / `PageClient` — no raw `chrome-remote-interface` imports outside that file, no browser APIs from `src/pipeline/`.
- **New render orchestration step:** `src/pipeline/`. Keep `pipeline/render-lyric-video.ts` and `pipeline/preview-session.ts` thin — extract reusable steps to sibling files.
- **New frame state helper:** `src/scene-prep/`, `src/react-ssr/`, or `src/assets/` by concern.
- **Profiling / measurement:** use `src/profiling.ts` helpers.
- **Subprocess output capture:** use `createBoundedOutputBuffer` from `src/ffmpeg/bounded-output-buffer.ts`.
- **Do not modify `src/live-dom.ts` lightly.** Runs inside Chromium, hard to test. New built-in component: only add `runtimeRegistry` entry — no surrounding refactors.

## Extension Points

- New built-in scene: copy `single-image-lyrics` structure, register in `packages/scene-registry/src/index.ts`, add to Electron bootstrap scene list.
- New scene component: folder under `packages/scene-registry/src/components/<name>/`, export from `src/components/index.ts`, **add `runtimeRegistry` entry to `packages/renderer/src/live-dom.ts`** for live DOM renderer.
- New option type: add in `packages/core/src/types/scene-options.ts`, validate in `packages/core/src/scenes/option-validation.ts`, surface via schema-driven scene editor UI.
- Render behavior changes: keep render-job contract stable unless UI + tests updated together.

## Things To Avoid

- No editing `dist/` or `dist-electron/` — build outputs.
- No editing `node_modules/`.
- No scene-specific form logic in React UI components. UI is schema-driven from scene `options`.
- No expensive async work in scene component render path. Use `prepare`.
- No changing `apps/desktop/vite.config.ts` away from relative asset loading unless packaged `file://` startup reverified.
- No switching Electron preload to ESM without reworking loader. Current preload is CommonJS on purpose.

## Known Constraints

- v1: single-scene, full-song renderer. No timeline editor.
- Scene modules local + built-in only for now; contract designed for future external modules.
- HTML/CSS primary scene runtime. Canvas can exist inside scene later but shouldn't replace scene contract.
- Default video target: `1920x1080` at `30fps`.
- Font selection limited to supported list in `packages/core/src/constants.ts`.

## Testing Expectations

Most changes, run:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`

Also run gated smoke test when changing:

- `packages/renderer/src/index.ts`
- scene rendering behavior
- temp-file handling
- CDP browser orchestration (`src/browser/`) or `ffmpeg` invocation
- render-job timing/duration logic

## Agent Notes

- Read source files under `apps/desktop/src`, `apps/desktop/electron`, `packages/*/src` before touching anything.
- Blank Electron window debug: check preload format, asset paths in built `index.html`, `file://` vs dev server loading.
- Render failure debug: inspect `ffprobe`, `ffmpeg`, and the bundled Chromium under `node_modules/.chromium-cache/` (or `resources/app/.chromium-cache/` in packaged builds) first.
- New scene/component: reuse existing scene registry structure, no separate registration path.