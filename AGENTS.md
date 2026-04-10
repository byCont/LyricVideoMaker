# AGENTS.md

## Purpose

This repository is a local desktop lyric-video renderer.

The current v1 scope is:

- Electron desktop shell
- React renderer-process UI
- Shared `core` package for subtitle parsing, scene contracts, option validation, and render-job creation
- `scene-registry` package for built-in scenes and reusable scene components
- `renderer` package that renders HTML/CSS scenes through headless Chromium and muxes them with source audio via `ffmpeg`

The app currently supports one built-in scene applied across the full song: `single-image-lyrics`.

## Start Here

If you are new to the repo, read these files first:

1. [package.json](./package.json)
2. [apps/desktop/electron/main.ts](./apps/desktop/electron/main.ts)
3. [apps/desktop/src/App.tsx](./apps/desktop/src/App.tsx)
4. [packages/core/src/types.ts](./packages/core/src/types.ts)
5. [packages/core/src/scenes.ts](./packages/core/src/scenes.ts)
6. [packages/scene-registry/src/scenes/single-image-lyrics/index.ts](./packages/scene-registry/src/scenes/single-image-lyrics/index.ts)
7. [packages/renderer/src/index.ts](./packages/renderer/src/index.ts)

Those files show the app boundary, the UI flow, the shared scene contract, the built-in scene structure, and the render pipeline.

## Repo Layout

### `apps/desktop`

Electron + React desktop app.

- `electron/main.ts`: owns native dialogs, bootstrap data, render submission, preview sessions, cancellation, render history, and IPC
- `electron/preload.ts`: exposes the safe renderer API on `window.lyricVideoApp`
- `electron/scene-library.ts`: persists user-authored scenes to app storage and handles import/export
- `src/App.tsx`: main UI for file picking, scene selection, option editing, render submission, and render history
- `src/electron-api.ts`: shared IPC-facing types for the renderer process
- `src/components/*`: inspector panels, preview panel, render progress dialog, and workspace navigation
- `vite.config.ts`: renderer-process bundling; `base: "./"` matters for `file://` startup

### `packages/core`

Shared domain logic. Put logic here when it is needed by both Electron and renderer code.

- `srt.ts`: subtitle parsing
- `timeline.ts`: cue lookup and frame/time conversion helpers
- `types.ts`: scene contracts, cue model, render job model, progress/history types
- `scenes.ts`: option validation, scene serialization, scene-file parsing, render-job creation
- `constants.ts`: defaults such as video size, fps, scene-file version, and supported fonts

### `packages/scene-registry`

Built-in scenes and reusable scene components.

- `src/index.ts`: exports built-in scenes/components and lookup helpers
- `src/components/*`: reusable visual pieces such as the background, equalizer, and lyrics renderer
- `src/scenes/single-image-lyrics/index.ts`: the only built-in scene in v1

Scene-specific heavy work should happen in component `prepare(...)`, not inside per-frame rendering.

### `packages/renderer`

Headless render coordinator.

- `src/index.ts`: probes audio duration with `ffprobe`, preloads assets, renders scene markup to HTML, captures frames with Playwright Chromium, then muxes frames and audio with `ffmpeg`
- `src/audio-analysis.ts`: audio spectrum extraction for scenes that need it
- `src/live-dom.ts`: live DOM scene mounting and update helpers used by the Chromium render path
- `tests/*`: render smoke, benchmark, preview-session, parallel-rendering, and audio-analysis coverage

## Data And Render Flow

The happy path is:

1. Renderer UI collects `mp3`, `srt`, scene selection, scene options, and output path.
2. Electron main parses the SRT, probes audio duration, validates options, and creates a `RenderJob`.
3. Electron main calls `renderLyricVideo(...)` from `packages/renderer`.
4. The renderer package runs optional scene `prepare(...)`.
5. Each frame is rendered by server-rendering the scene React component to static HTML.
6. Playwright Chromium captures each frame.
7. `ffmpeg` muxes the frame sequence with source audio into H.264/AAC MP4.
8. Electron main emits progress updates back to the React UI.

Preview rendering uses the same job/build logic, but keeps a cached Chromium preview session and renders a single frame on demand.

## Commands

Run these from the repo root:

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm test`
- `npm run benchmark:renderer`
- `npm run publish`

The end-to-end smoke test is intentionally gated because it requires Chromium and `ffmpeg`:

- PowerShell: `$env:RUN_RENDER_SMOKE='1'; npx vitest run packages/renderer/tests/render-smoke.test.ts`

## What To Edit

Use this rule of thumb:

- Change `apps/desktop` for UI, dialogs, IPC wiring, scene library persistence, and render-history behavior.
- Change `packages/core` for subtitle parsing, normalized models, scene schemas, validation, and shared helpers.
- Change `packages/scene-registry` for built-in scene behavior, component visuals, and default scene composition.
- Change `packages/renderer` for frame rendering, browser capture, temp-file handling, audio analysis, and `ffmpeg` orchestration.

If a change affects multiple layers, keep business rules in `core` and keep transport/UI details in `desktop`.

## Extension Points

- New built-in scene: copy the structure of `single-image-lyrics`, register it in `packages/scene-registry/src/index.ts`, and add it to the scene list used by Electron bootstrap data.
- New scene component: add it under `packages/scene-registry/src/components`, export it from the registry, and make sure the component can run in the live DOM renderer.
- New option type: add it in `packages/core/src/types.ts`, validate it in `packages/core/src/scenes.ts`, and surface it through the schema-driven scene editor UI.
- Render behavior changes: keep the render-job contract stable unless the UI and tests are updated together.

## Things To Avoid

- Do not edit `dist/` or `dist-electron/` directly. They are build outputs.
- Do not edit `node_modules/`.
- Do not move scene-specific form logic into React UI components. The UI is intentionally schema-driven from scene `options`.
- Do not put expensive async work in a scene component render path. Use `prepare`.
- Do not change `apps/desktop/vite.config.ts` away from relative asset loading unless packaged `file://` startup is reverified.
- Do not switch Electron preload back to ESM without reworking how Electron loads it. The current preload is built as CommonJS on purpose.

## Known Constraints

- v1 is a single-scene, full-song renderer. There is no timeline editor.
- Scene modules are local and built-in only for now, but the contract is meant to support future external modules.
- HTML/CSS is the primary scene runtime. Canvas can exist inside a scene later, but should not replace the scene contract.
- The default video target is `1920x1080` at `30fps`.
- Font selection is currently limited to the supported list in `packages/core/src/constants.ts`.

## Testing Expectations

For most changes, run:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`

Also run the gated smoke test when you change:

- `packages/renderer/src/index.ts`
- scene rendering behavior
- temp-file handling
- Playwright or `ffmpeg` invocation
- render-job timing or duration logic

## Agent Notes

- Prefer reading source files under `apps/desktop/src`, `apps/desktop/electron`, and `packages/*/src` before touching anything.
- If you need to debug a blank Electron window, check preload format, asset paths in built `index.html`, and whether the app is loading from `file://` or a dev server.
- If you need to debug render failures, inspect `ffprobe`, `ffmpeg`, and Playwright Chromium availability first.
- If you need to add a new scene or component, reuse the existing scene registry structure rather than inventing a separate registration path.
