/**
 * Page-global per-frame readiness hook.
 *
 * The capture loop awaits this hook before screenshotting each frame so that
 * components which own async DOM work (e.g. seeking a video element to a
 * specific playback position) have a chance to settle before the image is
 * captured. The contract is component-agnostic: any asynchronous task can be
 * registered via `register(task, label?)`, and `awaitAll()` blocks until all
 * pending tasks resolve (or — in a future task, see T-045 — until a bounded
 * timeout elapses). After `awaitAll()` the pending list is cleared so each
 * frame starts fresh.
 *
 * The hook is installed in the browser page by the capture pipeline (T-043).
 * The live-DOM runtime registers readiness tasks from inside the browser page
 * (T-044). Bounded timeout + log surfacing is layered on in T-045.
 */

export interface FrameReadinessEntry {
  task: Promise<unknown>;
  label?: string;
}

export interface FrameReadinessHook {
  /**
   * Register an asynchronous readiness task for the current frame. The task
   * may be any Promise; the contract is not video-specific.
   */
  register(task: Promise<unknown>, label?: string): void;
  /**
   * Resolve once every currently-pending task has settled. Clears the pending
   * list on entry so subsequent calls represent the next frame's work.
   *
   * TODO (T-045): apply a bounded timeout per task and surface timeouts
   * through the render log without aborting the render.
   */
  awaitAll(): Promise<void>;
  /**
   * Number of currently-pending tasks. Primarily exposed for tests and
   * diagnostics.
   */
  readonly pendingCount: number;
}

export function createFrameReadinessHook(): FrameReadinessHook {
  let pending: FrameReadinessEntry[] = [];

  return {
    register(task, label) {
      pending.push({ task, label });
    },
    async awaitAll() {
      if (pending.length === 0) {
        return;
      }
      const toAwait = pending;
      pending = [];
      await Promise.allSettled(toAwait.map((entry) => entry.task));
    },
    get pendingCount() {
      return pending.length;
    }
  };
}

/**
 * Install a fresh readiness hook on the given target object (e.g. `window`).
 * Idempotent: if a hook already exists on the target it is replaced.
 */
export function installFrameReadinessHook<
  T extends { __frameReadiness?: FrameReadinessHook }
>(target: T): T & { __frameReadiness: FrameReadinessHook } {
  target.__frameReadiness = createFrameReadinessHook();
  return target as T & { __frameReadiness: FrameReadinessHook };
}

/**
 * Source of the install script, suitable for injection into the browser page
 * via `page.addInitScript`. The script installs `window.__frameReadiness` so
 * downstream code running in the page can register readiness tasks against it
 * and the Node side can await them before capturing each frame.
 *
 * The script is self-contained — it does not reference any module imports.
 */
export const FRAME_READINESS_INSTALL_SCRIPT = `;(function installFrameReadinessHook(){
  if (typeof window === "undefined") { return; }
  var pending = [];
  window.__frameReadiness = {
    register: function(task, label){ pending.push({ task: task, label: label }); },
    awaitAll: function(){
      if (pending.length === 0) { return Promise.resolve(); }
      var toAwait = pending;
      pending = [];
      return Promise.allSettled(toAwait.map(function(entry){ return entry.task; })).then(function(){});
    },
    get pendingCount(){ return pending.length; }
  };
})();`;

declare global {
  interface Window {
    __frameReadiness?: FrameReadinessHook;
  }
}
