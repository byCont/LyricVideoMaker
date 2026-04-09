# AGENTS.md

## Purpose

This repository is a local desktop lyric-video renderer.

The v1 product scope is:

- Electron desktop shell
- React renderer-process UI
- Shared `core` package for subtitle parsing, scene contracts, option validation, and render-job creation
- `scene-registry` package for built-in scenes
- `renderer` package that renders HTML/CSS scenes through headless Chromium and muxes them with source audio via `ffmpeg`

The current app supports one scene applied across the full song: `single-image-lyrics`.

## Start Here

If you are new to the repo, read these files first:

1. [package.json](/C:/Users/kevin/source/repos/LyricVideoMaker/package.json)
2. [apps/desktop/electron/main.ts](/C:/Users/kevin/source/repos/LyricVideoMaker/apps/desktop/electron/main.ts)
3. [apps/desktop/src/App.tsx](/C:/Users/kevin/source/repos/LyricVideoMaker/apps/desktop/src/App.tsx)
4. [packages/core/src/types.ts](/C:/Users/kevin/source/repos/LyricVideoMaker/packages/core/src/types.ts)
5. [packages/core/src/scenes.ts](/C:/Users/kevin/source/repos/LyricVideoMaker/packages/core/src/scenes.ts)
6. [packages/scene-registry/src/single-image-lyrics.tsx](/C:/Users/kevin/source/repos/LyricVideoMaker/packages/scene-registry/src/single-image-lyrics.tsx)
7. [packages/renderer/src/index.ts](/C:/Users/kevin/source/repos/LyricVideoMaker/packages/renderer/src/index.ts)

Those files show the app boundary, the UI flow, the shared scene contract, the built-in scene implementation, and the render pipeline.

## Repo Layout

### `apps/desktop`

The desktop app.

- `electron/main.ts`: owns native dialogs, job lifecycle, IPC, render cancellation, and progress events
- `electron/preload.ts`: exposes the safe renderer API on `window.lyricVideoApp`
- `src/App.tsx`: main UI for file picking, scene selection, option editing, render submission, and render history
- `src/electron-api.ts`: shared IPC-facing types for the renderer process
- `vite.config.ts`: renderer-process bundling; note `base: "./"` is required for `file://` loads

### `packages/core`

Shared domain logic. This is the right place for logic used by both Electron and the renderer.

- `srt.ts`: subtitle parsing
- `timeline.ts`: cue lookups and frame/time conversion
- `types.ts`: scene contracts, cue model, render job model, progress/history types
- `scenes.ts`: option validation, scene serialization, render-job creation
- `constants.ts`: defaults such as video size, fps, and supported fonts

### `packages/scene-registry`

Built-in scenes only.

- `single-image-lyrics.tsx`: current scene implementation
- `index.ts`: built-in scene export and registry lookup

Scene-specific heavy work should happen in `prepare`, not inside per-frame rendering.

### `packages/renderer`

Headless render coordinator.

- `index.ts`: probes audio duration with `ffprobe`, preloads assets, renders React scene markup to HTML, captures frames with Playwright Chromium, then muxes audio/video with `ffmpeg`
- `tests/render-smoke.test.ts`: gated smoke test wrapper
- `tests/render-smoke-runner.mjs`: actual end-to-end render smoke runner against built artifacts

## Render Flow

The happy path is:

1. Renderer UI collects `mp3`, `srt`, scene selection, scene options, and output path.
2. Electron main parses the SRT, probes audio duration, validates options, and creates a `RenderJob`.
3. Electron main calls `renderLyricVideo(...)` from `packages/renderer`.
4. The renderer package runs optional scene `prepare(...)`.
5. Each frame is rendered by server-rendering the scene React component to static HTML.
6. Playwright Chromium screenshots each frame.
7. `ffmpeg` muxes the frame sequence with source audio into H.264/AAC MP4.
8. Electron main emits progress updates back to the React UI.

## Commands

Run these from the repo root:

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm test`

The end-to-end smoke test is intentionally gated because it requires Chromium and `ffmpeg`:

- PowerShell: ``$env:RUN_RENDER_SMOKE='1'; npx vitest run packages/renderer/tests/render-smoke.test.ts``

## What To Edit

Use this rule of thumb:

- Change `apps/desktop` for UI, dialogs, IPC wiring, and render-history behavior.
- Change `packages/core` for subtitle parsing, normalized models, scene schemas, validation, and shared helpers.
- Change `packages/scene-registry` for built-in scene behavior and defaults.
- Change `packages/renderer` for frame rendering, browser capture, temp-file handling, and `ffmpeg` orchestration.

If a change affects multiple layers, keep business rules in `core` and keep transport/UI details in `desktop`.

## Things To Avoid

- Do not edit `dist/` or `dist-electron/` directly. They are build outputs.
- Do not edit `node_modules/`.
- Do not move scene-specific form logic into React UI components. The UI is intentionally schema-driven from scene `options`.
- Do not put expensive async work in a scene component render path. Use `prepare`.
- Do not change `apps/desktop/vite.config.ts` away from relative asset loading unless you also re-verify packaged `file://` startup.
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
- render job timing or duration logic

## Agent Notes

- Prefer reading source files under `apps/desktop/src`, `apps/desktop/electron`, and `packages/*/src` before touching anything.
- If you need to add a new scene, copy the structure of `single-image-lyrics`, register it in `packages/scene-registry/src/index.ts`, and rely on schema-driven options instead of custom UI.
- If you need to debug a blank Electron window, check preload format, asset paths in built `index.html`, and whether the app is loading from `file://` or a dev server.
- If you need to debug render failures, inspect `ffprobe`, `ffmpeg`, and Playwright Chromium availability first.
