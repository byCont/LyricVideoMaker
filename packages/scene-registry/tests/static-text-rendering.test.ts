import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATIC_TEXT_OPTIONS,
  type StaticTextComponentOptions
} from "../src/components/static-text";
import {
  applyTokenSubstitution,
  buildStaticTextInitialState
} from "../src/components/static-text/runtime";

function withText(overrides: Partial<StaticTextComponentOptions>): StaticTextComponentOptions {
  return { ...DEFAULT_STATIC_TEXT_OPTIONS, ...overrides };
}

describe("Static Text rendering — color modes + case", () => {
  it("solid color mode fills the text with the configured color", () => {
    const state = buildStaticTextInitialState(
      withText({ colorMode: "solid", color: "#ff00ff" })
    );
    expect(state.html).toContain("color:#ff00ff");
  });

  it("gradient color mode uses a linear-gradient background-clip:text", () => {
    const state = buildStaticTextInitialState(
      withText({ colorMode: "gradient", gradientStart: "#ff0000", gradientEnd: "#00ff00" })
    );
    expect(state.html).toContain("linear-gradient(");
    expect(state.html).toContain("background-clip:text");
  });

  it("text case switches produce the expected casing", () => {
    expect(
      buildStaticTextInitialState(withText({ text: "Hello World", textCase: "uppercase" }))
        .resolvedText
    ).toBe("HELLO WORLD");
    expect(
      buildStaticTextInitialState(withText({ text: "Hello World", textCase: "lowercase" }))
        .resolvedText
    ).toBe("hello world");
    expect(
      buildStaticTextInitialState(withText({ text: "hello world", textCase: "title-case" }))
        .resolvedText
    ).toBe("Hello World");
    expect(
      buildStaticTextInitialState(withText({ text: "Hello World", textCase: "as-typed" }))
        .resolvedText
    ).toBe("Hello World");
  });
});

describe("Static Text rendering — border/shadow/glow/backdrop", () => {
  it("border + drop shadow + glow can coexist (multiple text-shadow stops)", () => {
    const state = buildStaticTextInitialState(
      withText({
        borderEnabled: true,
        borderThickness: 3,
        shadowEnabled: true,
        glowEnabled: true
      })
    );
    const match = /text-shadow:([^;]+);/.exec(state.html);
    expect(match).not.toBeNull();
    const stops = match![1].split(",").map((s) => s.trim());
    expect(stops.length).toBe(10);
  });

  it("backdrop renders behind the text with padding, opacity, and radius when enabled", () => {
    const state = buildStaticTextInitialState(
      withText({ backdropEnabled: true, backdropColor: "#123456", backdropOpacity: 80, backdropCornerRadius: 24 })
    );
    expect(state.html).toMatch(/background:rgba\(18, 52, 86, 0\.8\)/);
    expect(state.html).toContain("border-radius:24px");
  });

  it("backdrop is absent when disabled", () => {
    const state = buildStaticTextInitialState(withText({ backdropEnabled: false }));
    expect(state.html).not.toContain("rgba(");
  });
});

describe("Static Text token substitution", () => {
  it("enabled tokens replace available metadata keys", () => {
    const out = applyTokenSubstitution("Now playing: {songTitle}", true, {
      songTitle: "Ocean"
    });
    expect(out).toBe("Now playing: Ocean");
  });

  it("enabled tokens leave unavailable keys literal (no crash)", () => {
    const out = applyTokenSubstitution("By {songArtist}", true, { songTitle: "Ocean" });
    expect(out).toBe("By {songArtist}");
  });

  it("disabled tokens render curly-brace sequences literally", () => {
    const out = applyTokenSubstitution("Test {any}", false, { songTitle: "Ocean" });
    expect(out).toBe("Test {any}");
  });
});

describe("Static Text stable tokens", () => {
  it("resolves tokens the same across renders (stable within a render)", () => {
    const base = withText({ enableTokens: true, text: "Title: {songTitle}" });
    const a = buildStaticTextInitialState(base, { songTitle: "Ocean" });
    const b = buildStaticTextInitialState(base, { songTitle: "Ocean" });
    expect(a.resolvedText).toBe(b.resolvedText);
  });
});

describe("Static Text defaults", () => {
  it("produce a legible placeholder with positive font size and contrasting color", () => {
    expect(DEFAULT_STATIC_TEXT_OPTIONS.text.length).toBeGreaterThan(0);
    expect(DEFAULT_STATIC_TEXT_OPTIONS.fontSize).toBeGreaterThanOrEqual(16);
    expect(DEFAULT_STATIC_TEXT_OPTIONS.color).toBe("#ffffff");
  });
});
