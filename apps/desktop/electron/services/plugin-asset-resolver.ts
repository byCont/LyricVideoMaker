import { existsSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { parsePluginAssetUri } from "@lyric-video-maker/core";

export interface PluginAssetResolver {
  resolve(uri: string): string | null;
  exists(uri: string): boolean;
}

export function createPluginAssetResolver(
  getRepoDirs: () => Map<string, string>
): PluginAssetResolver {
  return {
    resolve(uri) {
      const parsed = parsePluginAssetUri(uri);
      if (!parsed) {
        return null;
      }

      const repoDir = getRepoDirs().get(parsed.pluginId);
      if (!repoDir) {
        return null;
      }

      const resolved = resolve(repoDir, parsed.relativePath);
      if (!isPathInside(repoDir, resolved)) {
        return null;
      }

      return resolved;
    },
    exists(uri) {
      const resolved = this.resolve(uri);
      return resolved !== null && existsSync(resolved);
    }
  };
}

function isPathInside(parentDir: string, childPath: string) {
  const rel = relative(resolve(parentDir), resolve(childPath));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}
