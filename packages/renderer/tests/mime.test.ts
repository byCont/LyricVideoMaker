import { describe, expect, it } from "vitest";
import { getMimeType } from "../src/assets/mime";

describe("getMimeType", () => {
  it("preserves image MIME detection", () => {
    expect(getMimeType("foo.png")).toBe("image/png");
    expect(getMimeType("FOO.PNG")).toBe("image/png");
    expect(getMimeType("foo.webp")).toBe("image/webp");
    expect(getMimeType("foo.gif")).toBe("image/gif");
    expect(getMimeType("foo.jpg")).toBe("image/jpeg");
    expect(getMimeType("foo.jpeg")).toBe("image/jpeg");
  });

  it("returns image/jpeg as default for unknown extensions", () => {
    expect(getMimeType("foo.bin")).toBe("image/jpeg");
  });

  it("detects video MIME types for the four supported extensions", () => {
    expect(getMimeType("clip.mp4")).toBe("video/mp4");
    expect(getMimeType("clip.webm")).toBe("video/webm");
    expect(getMimeType("clip.mov")).toBe("video/quicktime");
    expect(getMimeType("clip.mkv")).toBe("video/x-matroska");
  });

  it("is case-insensitive for video extensions", () => {
    expect(getMimeType("CLIP.MP4")).toBe("video/mp4");
    expect(getMimeType("Clip.WebM")).toBe("video/webm");
  });
});
