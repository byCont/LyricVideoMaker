/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SceneOptionField } from "@lyric-video-maker/core";
import { OptionField } from "./form-fields";

const videoField: SceneOptionField = {
  type: "video",
  id: "clip",
  label: "Clip",
  required: true
};

const imageField: SceneOptionField = {
  type: "image",
  id: "img",
  label: "Image"
};

const fontField: SceneOptionField = {
  type: "font",
  id: "font",
  label: "Font",
  defaultValue: "Montserrat"
};

describe("OptionField — video field dispatch (T-015)", () => {
  it("renders a file pill with the selected path", () => {
    render(
      <OptionField
        field={videoField}
        inputPrefix="vid-1"
        value="/tmp/my-clip.mp4"
        fonts={[]}
        onChange={() => {}}
        onPickFile={() => {}}
      />
    );
    expect(screen.getByText("/tmp/my-clip.mp4")).toBeInTheDocument();
  });

  it('shows "Not selected" when no value is set', () => {
    render(
      <OptionField
        field={videoField}
        inputPrefix="vid-1"
        value=""
        fonts={[]}
        onChange={() => {}}
        onPickFile={() => {}}
      />
    );
    expect(screen.getByText("Not selected")).toBeInTheDocument();
  });

  it("clicking the button invokes onPickFile with kind 'video'", () => {
    const onPickFile = vi.fn();
    render(
      <OptionField
        field={videoField}
        inputPrefix="vid-1"
        value=""
        fonts={[]}
        onChange={() => {}}
        onPickFile={onPickFile}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /pick video/i }));
    expect(onPickFile).toHaveBeenCalledWith("video");
  });

  it("displays the selected path using the same pill markup as image fields", () => {
    const { container: videoContainer } = render(
      <OptionField
        field={videoField}
        inputPrefix="v"
        value="/p/clip.mp4"
        fonts={[]}
        onChange={() => {}}
        onPickFile={() => {}}
      />
    );

    const { container: imageContainer } = render(
      <OptionField
        field={imageField}
        inputPrefix="i"
        value="/p/pic.png"
        fonts={[]}
        onChange={() => {}}
        onPickFile={() => {}}
      />
    );

    const videoPill = videoContainer.querySelector(".file-pill");
    const imagePill = imageContainer.querySelector(".file-pill");
    expect(videoPill).not.toBeNull();
    expect(imagePill).not.toBeNull();
    expect(videoPill!.className).toBe(imagePill!.className);
  });

  it("renders font fields as searchable Google Font inputs with custom values", () => {
    const onChange = vi.fn();
    render(
      <OptionField
        field={fontField}
        inputPrefix="font-1"
        value="Montserrat"
        fonts={["Montserrat", "Poppins"]}
        onChange={onChange}
        onPickFile={() => {}}
      />
    );

    const input = screen.getByLabelText("Font");
    expect(input).toHaveAttribute("placeholder", "Search Google Fonts or type a custom family");
    expect(screen.getByDisplayValue("Montserrat")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Custom Google Font" } });
    expect(onChange).toHaveBeenCalledWith("Custom Google Font");
  });
});
