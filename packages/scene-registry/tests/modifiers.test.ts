/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import {
  builtInModifiers,
  getModifierDefinition,
  opacityModifier,
  timingModifier,
  transformModifier,
  visibilityModifier
} from "../src/modifiers";

const video = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationMs: 5000,
  durationInFrames: 150
};

const emptyLyrics = { current: null, next: null };

function newElement(): HTMLDivElement {
  return document.createElement("div");
}

describe("built-in modifier registry", () => {
  it("exposes all four built-ins", () => {
    expect(builtInModifiers.map((m) => m.id).sort()).toEqual(
      ["opacity", "timing", "transform", "visibility"].sort()
    );
  });

  it("getModifierDefinition resolves by id", () => {
    expect(getModifierDefinition("transform")).toBe(transformModifier);
    expect(getModifierDefinition("not-real")).toBeUndefined();
  });
});

describe("transform modifier apply", () => {
  it("writes position + size style derived from options", () => {
    const element = newElement();
    transformModifier.apply({
      element,
      options: { ...transformModifier.defaultOptions, x: 25, y: 50, width: 40, height: 30 },
      frame: 0,
      timeMs: 0,
      video,
      lyrics: emptyLyrics
    });
    expect(element.style.position).toBe("absolute");
    expect(element.style.left).toBe("25%");
    expect(element.style.top).toBe("50%");
    expect(element.style.width).toBe("40%");
    expect(element.style.height).toBe("30%");
  });

  it("includes rotation and flip in the transform chain", () => {
    const element = newElement();
    transformModifier.apply({
      element,
      options: {
        ...transformModifier.defaultOptions,
        rotation: 45,
        flipHorizontal: true
      },
      frame: 0,
      timeMs: 0,
      video,
      lyrics: emptyLyrics
    });
    expect(element.style.transform).toContain("rotate(45deg)");
    expect(element.style.transform).toContain("scale(-1, 1)");
  });
});

describe("timing modifier apply", () => {
  it("writes full opacity when no timing window is set", () => {
    const element = newElement();
    timingModifier.apply({
      element,
      options: timingModifier.defaultOptions,
      frame: 0,
      timeMs: 0,
      video,
      lyrics: emptyLyrics
    });
    expect(element.style.opacity).toBe("1");
    expect(element.style.pointerEvents).toBe("");
  });

  it("writes zero opacity before start time and disables pointer events", () => {
    const element = newElement();
    timingModifier.apply({
      element,
      options: { ...timingModifier.defaultOptions, startTime: 1000 },
      frame: 0,
      timeMs: 500,
      video,
      lyrics: emptyLyrics
    });
    expect(element.style.opacity).toBe("0");
    expect(element.style.pointerEvents).toBe("none");
  });

  it("fades in over fadeInDuration", () => {
    const element = newElement();
    timingModifier.apply({
      element,
      options: {
        ...timingModifier.defaultOptions,
        startTime: 0,
        fadeInDuration: 1000,
        easing: "linear"
      },
      frame: 0,
      timeMs: 500,
      video,
      lyrics: emptyLyrics
    });
    expect(Number(element.style.opacity)).toBeCloseTo(0.5, 2);
  });
});

describe("opacity modifier apply", () => {
  it("writes fractional opacity derived from percent value", () => {
    const element = newElement();
    opacityModifier.apply({
      element,
      options: { value: 40 },
      frame: 0,
      timeMs: 0,
      video,
      lyrics: emptyLyrics
    });
    expect(element.style.opacity).toBe("0.4");
  });

  it("clamps out-of-range percent values", () => {
    const element = newElement();
    opacityModifier.apply({
      element,
      options: { value: 150 },
      frame: 0,
      timeMs: 0,
      video,
      lyrics: emptyLyrics
    });
    expect(element.style.opacity).toBe("1");
  });
});

describe("visibility modifier apply", () => {
  it("hides via display:none when visible is false", () => {
    const element = newElement();
    visibilityModifier.apply({
      element,
      options: { visible: false },
      frame: 0,
      timeMs: 0,
      video,
      lyrics: emptyLyrics
    });
    expect(element.style.display).toBe("none");
  });

  it("restores default display when visible is true", () => {
    const element = newElement();
    element.style.display = "none";
    visibilityModifier.apply({
      element,
      options: { visible: true },
      frame: 0,
      timeMs: 0,
      video,
      lyrics: emptyLyrics
    });
    expect(element.style.display).toBe("");
  });
});
