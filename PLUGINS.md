# Plugin Authoring Guide

Lyric Video Maker supports external plugins that add scene components and scene
presets. Plugins are CommonJS modules loaded at runtime by the desktop app. They
receive a host object with React, validation helpers, and shared transform/timing
utilities, and return component definitions and scene definitions.

This guide covers everything needed to build, distribute, and maintain a plugin.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Manifest](#manifest)
- [Entry Point](#entry-point)
- [Scene Components](#scene-components)
  - [Options Schema](#options-schema)
  - [Option Field Types](#option-field-types)
  - [Option Categories](#option-categories)
  - [Default Options](#default-options)
  - [Custom Validation](#custom-validation)
  - [Component Function](#component-function)
  - [Render Props](#render-props)
  - [Lyric Runtime](#lyric-runtime)
  - [Assets](#assets)
  - [Prepare Phase](#prepare-phase)
  - [Audio Analysis](#audio-analysis)
  - [Prepare Caching](#prepare-caching)
- [Scene Definitions](#scene-definitions)
- [Bundled Assets](#bundled-assets)
- [Transform System](#transform-system)
- [Timing System](#timing-system)
- [Building](#building)
- [Distribution](#distribution)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Rules and Constraints](#rules-and-constraints)
- [Full Example](#full-example)

---

## Quick Start

```bash
mkdir my-plugin && cd my-plugin
npm init -y
npm install --save-dev @lyric-video-maker/plugin-base react tsup typescript
```

Create `src/plugin.ts`:

```typescript
import type {
  LyricVideoPluginActivation,
  LyricVideoPluginHost,
  SceneComponentDefinition,
  TransformOptions,
  TimingOptions
} from "@lyric-video-maker/plugin-base";

interface MyOptions extends TransformOptions, TimingOptions, Record<string, unknown> {
  textColor: string;
}

export function activate(host: LyricVideoPluginHost): LyricVideoPluginActivation {
  const { React } = host;
  const {
    transformCategory, timingCategory,
    DEFAULT_TRANSFORM_OPTIONS, DEFAULT_TIMING_OPTIONS,
    computeTransformStyle, computeTimingOpacity
  } = host.transform;

  const component: SceneComponentDefinition<MyOptions> = {
    id: "myplugin.hello",
    name: "Hello World",
    options: [
      transformCategory,
      timingCategory,
      { id: "textColor", label: "Text Color", type: "color", defaultValue: "#ffffff" }
    ],
    defaultOptions: {
      ...DEFAULT_TRANSFORM_OPTIONS,
      ...DEFAULT_TIMING_OPTIONS,
      textColor: "#ffffff"
    },
    Component({ options, video, timeMs }) {
      const style = {
        ...computeTransformStyle(options, video),
        opacity: computeTimingOpacity(timeMs, options),
        color: options.textColor,
        fontSize: 48,
        fontFamily: "sans-serif"
      };
      return React.createElement("div", { style }, "Hello from my plugin!");
    }
  };

  return { components: [component], scenes: [] };
}
```

Create `lyric-video-plugin.json`:

```json
{
  "schemaVersion": 1,
  "id": "myplugin.hello-pack",
  "name": "Hello Pack",
  "version": "0.1.0",
  "entry": "dist/plugin.cjs",
  "components": ["myplugin.hello"],
  "scenes": []
}
```

Build and commit the output:

```bash
npx tsup src/plugin.ts --format cjs --out-dir dist --out-extension .cjs
git add dist/plugin.cjs
```

---

## Project Structure

```
my-plugin/
  lyric-video-plugin.json   # Manifest (required at repo root)
  package.json
  tsconfig.json
  tsup.config.ts            # Or any bundler that outputs CJS
  src/
    plugin.ts               # Entry point exporting activate()
  dist/
    plugin.cjs              # Prebuilt bundle (committed to repo)
```

### package.json

```json
{
  "name": "my-lyric-video-plugin",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@lyric-video-maker/plugin-base": "^1.0.0",
    "react": "^18.3.1",
    "tsup": "^8.4.0",
    "typescript": "^5.8.2"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*.ts"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/plugin.ts"],
  format: ["cjs"],
  outDir: "dist",
  clean: true,
  dts: false,
  outExtension() {
    return { js: ".cjs" };
  }
});
```

---

## Manifest

Every plugin needs `lyric-video-plugin.json` at the repository root.

```json
{
  "schemaVersion": 1,
  "id": "author.plugin-name",
  "name": "Human-Readable Name",
  "version": "0.1.0",
  "entry": "dist/plugin.cjs",
  "components": ["author.component-id"],
  "scenes": ["author.scene-id"]
}
```

| Field           | Type       | Description                                              |
|-----------------|------------|----------------------------------------------------------|
| `schemaVersion` | `1`        | Always `1`.                                              |
| `id`            | `string`   | Unique namespaced identifier. Must contain a dot.        |
| `name`          | `string`   | Display name shown in the app.                           |
| `version`       | `string`   | Semantic version string.                                 |
| `entry`         | `string`   | Relative path to CommonJS bundle.                        |
| `components`    | `string[]` | IDs of components returned by `activate()`.              |
| `scenes`        | `string[]` | IDs of scenes returned by `activate()`.                  |

The `components` and `scenes` arrays must exactly match what `activate()` returns.
The app validates this on import.

---

## Entry Point

The entry module must export an `activate` function:

```typescript
export function activate(host: LyricVideoPluginHost): LyricVideoPluginActivation;
```

### LyricVideoPluginHost

The host provides dependency injection so plugins don't bundle their own React or
utility code.

```typescript
interface LyricVideoPluginHost {
  /** Use this React instance for all createElement calls. */
  React: typeof React;

  core: {
    /** Validate raw option values against a component's schema. */
    validateSceneOptions<TOptions>(
      component: SceneComponentDefinition<TOptions>,
      rawOptions: unknown,
      context?: SceneValidationContext
    ): TOptions;
  };

  transform: {
    /** Compute absolute-position CSS from TransformOptions. */
    computeTransformStyle(options: TransformOptions, canvas: TransformCanvas): CSSProperties;
    /** Compute opacity (0-1) from TimingOptions at a given time. */
    computeTimingOpacity(currentTimeMs: number, timing: TimingOptions): number;
    /** Pre-built option category for transform fields. */
    transformCategory: SceneOptionCategory;
    /** Pre-built option category for timing fields. */
    timingCategory: SceneOptionCategory;
    /** Spread these into your defaultOptions. */
    DEFAULT_TRANSFORM_OPTIONS: TransformOptions;
    /** Spread these into your defaultOptions. */
    DEFAULT_TIMING_OPTIONS: TimingOptions;
  };
}
```

### LyricVideoPluginActivation

```typescript
interface LyricVideoPluginActivation {
  components: SceneComponentDefinition<any>[];
  scenes: SceneDefinition[];
}
```

---

## Scene Components

A scene component is the fundamental building block. Each component defines its
editor options, default values, optional validation and preparation steps, and a
React render function.

```typescript
interface SceneComponentDefinition<TOptions> {
  /** Unique namespaced ID (e.g. "myplugin.sparkle-text"). */
  id: string;
  /** Display name in the component picker. */
  name: string;
  /** Short description shown in the UI. */
  description?: string;
  /**
   * Performance hint. When true, the renderer can skip re-capturing frames
   * where the component's rendered markup hasn't changed.
   */
  staticWhenMarkupUnchanged?: boolean;
  /** Option schema displayed in the editor. */
  options: SceneOptionEntry[];
  /** Default values for all options. Must be JSON-serializable. */
  defaultOptions: TOptions;
  /** Custom validation. Receives raw deserialized options, returns typed. */
  validate?: (raw: unknown) => TOptions;
  /** Return a stable cache key for prepare(). null disables caching. */
  getPrepareCacheKey?: (ctx: ScenePrepareCacheKeyContext<TOptions>) => string | null;
  /** Pre-compute expensive data (audio analysis, etc.) before rendering. */
  prepare?: (ctx: ScenePrepareContext<TOptions>) => Promise<PreparedSceneComponentData>;
  /** Pure render function. Called every frame. */
  Component: (props: SceneRenderProps<TOptions>) => React.ReactElement | null;
}
```

### Options Schema

The `options` array defines what appears in the editor panel. Each entry is
either a field (leaf control) or a category (collapsible group).

### Option Field Types

```typescript
type SceneOptionField =
  | { type: "boolean"; id: string; label: string; defaultValue?: boolean }
  | { type: "number";  id: string; label: string; defaultValue?: number;
      min?: number; max?: number; step?: number }
  | { type: "text";    id: string; label: string; defaultValue?: string;
      multiline?: boolean }
  | { type: "color";   id: string; label: string; defaultValue?: string }
  | { type: "font";    id: string; label: string; defaultValue?: string }
  | { type: "image";   id: string; label: string; required?: boolean }
  | { type: "video";   id: string; label: string; required?: boolean }
  | { type: "select";  id: string; label: string; defaultValue?: string;
      options: { label: string; value: string }[] };
```

| Type      | Editor Control     | Value Type | Notes                                     |
|-----------|--------------------|------------|-------------------------------------------|
| `boolean` | Checkbox           | `boolean`  |                                           |
| `number`  | Slider / spinner   | `number`   | Use `min`, `max`, `step` for constraints. |
| `text`    | Text input         | `string`   | Set `multiline: true` for textarea.       |
| `color`   | Color picker       | `string`   | Hex string (e.g. `"#ff0000"`).            |
| `font`    | Google Font picker | `string`   | Font family name from Google Fonts.       |
| `image`   | File picker        | `string`   | Path to image file. Use `required: true`. |
| `video`   | File picker        | `string`   | Path to video file. Use `required: true`. |
| `select`  | Dropdown           | `string`   | Value must match one in `options` array.  |

### Option Categories

Group related fields under a collapsible section:

```typescript
interface SceneOptionCategory {
  type: "category";
  id: string;
  label: string;
  defaultExpanded?: boolean;
  options: SceneOptionField[];
}
```

Example:

```typescript
const appearanceCategory: SceneOptionCategory = {
  type: "category",
  id: "appearance",
  label: "Appearance",
  defaultExpanded: true,
  options: [
    { id: "color", label: "Color", type: "color", defaultValue: "#ffffff" },
    { id: "opacity", label: "Opacity", type: "number", defaultValue: 1, min: 0, max: 1, step: 0.01 }
  ]
};
```

### Default Options

`defaultOptions` must be a plain, JSON-serializable object containing a value for
every field in the schema. When using the shared transform and timing systems,
spread their defaults:

```typescript
const defaultOptions: MyOptions = {
  ...DEFAULT_TRANSFORM_OPTIONS,
  ...DEFAULT_TIMING_OPTIONS,
  myCustomField: "value"
};
```

### Custom Validation

Without a custom `validate` function, the app auto-validates based on the field
schema (type coercion, min/max clamping, select value checking, etc.).

Provide `validate` when you need cross-field validation or custom logic:

```typescript
validate(raw: unknown): MyOptions {
  // Use the host's built-in validator first
  const options = host.core.validateSceneOptions(myComponent, raw);

  // Then add custom cross-field checks
  if (options.maxFrequency <= options.minFrequency) {
    throw new Error('"Max Frequency" must be greater than "Min Frequency".');
  }

  return options;
}
```

### Component Function

The `Component` function is called on every frame during rendering. It must be a
pure function with no side effects.

```typescript
Component(props: SceneRenderProps<MyOptions>): React.ReactElement | null
```

Use `React.createElement` from `host.React` (not JSX imports) since the host
provides the React instance. Return `null` when the component has nothing to
render.

### Render Props

```typescript
interface SceneRenderProps<TOptions> {
  /** The component instance (id, componentId, enabled, options, componentName). */
  instance: ValidatedSceneComponentInstance;
  /** Validated and typed options. */
  options: TOptions;
  /** Current frame number (0-indexed). */
  frame: number;
  /** Current playback time in milliseconds. */
  timeMs: number;
  /** Video dimensions and duration. */
  video: VideoSettings;
  /** Lyric cue access. */
  lyrics: LyricRuntime;
  /** Resolved URLs for image/video option fields. */
  assets: { getUrl(instanceId: string, optionId: string): string | null };
  /** Data returned by prepare(), empty object if prepare not defined. */
  prepared: PreparedSceneComponentData;
}
```

#### VideoSettings

```typescript
interface VideoSettings {
  width: number;          // Pixel width
  height: number;         // Pixel height
  fps: number;            // Frames per second
  durationMs: number;     // Total song duration in milliseconds
  durationInFrames: number; // Total frame count
}
```

### Lyric Runtime

Access the current lyric state through `props.lyrics`:

```typescript
interface LyricRuntime {
  cues: LyricCue[];
  /** Cue active at current timeMs, or null. */
  current: LyricCue | null;
  /** Next cue after current timeMs, or null. */
  next: LyricCue | null;
  getCueAt(ms: number): LyricCue | null;
  getNextCue(ms: number): LyricCue | null;
  getCuesInRange(startMs: number, endMs: number): LyricCue[];
  /** Progress through a cue (0 at startMs, 1 at endMs). */
  getCueProgress(cue: LyricCue, ms: number): number;
}

interface LyricCue {
  index: number;
  startMs: number;
  endMs: number;
  text: string;       // Full cue text
  lines: string[];    // Text split across lines
}
```

Common patterns:

```typescript
// Show current lyric text
const text = lyrics.current?.text ?? "";

// Animate based on cue progress
const progress = lyrics.current
  ? lyrics.getCueProgress(lyrics.current, timeMs)
  : 0;

// Look ahead to next cue
const upcoming = lyrics.next?.text ?? "";
```

### Assets

Image and video option fields resolve to runtime URLs through the asset accessor:

```typescript
const imageUrl = assets.getUrl(instance.id, "backgroundImage");
if (!imageUrl) return null; // Asset not available

return React.createElement("img", {
  src: imageUrl,
  style: { width: "100%", height: "100%" }
});
```

Always handle `null` returns gracefully.

### Prepare Phase

For expensive pre-computation (audio analysis, data parsing), implement
`prepare()`. It runs once before rendering begins and its return value is passed
to every `Component` call via `props.prepared`.

```typescript
interface ScenePrepareContext<TOptions> {
  instance: ValidatedSceneComponentInstance;
  options: TOptions;
  video: VideoSettings;
  lyrics: LyricRuntime;
  assets: SceneAssetAccessor;
  audio: {
    path: string;
    getSpectrum(request: SceneAudioAnalysisRequest): Promise<SceneAudioAnalysisResult>;
  };
  signal?: AbortSignal;
}
```

Example:

```typescript
async prepare({ audio, options, signal }) {
  const spectrum = await audio.getSpectrum({
    bandCount: options.barCount,
    minFrequency: options.minFrequency,
    maxFrequency: options.maxFrequency,
    analysisFps: 30,
    sensitivity: 1.0,
    smoothing: 0.8,
    attackMs: 50,
    releaseMs: 200,
    silenceFloor: 0.01,
    bandDistribution: "log"
  });
  return { frames: spectrum.values };
}
```

Then in your Component:

```typescript
Component({ prepared, frame }) {
  const bands = (prepared as { frames: number[][] }).frames[frame] ?? [];
  // Render bars from band values (0-1 each)
}
```

### Audio Analysis

The `audio.getSpectrum()` API returns per-frame frequency band data.

```typescript
interface SceneAudioAnalysisRequest {
  bandCount: number;              // Number of frequency bands
  minFrequency: number;           // Low end in Hz
  maxFrequency: number;           // High end in Hz
  analysisFps: number;            // Analysis frame rate
  sensitivity: number;            // 0-1+, amplification factor
  smoothing: number;              // 0-1, temporal smoothing
  attackMs: number;               // Rise response time
  releaseMs: number;              // Fall response time
  silenceFloor: number;           // Minimum threshold
  bandDistribution: "linear" | "log"; // Frequency scale
}

interface SceneAudioAnalysisResult {
  fps: number;
  frameCount: number;
  bandCount: number;
  values: number[][];  // [frameIndex][bandIndex], each 0-1
}
```

### Prepare Caching

Implement `getPrepareCacheKey()` to avoid re-running expensive preparation when
options haven't changed:

```typescript
getPrepareCacheKey({ options, video, audioPath }) {
  return JSON.stringify({
    audioPath,
    fps: video.fps,
    durationMs: video.durationMs,
    barCount: options.barCount,
    minFrequency: options.minFrequency,
    maxFrequency: options.maxFrequency
  });
}
```

Return `null` to disable caching for that component instance.

---

## Scene Definitions

Scenes are presets: named arrangements of component instances with pre-configured
options. Plugins can bundle scenes that showcase their components.

```typescript
interface SceneDefinition {
  /** Unique namespaced ID. */
  id: string;
  name: string;
  description?: string;
  /** Must be "plugin" for plugin-provided scenes. */
  source: "plugin";
  /** Must be true for plugin scenes. */
  readOnly: true;
  /** Component instances in render order (back to front). */
  components: SceneComponentInstance[];
}

interface SceneComponentInstance {
  /** Unique within this scene. */
  id: string;
  /** References a SceneComponentDefinition.id (yours or built-in). */
  componentId: string;
  enabled: boolean;
  options: Record<string, unknown>;
}
```

Scene components render back-to-front (first in array = bottom layer).

Scenes can reference built-in component IDs (`background-color`,
`background-image`, `lyrics-by-line`, `equalizer`, `shape`, `static-text`,
`image`, `video`) in addition to your plugin's own components.

Example:

```typescript
const myScene: SceneDefinition = {
  id: "myplugin.showcase",
  name: "My Plugin Showcase",
  description: "Demo scene with background and custom overlay.",
  source: "plugin",
  readOnly: true,
  components: [
    {
      id: "bg",
      componentId: "background-color",  // Built-in
      enabled: true,
      options: { color1: "#1a1a2e", color2: "#16213e", angle: 135 }
    },
    {
      id: "overlay-1",
      componentId: "myplugin.hello",    // Your component
      enabled: true,
      options: { ...defaultOptions, textColor: "#00ff88" }
    }
  ]
};
```

---

## Bundled Assets

Plugins can bundle asset files (images, videos) alongside their code and
reference them in scene definitions. This lets you ship ready-to-use scenes with
default backgrounds, overlays, or other visual assets.

### Including Assets

Place asset files anywhere in your plugin repository. No manifest declaration is
needed — any file in the repo can be referenced.

```
my-plugin/
  lyric-video-plugin.json
  src/
    plugin.ts
  dist/
    plugin.cjs
  assets/                  # Convention, but any path works
    default-background.jpg
    overlay.png
```

### Referencing Assets in Scenes

Use `createPluginAssetUri()` from `@lyric-video-maker/plugin-base` to construct
asset references for `image` or `video` option fields:

```typescript
import {
  createPluginAssetUri,
  type SceneDefinition
} from "@lyric-video-maker/plugin-base";

const myScene: SceneDefinition = {
  id: "myplugin.showcase",
  name: "My Plugin Showcase",
  source: "plugin",
  readOnly: true,
  components: [
    {
      id: "bg",
      componentId: "background-image",       // Built-in component
      enabled: true,
      options: {
        imagePath: createPluginAssetUri("myplugin.my-pack", "assets/default-background.jpg")
      }
    },
    {
      id: "overlay-1",
      componentId: "image",                  // Built-in image component
      enabled: true,
      options: {
        source: createPluginAssetUri("myplugin.my-pack", "assets/overlay.png")
      }
    }
  ]
};
```

The first argument to `createPluginAssetUri` is the plugin ID (from your
manifest), and the second is the relative path within the plugin repository.

### How It Works

- Asset references are stored as `plugin-asset://pluginId/path` URI strings.
- At render time, the app resolves these URIs to the actual files in the plugin's
  installed directory.
- The editor displays bundled assets as "Bundled: filename" instead of showing
  the raw URI.
- Users can override a bundled asset by picking a different file in the editor.
  This replaces the plugin asset reference with an absolute file path.
- If the plugin is uninstalled, scenes referencing its bundled assets will show a
  validation error (same behavior as a deleted user file).

### Rules

- Relative paths must not contain `..` segments (enforced by
  `createPluginAssetUri`).
- Asset files should be committed to the repository alongside `dist/plugin.cjs`.
- Keep bundled assets small — the entire plugin repo is cloned on import.

---

## Transform System

Most components need positioning on the canvas. Use the shared transform system
instead of writing your own.

### TransformOptions

All values are percentages of canvas dimensions. Supports off-canvas placement
for slide-in effects.

```typescript
interface TransformOptions {
  x: number;                  // % of canvas width (-200 to 300)
  y: number;                  // % of canvas height (-200 to 300)
  width: number;              // % of canvas width (0 to 500)
  height: number;             // % of canvas height (0 to 500)
  anchor: TransformAnchor;    // Which point on element aligns with (x, y)
  rotation: number;           // Degrees (-360 to 360)
  flipHorizontal: boolean;
  flipVertical: boolean;
}
```

### TransformAnchor

Nine-point anchor grid controlling which point on the element sits at the (x, y)
coordinate:

```
top-left      top-center      top-right
middle-left   middle-center   middle-right
bottom-left   bottom-center   bottom-right
```

### Usage

```typescript
const { computeTransformStyle, DEFAULT_TRANSFORM_OPTIONS, transformCategory } = host.transform;

// In options schema:
options: [transformCategory, /* ...your fields */]

// In defaultOptions:
defaultOptions: { ...DEFAULT_TRANSFORM_OPTIONS, /* ...your fields */ }

// In Component:
const style = computeTransformStyle(options, video);
// Returns CSSProperties with position: absolute, left, top, width, height,
// transform (translate + rotate + scale), and transformOrigin.
```

The defaults (`x: 0, y: 0, width: 100, height: 100, anchor: "top-left"`) fill
the entire canvas.

---

## Timing System

Control when a component is visible and how it fades in/out.

### TimingOptions

```typescript
interface TimingOptions {
  startTime: number;       // Visibility start (ms)
  endTime: number;         // Visibility end (ms). 0 = run to end of song.
  fadeInDuration: number;  // Fade-in time (ms)
  fadeOutDuration: number; // Fade-out time (ms)
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}
```

### Usage

```typescript
const { computeTimingOpacity, DEFAULT_TIMING_OPTIONS, timingCategory } = host.transform;

// In options schema:
options: [transformCategory, timingCategory, /* ...your fields */]

// In defaultOptions:
defaultOptions: { ...DEFAULT_TRANSFORM_OPTIONS, ...DEFAULT_TIMING_OPTIONS, /* ... */ }

// In Component:
const opacity = computeTimingOpacity(timeMs, options);
// Returns 0-1: 0 before startTime, fades in, 1 during visible window, fades out, 0 after endTime.
```

The defaults (`startTime: 0, endTime: 0, no fades, linear`) produce an
always-visible component.

---

## Building

Plugins must be prebuilt to CommonJS. The app loads them directly without running
any build step.

```bash
npm run build    # Produces dist/plugin.cjs
```

The output must be a single `.cjs` file. Do not rely on external `node_modules`
at runtime — bundle everything except React (provided by the host).

---

## Distribution

Plugins are imported into the app via GitHub URL or local path.

### Via GitHub

Push your repo (with `dist/plugin.cjs` committed) to GitHub. Users import via
the HTTPS clone URL:

```
https://github.com/yourname/my-lyric-video-plugin.git
```

The app does `git clone --depth 1`, reads the manifest, and loads the plugin.

### Via Local Path

For development, users can import from a local directory path.

### What to Commit

Always commit `dist/plugin.cjs` to the repository. The app does **not** run
`npm install` or any build commands on import.

---

## Plugin Lifecycle

1. **Import** — User provides a GitHub URL or local path. App clones/copies the
   repo to `~/.lyric-video-maker/plugins/repos/<safe-id>/`, validates the
   manifest, and stores a summary in `plugins.json`.

2. **Load** — On startup, the app reads each plugin's manifest, loads the CJS
   entry with `require()`, and calls `activate(host)`.

3. **Validate** — Returned components and scenes are checked: IDs must match the
   manifest, must be unique across all plugins and built-ins, and scene component
   references must point to known component IDs.

4. **Prepare** — Before rendering, each component with a `prepare()` function is
   called (with caching via `getPrepareCacheKey()`). Prepared data is stored per
   instance.

5. **Render** — The plugin's CJS bundle is evaluated inside each headless
   Chromium render page and `activate(host)` is called with a browser-side host
   that provides React and transform utilities. For each frame, `Component()` is
   called inside the browser and React's reconciler applies minimal DOM updates
   before the frame is captured.

6. **Uninstall** — Plugin directory and metadata are removed.

---

## Rules and Constraints

### Naming

- Plugin IDs must be namespaced with a dot: `author.plugin-name`.
- Component IDs should be namespaced: `myplugin.component-name`.
- Scene IDs should be namespaced: `myplugin.scene-name`.
- All IDs must be unique across all installed plugins and built-in components.

### Component Function

- Must be a **pure function** with no side effects.
- Must not store or mutate state between calls.
- Use `host.React` for all element creation — do not import React separately.
- Return `null` when the component has nothing to render.
- Handle missing assets (null URLs) without throwing.

### Options

- `defaultOptions` must be JSON-serializable (no functions, dates, undefined).
- Every field in the schema should have a corresponding key in `defaultOptions`.
- Use `Record<string, unknown>` at serialization boundaries for type safety.

### Scenes

- Plugin scenes must set `source: "plugin"` and `readOnly: true`.
- Scenes can reference built-in component IDs or component IDs from the same
  plugin.
- Component render order is array order (first = bottom layer).

### Performance

- Set `staticWhenMarkupUnchanged: true` on components whose markup doesn't
  change every frame (static backgrounds, images). The renderer can skip
  re-capturing unchanged frames.
- Use `prepare()` + caching for expensive work instead of computing in
  `Component()`.
- Keep `Component()` fast — it runs once per frame per component.

---

## Full Example

A complete caption box plugin with transform, timing, and custom styling:

**lyric-video-plugin.json:**

```json
{
  "schemaVersion": 1,
  "id": "example.caption-pack",
  "name": "Example Caption Pack",
  "version": "0.1.0",
  "entry": "dist/plugin.cjs",
  "components": ["example.caption-box"],
  "scenes": ["example.caption-demo"]
}
```

**src/plugin.ts:**

```typescript
import type {
  LyricVideoPluginActivation,
  LyricVideoPluginHost,
  SceneComponentDefinition,
  TransformOptions,
  TimingOptions
} from "@lyric-video-maker/plugin-base";

interface CaptionOptions extends TransformOptions, TimingOptions, Record<string, unknown> {
  textColor: string;
  backgroundColor: string;
  fontSize: number;
}

export function activate(host: LyricVideoPluginHost): LyricVideoPluginActivation {
  const { React } = host;
  const {
    transformCategory, timingCategory,
    DEFAULT_TRANSFORM_OPTIONS, DEFAULT_TIMING_OPTIONS,
    computeTransformStyle, computeTimingOpacity
  } = host.transform;

  const defaultOptions: CaptionOptions = {
    ...DEFAULT_TRANSFORM_OPTIONS,
    ...DEFAULT_TIMING_OPTIONS,
    textColor: "#ffffff",
    backgroundColor: "#111827",
    fontSize: 72
  };

  const captionBox: SceneComponentDefinition<CaptionOptions> = {
    id: "example.caption-box",
    name: "Caption Box",
    description: "Centered caption box driven by current lyric cue.",
    staticWhenMarkupUnchanged: false,
    options: [
      transformCategory,
      timingCategory,
      { id: "textColor", label: "Text color", type: "color", defaultValue: "#ffffff" },
      { id: "backgroundColor", label: "Background color", type: "color", defaultValue: "#111827" },
      { id: "fontSize", label: "Font size", type: "number", defaultValue: 72, min: 24, max: 180, step: 1 }
    ],
    defaultOptions,
    Component({ options, lyrics, video, timeMs }) {
      const text = lyrics.current?.text ?? "";
      const transformStyle = computeTransformStyle(options, video);
      const opacity = computeTimingOpacity(timeMs, options);

      return React.createElement(
        "div",
        {
          style: {
            ...transformStyle,
            opacity,
            display: "grid",
            placeItems: "center",
            background: "transparent"
          }
        },
        React.createElement(
          "div",
          {
            style: {
              maxWidth: "80%",
              padding: "28px 42px",
              borderRadius: 8,
              textAlign: "center",
              fontFamily: "Arial, sans-serif",
              fontWeight: 800,
              lineHeight: 1.1,
              color: options.textColor,
              background: options.backgroundColor,
              fontSize: options.fontSize,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)"
            }
          },
          text
        )
      );
    }
  };

  return {
    components: [captionBox],
    scenes: [
      {
        id: "example.caption-demo",
        name: "Example Caption Demo",
        description: "Demo scene using the caption box component.",
        source: "plugin",
        readOnly: true,
        components: [
          {
            id: "caption-box-1",
            componentId: "example.caption-box",
            enabled: true,
            options: defaultOptions as Record<string, unknown>
          }
        ]
      }
    ]
  };
}
```
