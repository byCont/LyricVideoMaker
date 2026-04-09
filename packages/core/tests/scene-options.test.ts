import {
  createSceneFileData,
  parseSceneFileData,
  validateSceneComponents,
  validateSceneOptions
} from "../src/scenes";
import { SUPPORTED_FONT_FAMILIES } from "../src/constants";
import type {
  SceneComponentDefinition,
  SerializedSceneDefinition
} from "../src/types";

interface BackgroundImageOptions {
  imagePath: string;
}

const backgroundImageComponent: SceneComponentDefinition<BackgroundImageOptions> = {
  id: "background-image",
  name: "Background Image",
  options: [{ type: "image", id: "imagePath", label: "Background", required: true }],
  defaultOptions: {
    imagePath: ""
  },
  Component: () => null
};

const lyricsComponent: SceneComponentDefinition<{ lyricSize: number; lyricFont: string }> = {
  id: "lyrics-by-line",
  name: "Lyrics by Line",
  options: [
    {
      type: "category",
      id: "lyrics",
      label: "Lyrics",
      options: [
        { type: "number", id: "lyricSize", label: "Lyric Size", defaultValue: 72, min: 12, max: 100 },
        { type: "font", id: "lyricFont", label: "Lyric Font", defaultValue: SUPPORTED_FONT_FAMILIES[0] }
      ]
    }
  ],
  defaultOptions: {
    lyricSize: 72,
    lyricFont: SUPPORTED_FONT_FAMILIES[0]
  },
  Component: () => null
};

const scene: SerializedSceneDefinition = {
  id: "test-scene",
  name: "Test Scene",
  source: "built-in",
  readOnly: true,
  components: [
    {
      id: "bg-1",
      componentId: "background-image",
      enabled: true,
      options: {
        imagePath: "cover.png"
      }
    },
    {
      id: "lyrics-1",
      componentId: "lyrics-by-line",
      enabled: true,
      options: {}
    }
  ]
};

describe("scene validation", () => {
  it("applies defaults to component options", () => {
    const result = validateSceneOptions(
      lyricsComponent,
      {},
      {
        isFileAccessible: () => true
      }
    );

    expect(result).toEqual({
      lyricSize: 72,
      lyricFont: SUPPORTED_FONT_FAMILIES[0]
    });
  });

  it("validates a stacked scene with duplicate component types", () => {
    const result = validateSceneComponents(
      {
        ...scene,
        components: [
          ...scene.components,
          {
            id: "lyrics-2",
            componentId: "lyrics-by-line",
            enabled: true,
            options: {
              lyricSize: 64
            }
          }
        ]
      },
      [backgroundImageComponent, lyricsComponent],
      {
        isFileAccessible: () => true
      }
    );

    expect(result).toEqual([
      {
        id: "bg-1",
        componentId: "background-image",
        componentName: "Background Image",
        enabled: true,
        options: {
          imagePath: "cover.png"
        }
      },
      {
        id: "lyrics-1",
        componentId: "lyrics-by-line",
        componentName: "Lyrics by Line",
        enabled: true,
        options: {
          lyricSize: 72,
          lyricFont: SUPPORTED_FONT_FAMILIES[0]
        }
      },
      {
        id: "lyrics-2",
        componentId: "lyrics-by-line",
        componentName: "Lyrics by Line",
        enabled: true,
        options: {
          lyricSize: 64,
          lyricFont: SUPPORTED_FONT_FAMILIES[0]
        }
      }
    ]);
  });

  it("rejects unknown component ids", () => {
    expect(() =>
      validateSceneComponents(
        {
          ...scene,
          components: [
            {
              id: "unknown-1",
              componentId: "unknown-component",
              enabled: true,
              options: {}
            }
          ]
        },
        [backgroundImageComponent, lyricsComponent]
      )
    ).toThrow(/Unknown scene component/);
  });

  it("rejects missing image assets", () => {
    expect(() =>
      validateSceneComponents(scene, [backgroundImageComponent, lyricsComponent], {
        isFileAccessible: () => false
      })
    ).toThrow(/does not point to a readable file/);
  });

  it("rejects unsupported fonts", () => {
    expect(() =>
      validateSceneComponents(
        {
          ...scene,
          components: [
            scene.components[0],
            {
              id: "lyrics-1",
              componentId: "lyrics-by-line",
              enabled: true,
              options: {
                lyricFont: "Papyrus"
              }
            }
          ]
        },
        [backgroundImageComponent, lyricsComponent],
        {
          isFileAccessible: () => true
        }
      )
    ).toThrow(/not a supported font selection/);
  });

  it("round-trips scene files", () => {
    const parsed = parseSceneFileData(createSceneFileData(scene));

    expect(parsed).toEqual(scene);
  });
});
