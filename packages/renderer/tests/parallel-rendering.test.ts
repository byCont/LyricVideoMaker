import { vi } from "vitest";
import {
  createOrderedFrameWriteQueue,
  resolveRenderParallelism
} from "../src/index";

describe("parallel rendering helpers", () => {
  const originalWorkerEnv = process.env.LYRIC_VIDEO_RENDER_WORKERS;

  afterEach(() => {
    if (originalWorkerEnv === undefined) {
      delete process.env.LYRIC_VIDEO_RENDER_WORKERS;
    } else {
      process.env.LYRIC_VIDEO_RENDER_WORKERS = originalWorkerEnv;
    }
  });

  it("resolves worker counts from explicit input and environment overrides", () => {
    process.env.LYRIC_VIDEO_RENDER_WORKERS = "8";

    expect(resolveRenderParallelism({ parallelism: 3, totalFrames: 20 })).toBe(3);
    expect(resolveRenderParallelism({ totalFrames: 9 })).toBe(4);
    expect(resolveRenderParallelism({ totalFrames: 1 })).toBe(1);
  });

  it("writes out-of-order frames to the mux queue in frame order", async () => {
    const writes: string[] = [];
    const frameQueue = {
      enqueue: vi.fn(async (frame: Buffer) => {
        writes.push(frame.toString("utf8"));
      }),
      finish: vi.fn(async () => undefined),
      abort: vi.fn(async () => undefined)
    };

    const orderedQueue = createOrderedFrameWriteQueue({
      totalFrames: 4,
      frameQueue
    });

    await orderedQueue.enqueue({ frame: 1, buffer: Buffer.from("1") });
    await orderedQueue.enqueue({ frame: 3, buffer: Buffer.from("3") });
    expect(writes).toEqual([]);

    await orderedQueue.enqueue({ frame: 0, buffer: Buffer.from("0") });
    expect(writes).toEqual(["0", "1"]);

    await orderedQueue.enqueue({ frame: 2, buffer: Buffer.from("2") });
    expect(writes).toEqual(["0", "1", "2", "3"]);

    await orderedQueue.finish();
    expect(frameQueue.finish).toHaveBeenCalledTimes(1);
  });

  it("fails finish when frames are missing", async () => {
    const orderedQueue = createOrderedFrameWriteQueue({
      totalFrames: 3,
      frameQueue: {
        enqueue: vi.fn(async () => undefined),
        finish: vi.fn(async () => undefined),
        abort: vi.fn(async () => undefined)
      }
    });

    await orderedQueue.enqueue({ frame: 1, buffer: Buffer.from("1") });

    await expect(orderedQueue.finish()).rejects.toThrow(
      "Render finished with missing frames."
    );
  });
});
