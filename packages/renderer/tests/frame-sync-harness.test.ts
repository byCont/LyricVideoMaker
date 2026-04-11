import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FRAME_READINESS_SCRIPT_SOURCE } from "../src/live-dom";

/**
 * T-048 — video-frame-sync R7 independent verification harness.
 *
 * Exercises the readiness gate and live-DOM seek helper in isolation,
 * without booting playwright or mounting the Video component. The
 * harness drives a fake <video> element through the gate and confirms:
 *   1. Capture (awaitAll) waits for the seek to complete.
 *   2. A no-video scene resolves awaitAll with zero added latency
 *      (no throughput regression).
 *
 * This is the predecessor to the full preview smoke in T-059 and
 * provides a fast unit-level regression net.
 */

class FakeVideo {
  public currentTime = 0;
  private listeners = new Map<string, Array<() => void>>();
  addEventListener(event: string, handler: () => void) {
    const list = this.listeners.get(event) ?? [];
    list.push(handler);
    this.listeners.set(event, list);
  }
  removeEventListener(event: string, handler: () => void) {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(
      event,
      list.filter((h) => h !== handler)
    );
  }
  dispatchSeeked() {
    const list = this.listeners.get("seeked") ?? [];
    list.slice().forEach((h) => h());
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function installScript(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fakeWindow: any = {};
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const evaluator = new Function("window", FRAME_READINESS_SCRIPT_SOURCE);
  evaluator(fakeWindow);
  return fakeWindow;
}

describe("frame-sync verification harness (T-048)", () => {
  it("drives a video element through the gate: capture waits for seek completion", async () => {
    const w = installScript();
    const video = new FakeVideo();
    video.currentTime = 0;

    const readiness = w.__syncVideoElement(video, 3.5, "harness-clip");
    expect(readiness).not.toBeNull();
    w.__frameReadiness.register(readiness, "harness-clip");

    let captured = false;
    const awaiting = w.__frameReadiness.awaitAll().then(() => {
      captured = true;
    });

    await new Promise((r) => setTimeout(r, 5));
    expect(captured).toBe(false); // gate is holding

    video.dispatchSeeked();
    await awaiting;
    expect(captured).toBe(true); // gate released after seek settled
    expect(video.currentTime).toBe(3.5);
  });

  it("no-video benchmark: awaitAll resolves in effectively zero time with no regressions", async () => {
    const w = installScript();
    // Prime the gate with several empty frames — similar to what a
    // no-video scene would experience during a 30-frame preview burst.
    const samples: number[] = [];
    for (let i = 0; i < 30; i += 1) {
      const start = Date.now();
      await w.__frameReadiness.awaitAll();
      samples.push(Date.now() - start);
    }
    const maxLatency = Math.max(...samples);
    const avgLatency = samples.reduce((s, v) => s + v, 0) / samples.length;
    // Arbitrary but generous upper bounds — the hook should be
    // effectively free per frame when no tasks are pending.
    expect(maxLatency).toBeLessThan(20);
    expect(avgLatency).toBeLessThan(5);
  });

  describe("timeout path", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("stuck seek releases the gate after the bounded timeout (harness proof)", async () => {
      const w = installScript();
      w.__frameReadinessSetCurrentFrame(7);
      const video = new FakeVideo();
      const readiness = w.__syncVideoElement(video, 10.0, "stuck-harness");
      w.__frameReadiness.register(readiness, "stuck-harness");

      const all = w.__frameReadiness.awaitAll();
      await vi.advanceTimersByTimeAsync(1100);
      await expect(all).resolves.toBeUndefined();

      const drained = w.__frameReadinessDrainTimeoutEvents();
      expect(drained).toHaveLength(1);
      expect(drained[0].frame).toBe(7);
    });
  });
});
