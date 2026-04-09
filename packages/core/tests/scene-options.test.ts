import { validateSceneOptions } from "../src/scenes";
import { SUPPORTED_FONT_FAMILIES } from "../src/constants";
import type { SceneDefinition } from "../src/types";

interface TestOptions {
  backgroundImage: string;
  lyricSize: number;
  lyricFont: string;
}

const scene: SceneDefinition<TestOptions> = {
  id: "test-scene",
  name: "Test Scene",
  options: [
    { type: "image", id: "backgroundImage", label: "Background", required: true },
    { type: "number", id: "lyricSize", label: "Lyric Size", defaultValue: 72, min: 12, max: 100 },
    { type: "font", id: "lyricFont", label: "Lyric Font", defaultValue: SUPPORTED_FONT_FAMILIES[0] }
  ],
  defaultOptions: {
    backgroundImage: "",
    lyricSize: 72,
    lyricFont: SUPPORTED_FONT_FAMILIES[0]
  },
  Component: () => null
};

describe("validateSceneOptions", () => {
  it("applies defaults", () => {
    const result = validateSceneOptions(
      scene,
      { backgroundImage: "cover.png" },
      {
        isFileAccessible: () => true
      }
    );

    expect(result).toEqual({
      backgroundImage: "cover.png",
      lyricSize: 72,
      lyricFont: SUPPORTED_FONT_FAMILIES[0]
    });
  });

  it("rejects missing image assets", () => {
    expect(() =>
      validateSceneOptions(
        scene,
        { backgroundImage: "missing.png" },
        {
          isFileAccessible: () => false
        }
      )
    ).toThrow(/does not point to a readable file/);
  });

  it("rejects unsupported fonts", () => {
    expect(() =>
      validateSceneOptions(
        scene,
        { backgroundImage: "cover.png", lyricFont: "Papyrus" },
        {
          isFileAccessible: () => true
        }
      )
    ).toThrow(/not a supported font selection/);
  });
});
