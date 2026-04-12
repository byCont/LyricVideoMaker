import { createPage, type BrowserClient, type PageClient } from "./cdp-session";

/**
 * Create a new page (CDP target) under the given browser, sized to the
 * requested viewport. There is no separate "context" object under raw CDP —
 * each target is its own session — so this function returns just the page.
 */
export async function createRenderPage({
  browser,
  width,
  height
}: {
  browser: BrowserClient;
  width: number;
  height: number;
}): Promise<{ page: PageClient }> {
  const page = await createPage(browser, { width, height });
  return { page };
}
