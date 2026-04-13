# Getting Started with Plugins

Lyric Video Maker supports external plugins that add scene components and scene presets. Plugins are CommonJS modules loaded at runtime by the desktop app.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A code editor (VS Code recommended)
- Basic TypeScript and React knowledge

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
  TimingOptions,
} from "@lyric-video-maker/plugin-base";

interface MyOptions
  extends TransformOptions,
    TimingOptions,
    Record<string, unknown> {
  textColor: string;
}

export function activate(
  host: LyricVideoPluginHost
): LyricVideoPluginActivation {
  const { React } = host;
  const {
    transformCategory,
    timingCategory,
    DEFAULT_TRANSFORM_OPTIONS,
    DEFAULT_TIMING_OPTIONS,
    computeTransformStyle,
    computeTimingOpacity,
  } = host.transform;

  const component: SceneComponentDefinition<MyOptions> = {
    id: "myplugin.hello",
    name: "Hello World",
    options: [
      transformCategory,
      timingCategory,
      {
        id: "textColor",
        label: "Text Color",
        type: "color",
        defaultValue: "#ffffff",
      },
    ],
    defaultOptions: {
      ...DEFAULT_TRANSFORM_OPTIONS,
      ...DEFAULT_TIMING_OPTIONS,
      textColor: "#ffffff",
    },
    Component({ options, video, timeMs }) {
      const style = {
        ...computeTransformStyle(options, video),
        opacity: computeTimingOpacity(timeMs, options),
        color: options.textColor,
        fontSize: 48,
        fontFamily: "sans-serif",
      };
      return React.createElement("div", { style }, "Hello from my plugin!");
    },
  };

  return { components: [component], scenes: [] };
}
```

Create `lyric-video-plugin.json` at the project root:

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

### Recommended package.json

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
    "@lyric-video-maker/plugin-base": "^0.1.0",
    "react": "^18.3.1",
    "tsup": "^8.4.0",
    "typescript": "^5.8.2"
  }
}
```

### Recommended tsconfig.json

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

### Recommended tsup.config.ts

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
  },
});
```

## Distribution

Plugins are imported into the app via GitHub URL or local path.

### Via GitHub

Push your repo (with `dist/plugin.cjs` committed) to GitHub. Users import via the HTTPS clone URL:

```
https://github.com/yourname/my-lyric-video-plugin.git
```

The app clones the repo, reads the manifest, and loads the plugin.

### Via Local Path

For development, users can import from a local directory path.

### What to Commit

Always commit `dist/plugin.cjs` to the repository. The app does **not** run `npm install` or any build commands on import.

## Listing Your Plugin

Want your plugin discoverable? Open a PR adding it to the [Known Plugins](/guide/plugins#known-plugins) table on the Plugins doc page.

## Bundled Assets

Plugins can include asset files (images, videos) and reference them in scene definitions. Place files anywhere in your repo and use `createPluginAssetUri()` to build references:

```typescript
import { createPluginAssetUri } from "@lyric-video-maker/plugin-base";

const myScene = {
  id: "myplugin.showcase",
  name: "My Showcase",
  source: "plugin",
  readOnly: true,
  components: [
    {
      id: "bg",
      componentId: "background-image",
      enabled: true,
      options: {
        imagePath: createPluginAssetUri("myplugin.hello-pack", "assets/bg.jpg"),
      },
    },
  ],
};
```

Asset files should be committed to the repo alongside `dist/plugin.cjs`. Users can override bundled assets by picking a different file in the editor. See the [Plugin API Reference](/guide/plugin-api#bundled-assets) for full details.

## Next Steps

- Read the full [Plugin API Reference](/guide/plugin-api) for details on all component interfaces, options schema, transform/timing systems, audio analysis, and more.
- Check out the [example plugin](https://github.com/mrkmg/LyricVideoMaker/tree/main/examples/external-plugin-basic) for a complete working reference.
