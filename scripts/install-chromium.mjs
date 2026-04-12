import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Browser, computeExecutablePath, detectBrowserPlatform, install } from "@puppeteer/browsers";

/**
 * Pinned Chromium buildId for the renderer's headless browser.
 *
 * Update this to roll forward. Find current buildIds at
 * https://googlechromelabs.github.io/chrome-for-testing/
 */
const CHROMIUM_BUILD_ID = "1613329";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cacheDir = resolve(rootDir, "node_modules", ".chromium-cache");

await main();

async function main() {
  const platform = detectBrowserPlatform();
  if (!platform) {
    throw new Error("Unable to detect a supported browser platform for @puppeteer/browsers.");
  }

  const expectedExecutable = computeExecutablePath({
    browser: Browser.CHROMIUM,
    buildId: CHROMIUM_BUILD_ID,
    cacheDir
  });

  console.log(`Installing Chromium buildId=${CHROMIUM_BUILD_ID} for ${platform}...`);
  await install({
    browser: Browser.CHROMIUM,
    buildId: CHROMIUM_BUILD_ID,
    cacheDir,
    platform
  });

  console.log(`Chromium executable: ${expectedExecutable}`);
}
