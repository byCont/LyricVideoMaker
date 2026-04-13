import { describe, expect, it } from "vitest";
import type { SceneOptionEntry, SceneOptionField } from "@lyric-video-maker/core";
import {
  builtInSceneComponents,
  imageComponent,
  shapeComponent,
  staticTextComponent,
  videoComponent
} from "../src/components";

function flattenOptions(options: SceneOptionEntry[]): SceneOptionField[] {
  return options.flatMap((entry) => (entry.type === "category" ? entry.options : [entry]));
}

describe("built-in component identities", () => {
  it("shape identifier is exactly 'shape'", () => {
    expect(shapeComponent.id).toBe("shape");
  });

  it("static-text identifier is exactly 'static-text'", () => {
    expect(staticTextComponent.id).toBe("static-text");
  });

  it("image identifier is exactly 'image'", () => {
    expect(imageComponent.id).toBe("image");
    const ids = builtInSceneComponents.map((c) => c.id);
    expect(ids).toContain("image");
    expect(ids.filter((id) => id === "image")).toHaveLength(1);
  });

  it("video identifier is exactly 'video'", () => {
    expect(videoComponent.id).toBe("video");
  });

  it("shape, static-text, image, and video are all registered in builtInSceneComponents", () => {
    const ids = builtInSceneComponents.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["shape", "static-text", "image", "video"]));
  });

  it("no two registered components share an identifier", () => {
    const ids = builtInSceneComponents.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("static-text has no asset fields (T-033)", () => {
  it("contains no fields of type 'image' or 'video' at any category depth", () => {
    const flat = flattenOptions(staticTextComponent.options);
    const assetFields = flat.filter((f) => f.type === "image" || f.type === "video");
    expect(assetFields).toEqual([]);
  });
});

describe("image component flows through existing asset preload (T-040)", () => {
  it("declares an image-type field that the existing preload loop picks up", () => {
    // preloadSceneAssets iterates over fields where field.type === "image"
    // and loads the option value via loadCachedAssetBody. By exposing at
    // least one image-type field here we prove the existing preload loop
    // will iterate over the Image component without any new asset-pipeline
    // code being added. No new preload code is written in this task.
    const flat = flattenOptions(imageComponent.options);
    const imageFields = flat.filter((f) => f.type === "image");
    expect(imageFields.length).toBeGreaterThanOrEqual(1);
    expect(imageFields[0].id).toBe("source");
  });
});
