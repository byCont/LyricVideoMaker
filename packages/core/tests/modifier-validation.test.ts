import { describe, expect, it } from "vitest";
import { validateSceneComponents, validateSceneModifiers } from "../src/scenes";
import type { ModifierDefinition, SceneComponentDefinition } from "../src/types";

const opacityModifier: ModifierDefinition<{ value: number }> = {
  id: "opacity",
  name: "Opacity",
  options: [
    { type: "number", id: "value", label: "Value", defaultValue: 100, min: 0, max: 100, step: 1 }
  ],
  defaultOptions: { value: 100 },
  apply: () => {}
};

const timingModifier: ModifierDefinition<{ startTime: number }> = {
  id: "timing",
  name: "Timing",
  options: [
    { type: "number", id: "startTime", label: "Start Time", defaultValue: 0, min: 0, step: 10 }
  ],
  defaultOptions: { startTime: 0 },
  apply: () => {}
};

const imageComponent: SceneComponentDefinition<{ source: string }> = {
  id: "image",
  name: "Image",
  options: [{ type: "image", id: "source", label: "Source", required: false }],
  defaultOptions: { source: "" },
  Component: () => null
};

describe("validateSceneModifiers", () => {
  it("returns empty result for missing or empty lists", () => {
    const result = validateSceneModifiers("image-1", undefined, []);
    expect(result.modifiers).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("drops unknown modifier ids with a warning", () => {
    const result = validateSceneModifiers(
      "image-1",
      [{ id: "mod-1", modifierId: "ghost", enabled: true, options: {} }],
      []
    );
    expect(result.modifiers).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({
      level: "warn",
      message: expect.stringContaining("ghost")
    });
  });

  it("throws on duplicate modifier instance ids within a single component", () => {
    expect(() =>
      validateSceneModifiers(
        "image-1",
        [
          { id: "dup", modifierId: "opacity", enabled: true, options: {} },
          { id: "dup", modifierId: "timing", enabled: true, options: {} }
        ],
        [
          opacityModifier as unknown as ModifierDefinition<Record<string, unknown>>,
          timingModifier as unknown as ModifierDefinition<Record<string, unknown>>
        ]
      )
    ).toThrow(/duplicate modifier/);
  });

  it("applies option defaults when raw options are partial", () => {
    const result = validateSceneModifiers(
      "image-1",
      [{ id: "op-1", modifierId: "opacity", enabled: true, options: {} }],
      [opacityModifier as unknown as ModifierDefinition<Record<string, unknown>>]
    );
    expect(result.modifiers).toHaveLength(1);
    expect(result.modifiers[0]).toMatchObject({
      id: "op-1",
      modifierId: "opacity",
      modifierName: "Opacity",
      enabled: true,
      options: { value: 100 }
    });
  });

  it("clamps out-of-range numbers to min/max", () => {
    const result = validateSceneModifiers(
      "image-1",
      [{ id: "op-1", modifierId: "opacity", enabled: true, options: { value: 999 } }],
      [opacityModifier as unknown as ModifierDefinition<Record<string, unknown>>]
    );
    expect(result.modifiers[0].options.value).toBe(100);
  });
});

describe("validateSceneComponents wiring", () => {
  it("collects modifier warnings into the result", () => {
    const result = validateSceneComponents(
      {
        id: "s",
        name: "s",
        source: "built-in",
        readOnly: true,
        components: [
          {
            id: "image-1",
            componentId: "image",
            enabled: true,
            modifiers: [
              { id: "ghost-1", modifierId: "ghost", enabled: true, options: {} }
            ],
            options: {}
          }
        ]
      },
      [imageComponent as unknown as SceneComponentDefinition<Record<string, unknown>>],
      [],
      {}
    );
    expect(result.components[0].modifiers).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });
});
