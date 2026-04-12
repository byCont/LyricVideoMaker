import type { LaunchedChromium } from "./launch";
import type { BrowserClient, PageClient } from "./cdp-session";

/**
 * Tear down everything created during a preview session, in the right
 * order: detach asset routes, close the page target, close the browser
 * client, then kill the spawned Chromium process and remove its temp
 * user-data-dir.
 *
 * Each step is independently best-effort — failures are swallowed because
 * the consumer of this function is the disposal path itself, and we'd
 * rather guarantee progress than abort cleanup mid-way.
 */
export async function disposePreviewBrowserResources({
  page,
  browser,
  launched,
  detachAssetRoutes
}: {
  page: PageClient | null;
  browser: BrowserClient | null;
  launched: LaunchedChromium | null;
  detachAssetRoutes?: (() => Promise<void>) | null;
}) {
  if (detachAssetRoutes) {
    try {
      await detachAssetRoutes();
    } catch {
      // Ignore.
    }
  }

  if (page) {
    try {
      await page.close();
    } catch {
      // Ignore.
    }
  }

  if (browser) {
    try {
      await browser.close();
    } catch {
      // Ignore.
    }
  }

  if (launched) {
    try {
      await launched.kill();
    } catch {
      // Ignore.
    }
  }
}
