import type { PageClient } from "./browser/cdp-session";

/**
 * Per-frame readiness gate.
 *
 * Awaits any asynchronous readiness tasks that components registered with
 * `window.__frameReadiness` during the current frame — typically video
 * seeks in flight — so capture sees a settled DOM. Resolves immediately
 * when no tasks are pending, adding effectively zero latency to scenes
 * that do not register readiness tasks.
 *
 * Also drains any timeout events that the page emitted while waiting so
 * the render logger can surface them without aborting the render.
 */
export async function awaitFrameReadiness(
  page: PageClient
): Promise<{ timeouts: ReadinessTimeoutEvent[] }> {
  return await page.evaluate(async () => {
    const hook = (
      window as Window & {
        __frameReadiness?: { awaitAll(): Promise<void> };
        __frameReadinessDrainTimeoutEvents?: () => ReadinessTimeoutEvent[];
      }
    ).__frameReadiness;

    if (hook) {
      await hook.awaitAll();
    }

    // Wait for any in-flight @font-face loads to settle. Without this, the
    // first few frames render with fallback metrics and reflow once the
    // real font arrives — visible as text in slightly wrong positions.
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Some browsers reject fonts.ready on internal failures — ignore
        // and let the screenshot proceed with whatever fonts are loaded.
      }
    }

    const drain = (
      window as Window & {
        __frameReadinessDrainTimeoutEvents?: () => ReadinessTimeoutEvent[];
      }
    ).__frameReadinessDrainTimeoutEvents;

    return {
      timeouts: drain ? drain() : ([] as ReadinessTimeoutEvent[])
    };
  });
}

export interface ReadinessTimeoutEvent {
  frame: number;
  label: string | null;
  timeoutMs: number;
  timestamp: number;
}

/**
 * Standalone script source for the frame-readiness + video-sync helpers.
 *
 * Exported as a string so it can be inlined into the page shell IIFE and
 * unit-tested in isolation by eval'ing into a fake window.
 *
 * The script installs:
 *   - window.__frameReadiness  — the per-frame readiness gate
 *   - window.__syncImageFrameElement — helper to swap an <img> source and
 *                                      return a readiness promise
 *   - window.__frameReadinessSetCurrentFrame — internal hook so the frame
 *                                               loop records which frame is
 *                                               active when a timeout fires
 *   - window.__frameReadinessDrainTimeoutEvents — drain logged timeout
 *                                                  events for Node to report
 */
export const FRAME_READINESS_SCRIPT_SOURCE = `
  var pendingReadiness = [];
  var readinessTimeoutEvents = [];
  var currentFrameNumber = -1;

  window.__frameReadiness = {
    register: function(task, label) {
      pendingReadiness.push({ task: task, label: label });
    },
    awaitAll: function() {
      if (pendingReadiness.length === 0) {
        return Promise.resolve();
      }
      var tasks = pendingReadiness.splice(0, pendingReadiness.length);
      return Promise.allSettled(tasks.map(function(entry) { return entry.task; }))
        .then(function() {});
    },
    get pendingCount() { return pendingReadiness.length; }
  };

  window.__frameReadinessSetCurrentFrame = function(frame) {
    currentFrameNumber = typeof frame === "number" ? frame : -1;
  };

  window.__frameReadinessDrainTimeoutEvents = function() {
    return readinessTimeoutEvents.splice(0, readinessTimeoutEvents.length);
  };

  var IMAGE_FRAME_TIMEOUT_MS = 1000;

  function recordReadinessTimeout(label) {
    readinessTimeoutEvents.push({
      frame: currentFrameNumber,
      label: label || null,
      timeoutMs: IMAGE_FRAME_TIMEOUT_MS,
      timestamp: Date.now()
    });
    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        "[frame-readiness] timeout at frame " + currentFrameNumber +
        " label=" + (label || "(none)") +
        " timeoutMs=" + IMAGE_FRAME_TIMEOUT_MS
      );
    }
  }

  window.__syncImageFrameElement = function syncImageFrameElement(image, src, label) {
    if (!image || typeof src !== "string" || !src) {
      return null;
    }
    if ((image.currentSrc === src || image.src === src) && image.complete && image.naturalWidth > 0) {
      return null;
    }
    return new Promise(function(resolve) {
      var settled = false;
      var timer = null;
      function finish() {
        if (settled) return;
        settled = true;
        if (timer !== null) { clearTimeout(timer); }
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
        resolve();
      }
      function onLoad() {
        if (typeof image.decode === "function") {
          image.decode().then(finish, finish);
          return;
        }
        finish();
      }
      function onError() { finish(); }
      image.addEventListener("load", onLoad, { once: true });
      image.addEventListener("error", onError, { once: true });
      try {
        image.src = src;
        if (image.complete) {
          onLoad();
        }
      } catch (error) {
        finish();
      }
      timer = setTimeout(function() {
        if (!settled) {
          recordReadinessTimeout(label);
        }
        finish();
      }, IMAGE_FRAME_TIMEOUT_MS);
    });
  };
`;
