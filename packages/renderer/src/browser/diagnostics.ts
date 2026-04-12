import { ASSET_URL_PREFIX } from "../constants";
import type { RenderLogger } from "../types";
import type { PageClient } from "./cdp-session";

interface RuntimeRemoteObject {
  type?: string;
  subtype?: string;
  value?: unknown;
  description?: string;
}

interface ConsoleApiCalledEvent {
  type: string;
  args: RuntimeRemoteObject[];
}

interface ExceptionThrownEvent {
  exceptionDetails: {
    text?: string;
    exception?: RuntimeRemoteObject;
  };
}

interface NetworkRequestWillBeSentEvent {
  requestId: string;
  request: { url: string };
}

interface NetworkLoadingFailedEvent {
  requestId: string;
  errorText: string;
}

/**
 * Wire CDP-side diagnostics to the renderer logger. Returns a dispose
 * function that removes every listener installed by this call.
 */
export function wirePageDiagnostics(page: PageClient, logger: RenderLogger): () => void {
  const requestUrls = new Map<string, string>();

  const offConsole = page.on("Runtime.consoleAPICalled", (raw) => {
    const event = raw as ConsoleApiCalledEvent;
    if (event.type !== "error" && event.type !== "warning") {
      return;
    }
    const text = event.args
      .map((arg) => stringifyRemoteObject(arg))
      .join(" ")
      .trim();
    if (!text) {
      return;
    }
    if (event.type === "error") {
      logger.error(`Browser console: ${text}`);
    } else {
      logger.warn(`Browser console: ${text}`);
    }
  });

  const offException = page.on("Runtime.exceptionThrown", (raw) => {
    const event = raw as ExceptionThrownEvent;
    const message =
      event.exceptionDetails.exception?.description ??
      stringifyRemoteObject(event.exceptionDetails.exception ?? {}) ??
      event.exceptionDetails.text ??
      "Unknown page error";
    logger.error(`Page error: ${message}`);
  });

  const offRequestWillBeSent = page.on("Network.requestWillBeSent", (raw) => {
    const event = raw as NetworkRequestWillBeSentEvent;
    requestUrls.set(event.requestId, event.request.url);
    if (requestUrls.size > 4096) {
      // Bound the cache so a long-running render doesn't grow without limit.
      const firstKey = requestUrls.keys().next().value;
      if (firstKey !== undefined) {
        requestUrls.delete(firstKey);
      }
    }
  });

  const offLoadingFailed = page.on("Network.loadingFailed", (raw) => {
    const event = raw as NetworkLoadingFailedEvent;
    const url = requestUrls.get(event.requestId) ?? "(unknown url)";
    requestUrls.delete(event.requestId);
    if (isBenignAbortedVideoAssetRequest(url, event.errorText)) {
      return;
    }
    logger.warn(`Request failed: ${url}${event.errorText ? ` (${event.errorText})` : ""}`);
  });

  return () => {
    offConsole();
    offException();
    offRequestWillBeSent();
    offLoadingFailed();
    requestUrls.clear();
  };
}

export function isBenignAbortedVideoAssetRequest(
  url: string,
  errorText: string | undefined | null
) {
  if (errorText !== "net::ERR_ABORTED" || !url.startsWith(ASSET_URL_PREFIX)) {
    return false;
  }

  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith(".mp4") ||
    lowerUrl.endsWith(".webm") ||
    lowerUrl.endsWith(".mov") ||
    lowerUrl.endsWith(".mkv")
  );
}

function stringifyRemoteObject(obj: RuntimeRemoteObject): string {
  if (obj.value !== undefined) {
    if (typeof obj.value === "string") {
      return obj.value;
    }
    try {
      return JSON.stringify(obj.value);
    } catch {
      return String(obj.value);
    }
  }
  return obj.description ?? "";
}
