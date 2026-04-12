import type { PageClient } from "./cdp-session";

export async function captureFrameBuffer({ page }: { page: PageClient }): Promise<Buffer> {
  const screenshot = await page.send<{ data: string }>("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
    optimizeForSpeed: true
  });

  return Buffer.from(screenshot.data, "base64");
}
