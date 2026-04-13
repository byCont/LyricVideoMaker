# Plugins

Plugins extend Lyric Video Maker with new components and scene presets built by the community. You can install plugins from GitHub or from a local folder.

## Installing a Plugin

1. Click the **Scene** button at the top of the Scene Builder to open the Scene Editor.
2. Scroll down to the **Plugins** section.
3. Enter the plugin's **GitHub URL** (e.g., `https://github.com/owner/repo`) or a **local folder path**.
4. Click **Import Plugin**.

The app downloads (or reads) the plugin, validates it, and loads its components and scenes. Once installed, the plugin's components appear in the **Add component** dropdown and its scenes appear in the **Scene preset** selector.

## Removing a Plugin

In the Plugins section of the Scene Editor, each installed plugin shows a **Remove** button. Click it to uninstall the plugin and remove its components and scenes from the app.

::: warning
Removing a plugin will remove any of its components from your current scene. Save your scene first if you want to keep a backup.
:::

## Known Plugins

| Plugin | Description |
|--------|-------------|
| [Particles Plugin](https://github.com/mrkmg/LyricVideoMaker-Particles-Plugin) | Adds particle effect components to your scenes |

To add your plugin to this list, open a pull request against the [LyricVideoMaker repository](https://github.com/mrkmg/LyricVideoMaker).

## For Plugin Developers

If you want to build your own plugins, see the [Plugin Development](/guide/plugin-development) guide and the [Plugin API Reference](/guide/plugin-api).
