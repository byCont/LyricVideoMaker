import type { Page, Route } from "playwright";
import { ASSET_URL_PREFIX } from "../constants";
import type { PreloadedAsset, RenderLogger } from "../types";

/**
 * Asset route handler (cavekit-video-field-type R6 / T-012).
 *
 * The route fulfills preloaded asset bodies — both image and video — using
 * the content-type that was populated during preload. For images this is
 * either "image/png" (normalized) or the original MIME type. For videos
 * this is the MIME type detected from the file extension (video/mp4,
 * video/webm, video/quicktime, video/x-matroska).
 *
 * Range-request support (HTTP 206 / Content-Range) is NOT currently
 * implemented. Per the kit, this is an "implementation-time decision"
 * conditioned on whether the Phase-A verification (T-016 and T-059) with
 * a small mp4 plays successfully end-to-end through a single
 * content-typed response. If it does, no range support is needed; if a
 * future harness observes playback failures, this handler should be
 * extended to branch on the Range header and emit 206 slices. Left as a
 * documented Phase-B follow-up rather than speculative code.
 */
export async function registerAssetRoutes(
  page: Page,
  assets: Map<string, PreloadedAsset>,
  logger: RenderLogger
) {
  await page.route(`${ASSET_URL_PREFIX}**`, async (route) => {
    await fulfillAssetRoute(route, assets, logger);
  });
}

export async function fulfillAssetRoute(
  route: Route,
  assets: Map<string, PreloadedAsset>,
  logger: RenderLogger
) {
  const url = route.request().url();
  const asset = [...assets.values()].find((candidate) => candidate.url === url);

  if (!asset) {
    logger.warn(`Asset request had no registered payload: ${url}`);
    await route.fulfill({
      status: 404,
      body: "Not found",
      headers: {
        "Content-Type": "text/plain"
      }
    });
    return;
  }

  await route.fulfill({
    status: 200,
    body: asset.body,
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
