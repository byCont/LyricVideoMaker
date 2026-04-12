import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { Browser, computeExecutablePath, detectBrowserPlatform } from "@puppeteer/browsers";

/**
 * Pinned Chromium buildId — must match scripts/install-chromium.mjs.
 */
export const CHROMIUM_BUILD_ID = "1613329";

/**
 * Resolve the path to the bundled Chromium executable.
 *
 * Two cache directories are searched, in order:
 *
 *  1. Packaged Electron app — `<resourcesPath>/app/.chromium-cache`. The
 *     publish step copies the cache here so the renderer finds Chromium at
 *     runtime without depending on a system install.
 *  2. Development checkout — `<repo-root>/node_modules/.chromium-cache`,
 *     populated by `scripts/install-chromium.mjs` during `npm run build`.
 *
 * Throws if neither location contains the expected binary.
 */
export async function resolveChromiumExecutable(): Promise<string> {
  const platform = detectBrowserPlatform();
  if (!platform) {
    throw new Error("Unable to detect a supported Chromium platform.");
  }

  const candidates: string[] = [];

  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  if (resourcesPath) {
    candidates.push(join(resourcesPath, "app", ".chromium-cache"));
  }

  const devCacheDir = findDevCacheDir();
  if (devCacheDir) {
    candidates.push(devCacheDir);
  }

  for (const cacheDir of candidates) {
    const exe = computeExecutablePath({
      browser: Browser.CHROMIUM,
      buildId: CHROMIUM_BUILD_ID,
      cacheDir,
      platform
    });
    if (existsSync(exe)) {
      return exe;
    }
  }

  throw new Error(
    `Bundled Chromium (buildId=${CHROMIUM_BUILD_ID}) was not found in any of: ${candidates.join(
      ", "
    )}. Did the build step run scripts/install-chromium.mjs?`
  );
}

/**
 * Walk up the filesystem from `process.cwd()` until we find a
 * `node_modules/.chromium-cache` directory. This avoids any reliance on
 * `import.meta.url` / `__dirname` (which differ between the renderer's
 * ESM and CJS bundles produced by tsup).
 *
 * In a packaged Electron app this function never runs because
 * `process.resourcesPath` matches first.
 */
function findDevCacheDir(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const candidate = join(dir, "node_modules", ".chromium-cache");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}
