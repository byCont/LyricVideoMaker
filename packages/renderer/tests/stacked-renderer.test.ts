import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createLyricRuntime, type SceneComponentDefinition, type ValidatedSceneComponentInstance } from "@lyric-video-maker/core";
import { createElement } from "react";
import {
  areAllComponentsStaticWhenMarkupUnchanged,
  buildCompositeFrameMarkup,
  preloadSceneAssets
} from "../src/index";

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==",
  "base64"
);

describe("stacked renderer helpers", () => {
  it("preloads image assets per component instance", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "lyric-video-renderer-test-"));
    const imageOnePath = join(workspace, "one.png");
    const imageTwoPath = join(workspace, "two.png");
    await writeFile(imageOnePath, transparentPng);
    await writeFile(imageTwoPath, transparentPng);

    try {
      const component = createImageComponent();
      const lookup = new Map([[component.id, component]]);
      const assets = await preloadSceneAssets(
        [
          createImageInstance("bg-1", imageOnePath),
          createImageInstance("bg-2", imageTwoPath)
        ],
        lookup,
        {
          width: 1920,
          height: 1080,
          fps: 30,
          durationMs: 2000,
          durationInFrames: 60
        },
        createLogger()
      );

      expect([...assets.values()].map((asset) => `${asset.instanceId}:${asset.optionId}`)).toEqual([
        "bg-1:imagePath",
        "bg-2:imagePath"
      ]);
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("renders layers in stack order", () => {
    const background = createTextComponent("background", true);
    const foreground = createTextComponent("foreground", false);
    const componentLookup = new Map<string, SceneComponentDefinition<Record<string, unknown>>>([
      [background.id, background],
      [foreground.id, foreground]
    ]);

    const markup = buildCompositeFrameMarkup({
      job: {
        id: "job-1",
        audioPath: "song.mp3",
        subtitlePath: "lyrics.srt",
        outputPath: "out.mp4",
        sceneId: "scene-1",
        sceneName: "Scene 1",
        components: [
          createTextInstance("bg-1", "background", "Background"),
          createTextInstance("fg-1", "foreground", "Foreground")
        ],
        lyrics: [],
        createdAt: new Date().toISOString(),
        video: {
          width: 1920,
          height: 1080,
          fps: 30,
          durationMs: 2000,
          durationInFrames: 60
        }
      },
      componentLookup,
      components: [
        createTextInstance("bg-1", "background", "Background"),
        createTextInstance("fg-1", "foreground", "Foreground")
      ],
      frame: 0,
      timeMs: 0,
      lyrics: createLyricRuntime([], 0),
      assets: {
        getUrl: () => null
      },
      prepared: {}
    });

    expect(markup.indexOf('data-scene-component-id="background"')).toBeLessThan(
      markup.indexOf('data-scene-component-id="foreground"')
    );
    expect(markup).toContain("Layer Background");
    expect(markup).toContain("Layer Foreground");
  });

  it("requires every component in the stack to be static before reusing a screenshot", () => {
    const staticComponent = createTextComponent("static", true);
    const dynamicComponent = createTextComponent("dynamic", false);
    const lookup = new Map<string, SceneComponentDefinition<Record<string, unknown>>>([
      [staticComponent.id, staticComponent],
      [dynamicComponent.id, dynamicComponent]
    ]);

    expect(
      areAllComponentsStaticWhenMarkupUnchanged(
        [createTextInstance("one", "static", "Static")],
        lookup
      )
    ).toBe(true);

    expect(
      areAllComponentsStaticWhenMarkupUnchanged(
        [
          createTextInstance("one", "static", "Static"),
          createTextInstance("two", "dynamic", "Dynamic")
        ],
        lookup
      )
    ).toBe(false);
  });
});

function createImageComponent(): SceneComponentDefinition<Record<string, unknown>> {
  return {
    id: "background-image",
    name: "Background Image",
    staticWhenMarkupUnchanged: true,
    options: [{ type: "image", id: "imagePath", label: "Image", required: true }],
    defaultOptions: {
      imagePath: ""
    },
    Component: () => null
  };
}

function createImageInstance(id: string, imagePath: string): ValidatedSceneComponentInstance {
  return {
    id,
    componentId: "background-image",
    componentName: "Background Image",
    enabled: true,
    options: {
      imagePath
    }
  };
}

function createTextComponent(
  id: string,
  staticWhenMarkupUnchanged: boolean
): SceneComponentDefinition<Record<string, unknown>> {
  return {
    id,
    name: id,
    staticWhenMarkupUnchanged,
    options: [{ type: "text", id: "label", label: "Label", defaultValue: id }],
    defaultOptions: {
      label: id
    },
    Component: ({ options }) => createElement("div", null, `Layer ${options.label}`)
  };
}

function createTextInstance(
  id: string,
  componentId: string,
  label: string
): ValidatedSceneComponentInstance {
  return {
    id,
    componentId,
    componentName: label,
    enabled: true,
    options: {
      label
    }
  };
}

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };
}
