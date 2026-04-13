import type { SceneComponentDefinition, SceneDefinition } from "@lyric-video-maker/core";
import type { InstalledPluginSummary, LoadedPlugin } from "./plugin-library";

export interface PluginCatalog {
  list(): InstalledPluginSummary[];
  components(): SceneComponentDefinition<Record<string, unknown>>[];
  scenes(): SceneDefinition[];
  pluginBundleSources(): string[];
  getRepoDirs(): Map<string, string>;
  replaceAll(plugins: LoadedPlugin[]): void;
  upsert(plugin: LoadedPlugin): void;
  remove(pluginId: string): void;
}

export function createPluginCatalog(): PluginCatalog {
  let plugins: LoadedPlugin[] = [];

  return {
    list() {
      return plugins.map((plugin) => plugin.summary);
    },
    components() {
      return plugins.flatMap((plugin) => plugin.components);
    },
    scenes() {
      return plugins.flatMap((plugin) => plugin.scenes);
    },
    pluginBundleSources() {
      return plugins.map((plugin) => plugin.bundleSource);
    },
    getRepoDirs() {
      return new Map(plugins.map((plugin) => [plugin.summary.id, plugin.summary.repoDir]));
    },
    replaceAll(nextPlugins) {
      plugins = sortPlugins(nextPlugins);
    },
    upsert(plugin) {
      plugins = sortPlugins([
        ...plugins.filter((entry) => entry.summary.id !== plugin.summary.id),
        plugin
      ]);
    },
    remove(pluginId) {
      plugins = plugins.filter((plugin) => plugin.summary.id !== pluginId);
    }
  };
}

function sortPlugins(plugins: LoadedPlugin[]) {
  return [...plugins].sort((left, right) => left.summary.name.localeCompare(right.summary.name));
}
