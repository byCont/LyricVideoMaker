# Lyric Video Maker Example Plugin

Buildable reference plugin for Lyric Video Maker external scene/component imports.

## Files

- `lyric-video-plugin.json` is the manifest the desktop app reads after clone.
- `src/plugin.ts` exports `activate(host)`, which returns component and scene definitions.
- `dist/plugin.cjs` is the prebuilt CommonJS entry imported by the app.
- `package.json` shows the minimum TypeScript build setup for plugin authors.

## Build

```sh
npm install
npm run typecheck
npm run build
```

For a real plugin repo, install `@lyric-video-maker/plugin-types` from npm instead of the local `file:../../packages/plugin-types` dependency used by this monorepo example.

Commit `dist/plugin.cjs` with the plugin repo. Lyric Video Maker v1 does not run `npm install` or build plugins during import.
