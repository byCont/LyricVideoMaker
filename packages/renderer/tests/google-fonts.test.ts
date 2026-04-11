import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import type { SceneComponentDefinition, ValidatedSceneComponentInstance } from "@lyric-video-maker/core";
import {
  buildGoogleFontsCss2Url,
  collectGoogleFontRequests,
  prepareGoogleFonts,
  rewriteGoogleFontCssUrls
} from "../src";

const css = `
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/montserrat/v30/font-a.woff2) format('woff2');
}
`;

describe("Google Font cache", () => {
  it("builds Google Fonts CSS2 URLs with encoded family and weights", () => {
    expect(buildGoogleFontsCss2Url({ family: "Playfair Display", weights: [700, 400] })).toBe(
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap"
    );
  });

  it("collects font fields and component weights", () => {
    const requests = collectGoogleFontRequests([createInstance()], createLookup());

    expect(requests).toEqual([
      {
        family: "Montserrat",
        weights: [400, 700]
      }
    ]);
  });

  it("rewrites Google font files to local cache routes", async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), "lvm-fonts-"));
    try {
      const fetchImpl = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
      const rewritten = await rewriteGoogleFontCssUrls({
        css,
        family: "Montserrat",
        fontCacheDir: cacheDir,
        fetchImpl: fetchImpl as typeof fetch
      });

      expect(rewritten).toContain("http://lyric-video.local/fonts/");
      expect(rewritten).toContain(".woff2");
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    } finally {
      await rm(cacheDir, { recursive: true, force: true });
    }
  });

  it("reuses cached CSS without network", async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), "lvm-fonts-"));
    try {
      const fetchImpl = vi.fn(async (url: string) => {
        if (url.includes("fonts.googleapis.com")) {
          return new Response(css, { status: 200 });
        }
        return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
      });
      await prepareGoogleFonts({
        components: [createInstance()],
        componentLookup: createLookup(),
        fontCacheDir: cacheDir,
        logger: testLogger,
        fetchImpl: fetchImpl as typeof fetch
      });

      const failingFetch = vi.fn(async () => {
        throw new Error("network should not be used");
      });
      const cached = await prepareGoogleFonts({
        components: [createInstance()],
        componentLookup: createLookup(),
        fontCacheDir: cacheDir,
        logger: testLogger,
        fetchImpl: failingFetch as typeof fetch
      });

      expect(cached.css).toContain("http://lyric-video.local/fonts/");
      expect(failingFetch).not.toHaveBeenCalled();
    } finally {
      await rm(cacheDir, { recursive: true, force: true });
    }
  });

  it("fails clearly for unsafe custom font names", async () => {
    await expect(
      prepareGoogleFonts({
        components: [createInstance("Roboto;body{}")],
        componentLookup: createLookup(),
        fontCacheDir: "unused",
        logger: testLogger,
        fetchImpl: vi.fn() as unknown as typeof fetch
      })
    ).rejects.toThrow(/not a safe Google Font family name/);
  });
});

function createLookup() {
  return new Map<string, SceneComponentDefinition<Record<string, unknown>>>([
    [
      "lyrics",
      {
        id: "lyrics",
        name: "Lyrics",
        options: [{ type: "font", id: "lyricFont", label: "Lyric Font", defaultValue: "Montserrat" }],
        defaultOptions: {},
        Component: () => null
      }
    ]
  ]);
}

function createInstance(font = "Montserrat"): ValidatedSceneComponentInstance {
  return {
    id: "lyrics-1",
    componentId: "lyrics",
    componentName: "Lyrics",
    enabled: true,
    options: {
      lyricFont: font
    }
  };
}

const testLogger = {
  info() {},
  warn() {},
  error() {}
};
