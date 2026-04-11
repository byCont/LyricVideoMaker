import { describe, expect, it } from "vitest";
import {
  FRAME_READINESS_INSTALL_SCRIPT,
  createFrameReadinessHook,
  installFrameReadinessHook
} from "../src/browser/readiness";

describe("createFrameReadinessHook", () => {
  it("resolves immediately when no tasks are pending", async () => {
    const hook = createFrameReadinessHook();
    const start = Date.now();
    await hook.awaitAll();
    expect(Date.now() - start).toBeLessThan(20);
    expect(hook.pendingCount).toBe(0);
  });

  it("blocks awaitAll until every registered task resolves", async () => {
    const hook = createFrameReadinessHook();
    let resolveA: () => void = () => {};
    let resolveB: () => void = () => {};
    const a = new Promise<void>((resolve) => {
      resolveA = resolve;
    });
    const b = new Promise<void>((resolve) => {
      resolveB = resolve;
    });
    hook.register(a, "a");
    hook.register(b, "b");
    expect(hook.pendingCount).toBe(2);

    let resolved = false;
    const awaiting = hook.awaitAll().then(() => {
      resolved = true;
    });

    await new Promise((r) => setTimeout(r, 5));
    expect(resolved).toBe(false);

    resolveA();
    await new Promise((r) => setTimeout(r, 5));
    expect(resolved).toBe(false);

    resolveB();
    await awaiting;
    expect(resolved).toBe(true);
  });

  it("clears the pending list between frames", async () => {
    const hook = createFrameReadinessHook();
    hook.register(Promise.resolve(1), "frame-1");
    await hook.awaitAll();
    expect(hook.pendingCount).toBe(0);

    hook.register(Promise.resolve(2), "frame-2");
    expect(hook.pendingCount).toBe(1);
    await hook.awaitAll();
    expect(hook.pendingCount).toBe(0);
  });

  it("accepts arbitrary promise types (component-agnostic contract)", async () => {
    const hook = createFrameReadinessHook();
    hook.register(Promise.resolve("string payload"));
    hook.register(Promise.resolve({ shape: "object" }));
    hook.register(Promise.resolve(42));
    await hook.awaitAll();
    expect(hook.pendingCount).toBe(0);
  });

  it("does not abort awaitAll on task rejection", async () => {
    const hook = createFrameReadinessHook();
    hook.register(Promise.reject(new Error("boom")));
    hook.register(Promise.resolve("ok"));
    await expect(hook.awaitAll()).resolves.toBeUndefined();
  });
});

describe("installFrameReadinessHook", () => {
  it("installs __frameReadiness on the given target", () => {
    const target: { __frameReadiness?: ReturnType<typeof createFrameReadinessHook> } = {};
    installFrameReadinessHook(target);
    expect(target.__frameReadiness).toBeDefined();
    expect(typeof target.__frameReadiness?.register).toBe("function");
    expect(typeof target.__frameReadiness?.awaitAll).toBe("function");
  });

  it("replaces an existing hook on re-install", () => {
    const target: { __frameReadiness?: ReturnType<typeof createFrameReadinessHook> } = {};
    installFrameReadinessHook(target);
    const first = target.__frameReadiness;
    installFrameReadinessHook(target);
    expect(target.__frameReadiness).not.toBe(first);
  });
});

describe("FRAME_READINESS_INSTALL_SCRIPT", () => {
  it("installs a working hook when evaluated in a window-like global", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeWindow: any = {};
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const evaluator = new Function("window", FRAME_READINESS_INSTALL_SCRIPT);
    evaluator(fakeWindow);

    expect(fakeWindow.__frameReadiness).toBeDefined();
    expect(typeof fakeWindow.__frameReadiness.register).toBe("function");
    expect(typeof fakeWindow.__frameReadiness.awaitAll).toBe("function");

    fakeWindow.__frameReadiness.register(Promise.resolve("injected"));
    await fakeWindow.__frameReadiness.awaitAll();
    expect(fakeWindow.__frameReadiness.pendingCount).toBe(0);
  });

  it("does not reference video specifically (component-agnostic)", () => {
    expect(FRAME_READINESS_INSTALL_SCRIPT.toLowerCase()).not.toContain("video");
  });
});
