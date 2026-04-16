# @lyric-video-maker/plugin-base

Plugin SDK for [Lyric Video Maker](https://github.com/mrkmg/LyricVideoMaker). Provides TypeScript types, modifier contracts, the `useContainerSize` hook, and transform/timing helpers for building external plugins.

## Install

```bash
npm install --save-dev @lyric-video-maker/plugin-base
```

React is a peer dependency:

```bash
npm install --save-dev react
```

## Quick Start

Create a plugin entry point that exports an `activate` function:

```typescript
import type {
  LyricVideoPluginActivation,
  LyricVideoPluginHost,
  SceneComponentDefinition,
} from "@lyric-video-maker/plugin-base";

interface MyOptions extends Record<string, unknown> {
  textColor: string;
}

export function activate(host: LyricVideoPluginHost): LyricVideoPluginActivation {
  const { React } = host;

  const component: SceneComponentDefinition<MyOptions> = {
    id: "myplugin.hello",
    name: "Hello World",
    options: [
      { id: "textColor", label: "Text Color", type: "color", defaultValue: "#ffffff" },
    ],
    defaultOptions: {
      textColor: "#ffffff",
    },
    Component({ options, containerRef }) {
      return React.createElement(
        "div",
        {
          ref: containerRef,
          style: {
            width: "100%",
            height: "100%",
            color: options.textColor,
            fontSize: 48,
          },
        },
        "Hello from my plugin!"
      );
    },
  };

  return { components: [component], scenes: [] };
}
```

Position, timing, opacity, and visibility are handled by the built-in modifier stack — users add modifiers to the component instance in the app. Plugins can also contribute their own modifier definitions.

Bundle to CommonJS (e.g. with [tsup](https://tsup.egoist.dev)):

```bash
npx tsup src/plugin.ts --format cjs --out-dir dist --out-extension .cjs
```

## What's Included

- **Types** -- `SceneComponentDefinition`, `SceneDefinition`, `LyricVideoPluginHost`, render props, option schema types, lyric runtime, video settings, and more.
- **Modifier contract** -- `ModifierDefinition`, `ModifierInstance`, `ModifierApplyContext` for building custom modifiers that plug into the per-component modifier stack.
- **`useContainerSize` hook** -- read the pixel size of the box a modifier stack has given your component.
- **Transform / timing helpers** -- `computeTransformStyle()`, `computeTimingOpacity()`, and the matching option categories and defaults — the same pure helpers that power the built-in Transform and Timing modifiers, usable in custom modifiers.
- **Plugin asset helpers** -- `createPluginAssetUri()`, `parsePluginAssetUri()` for bundling images and videos with your plugin.

## Documentation

Full plugin authoring guide: [Plugin Development](https://mrkmg.github.io/LyricVideoMaker/guide/plugin-development)

Docs site: [mrkmg.github.io/LyricVideoMaker](https://mrkmg.github.io/LyricVideoMaker/)

## License

MIT
