import React from "react";
import type { SceneComponentDefinition } from "@lyric-video-maker/core";
import { withAlpha } from "../shared/color";

export interface BackgroundColorOptions {
  mode: string;
  color: string;
  opacity: number;
  direction: string;
  topColor: string;
  topOpacity: number;
  bottomColor: string;
  bottomOpacity: number;
}

const GRADIENT_DIRECTIONS: { label: string; value: string }[] = [
  { label: "Top to Bottom", value: "180deg" },
  { label: "Bottom to Top", value: "0deg" },
  { label: "Left to Right", value: "90deg" },
  { label: "Right to Left", value: "270deg" },
  { label: "Top-Left to Bottom-Right", value: "135deg" },
  { label: "Top-Right to Bottom-Left", value: "225deg" },
  { label: "Bottom-Left to Top-Right", value: "45deg" },
  { label: "Bottom-Right to Top-Left", value: "315deg" }
];

export const backgroundColorComponent: SceneComponentDefinition<BackgroundColorOptions> = {
  id: "background-color",
  name: "Background Color",
  description: "Fills the frame with a solid color or gradient.",
  staticWhenMarkupUnchanged: true,
  options: [
    {
      type: "category",
      id: "background",
      label: "Background",
      defaultExpanded: false,
      options: [
        {
          type: "select",
          id: "mode",
          label: "Mode",
          defaultValue: "gradient",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Gradient", value: "gradient" }
          ]
        },
        { type: "color", id: "color", label: "Color", defaultValue: "#09090f" },
        {
          type: "number",
          id: "opacity",
          label: "Opacity",
          defaultValue: 60,
          min: 0,
          max: 100,
          step: 1
        },
        {
          type: "select",
          id: "direction",
          label: "Direction",
          defaultValue: "180deg",
          options: GRADIENT_DIRECTIONS
        },
        { type: "color", id: "topColor", label: "Start Color", defaultValue: "#09090f" },
        {
          type: "number",
          id: "topOpacity",
          label: "Start Opacity",
          defaultValue: 60,
          min: 0,
          max: 100,
          step: 1
        },
        { type: "color", id: "bottomColor", label: "End Color", defaultValue: "#09090f" },
        {
          type: "number",
          id: "bottomOpacity",
          label: "End Opacity",
          defaultValue: 60,
          min: 0,
          max: 100,
          step: 1
        }
      ]
    }
  ],
  defaultOptions: {
    mode: "gradient",
    color: "#09090f",
    opacity: 60,
    direction: "180deg",
    topColor: "#09090f",
    topOpacity: 60,
    bottomColor: "#09090f",
    bottomOpacity: 60
  },
  Component: ({ options }) => {
    const background =
      options.mode === "solid"
        ? withAlpha(options.color, options.opacity / 100)
        : `linear-gradient(${options.direction}, ${withAlpha(options.topColor, options.topOpacity / 100)} 0%, ${withAlpha(
            options.bottomColor,
            options.bottomOpacity / 100
          )} 100%)`;

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background
        }}
      />
    );
  }
};
