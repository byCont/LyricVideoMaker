import CDP from "chrome-remote-interface";

/**
 * Thin wrapper around chrome-remote-interface that exposes the small subset
 * of CDP that the renderer needs. This is the only module that imports
 * chrome-remote-interface directly — every other browser-side module talks
 * through the `BrowserClient` / `PageClient` interfaces below.
 *
 * We deliberately avoid leaking CRI's typing into the rest of the codebase
 * so the rest of the renderer can be unit-tested with a hand-written mock
 * (see tests/preview-session.test.ts).
 */

type CDPClient = Awaited<ReturnType<typeof CDP>>;

export interface BrowserClient {
  /** Browser-level CRI client (for Target.* commands and lifecycle). */
  readonly client: CDPClient;
  readonly port: number;
  readonly wsEndpoint: string;
  close(): Promise<void>;
}

export interface PageClient {
  /** The CDP target id this page is bound to. */
  readonly targetId: string;
  /** Send a CDP command on this page's session. */
  send<T = unknown>(method: string, params?: object): Promise<T>;
  /**
   * Subscribe to a CDP event on this page's session. Returns a dispose
   * function that removes the listener.
   */
  on(event: string, handler: (params: unknown) => void): () => void;
  /**
   * Run `fn(arg)` inside the page and return the JSON-serialised result.
   *
   * Mirrors Playwright's `page.evaluate(fn, arg)` API contract: `fn` is
   * stringified, the JSON-encoded `arg` is interpolated as its single
   * parameter, and the result is awaited and returned by value.
   */
  evaluate<R, A = undefined>(fn: (arg: A) => R | Promise<R>, arg?: A): Promise<R>;
  /**
   * Replace the page's HTML with `html` and wait for `domcontentloaded`.
   * Equivalent to Playwright's `page.setContent(html, { waitUntil:
   * 'domcontentloaded' })`.
   */
  setContent(html: string): Promise<void>;
  /** Close the underlying target and detach the session. */
  close(): Promise<void>;
}

/**
 * Connect to a running Chromium instance and return a browser-level client
 * used to manage targets.
 *
 * The browser-level WebSocket endpoint (`ws://host:port/devtools/browser/<id>`)
 * is taken from `DevToolsActivePort` by `launchChromium`. Connecting directly
 * to that URL avoids the "no inspectable targets" race that happens with
 * `--headless=new` before any page target exists.
 */
export async function connectBrowser({
  port,
  wsEndpoint
}: {
  port: number;
  wsEndpoint: string;
}): Promise<BrowserClient> {
  const client = await CDP({ port, target: wsEndpoint });
  return {
    client,
    port,
    wsEndpoint,
    async close() {
      try {
        await client.send("Browser.close");
      } catch {
        // Browser may already be gone — ignore.
      }
      try {
        await client.close();
      } catch {
        // Ignore.
      }
    }
  };
}

/**
 * Create a fresh page (target) under the given browser, attach a CDP
 * session to it, and prime the domains the renderer relies on.
 */
export async function createPage(
  browser: BrowserClient,
  { width, height }: { width: number; height: number }
): Promise<PageClient> {
  const created = (await browser.client.send("Target.createTarget", {
    url: "about:blank",
    width,
    height,
    newWindow: true
  })) as { targetId: string };

  const targetId = created.targetId;
  const session = await CDP({ port: browser.port, target: targetId });

  try {
    await session.send("Page.enable");
    await session.send("Runtime.enable");
    await session.send("Network.enable");
    await session.send("Log.enable");
    await session.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
  } catch (error) {
    try {
      await session.close();
    } catch {
      // Ignore.
    }
    try {
      await browser.client.send("Target.closeTarget", { targetId });
    } catch {
      // Ignore.
    }
    throw error;
  }

  let cachedFrameId: string | null = null;
  const getMainFrameId = async (): Promise<string> => {
    if (cachedFrameId) {
      return cachedFrameId;
    }
    const tree = (await session.send("Page.getFrameTree")) as {
      frameTree: { frame: { id: string } };
    };
    cachedFrameId = tree.frameTree.frame.id;
    return cachedFrameId;
  };

  return {
    targetId,
    send<T = unknown>(method: string, params?: object): Promise<T> {
      return (session.send as unknown as (
        method: string,
        params?: object
      ) => Promise<unknown>)(method, params ?? {}) as Promise<T>;
    },
    on(event: string, handler: (params: unknown) => void): () => void {
      const wrapped = (params: unknown) => handler(params);
      session.on(event, wrapped as never);
      return () => {
        // CRI's client extends EventEmitter; removeListener works on it.
        (session as unknown as {
          removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
        }).removeListener(event, wrapped as never);
      };
    },
    async evaluate<R, A = undefined>(
      fn: (arg: A) => R | Promise<R>,
      arg?: A
    ): Promise<R> {
      const fnSource = fn.toString();
      const argLiteral = arg === undefined ? "undefined" : JSON.stringify(arg);
      const expression = `(${fnSource})(${argLiteral})`;
      const result = (await session.send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true
      })) as {
        result?: { value?: unknown };
        exceptionDetails?: {
          text?: string;
          exception?: { description?: string; value?: unknown };
        };
      };

      if (result.exceptionDetails) {
        const detail = result.exceptionDetails;
        const message =
          detail.exception?.description ??
          (typeof detail.exception?.value === "string" ? detail.exception.value : undefined) ??
          detail.text ??
          "Page evaluate threw an unknown exception";
        throw new Error(message);
      }

      return (result.result?.value as R) ?? (undefined as unknown as R);
    },
    async setContent(html: string): Promise<void> {
      const frameId = await getMainFrameId();
      const domContentFired = waitForEvent(session, "Page.domContentEventFired");
      await session.send("Page.setDocumentContent", { frameId, html });
      await domContentFired;
    },
    async close(): Promise<void> {
      try {
        await session.close();
      } catch {
        // Ignore.
      }
      try {
        await browser.client.send("Target.closeTarget", { targetId });
      } catch {
        // Ignore — target may already be gone if browser is shutting down.
      }
    }
  };
}

function waitForEvent(client: CDPClient, event: string): Promise<void> {
  return new Promise((resolveEvent) => {
    const handler = () => {
      (client as unknown as {
        removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
      }).removeListener(event, handler as never);
      resolveEvent();
    };
    client.on(event as never, handler as never);
  });
}
