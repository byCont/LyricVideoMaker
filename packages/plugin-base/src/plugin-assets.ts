export const PLUGIN_ASSET_PREFIX = "plugin-asset://";

export function isPluginAssetUri(value: string): boolean {
  return value.startsWith(PLUGIN_ASSET_PREFIX);
}

export function parsePluginAssetUri(
  uri: string
): { pluginId: string; relativePath: string } | null {
  if (!uri.startsWith(PLUGIN_ASSET_PREFIX)) {
    return null;
  }

  const rest = uri.slice(PLUGIN_ASSET_PREFIX.length);
  const slashIndex = rest.indexOf("/");
  if (slashIndex <= 0) {
    return null;
  }

  const pluginId = rest.slice(0, slashIndex);
  const relativePath = rest.slice(slashIndex + 1);
  if (!relativePath) {
    return null;
  }

  return { pluginId, relativePath };
}

export function createPluginAssetUri(pluginId: string, relativePath: string): string {
  const normalizedPath = relativePath.replace(/\\/g, "/");
  const segments = normalizedPath.split("/");
  if (segments.some((segment) => segment === "..")) {
    throw new Error(
      `Plugin asset path must not contain ".." segments: "${relativePath}"`
    );
  }

  return `${PLUGIN_ASSET_PREFIX}${pluginId}/${normalizedPath}`;
}
