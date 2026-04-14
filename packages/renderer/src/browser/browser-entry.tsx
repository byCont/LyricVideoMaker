/**
 * Browser bundle entry point.
 *
 * This file is the esbuild entry for the self-contained IIFE bundle injected
 * into Chromium render pages. It imports:
 *   1. The React shell framework (react-shell.tsx)
 *   2. All built-in scene component Component functions
 *
 * Components are registered into the browser-side registry so the React shell
 * can look them up by componentId at render time.
 *
 * This file is NOT part of the renderer's normal module graph — it is bundled
 * separately by scripts/build-browser-bundle.mjs.
 */

// Shell — sets up React root, mount/update globals, readiness scanning
import React from "react";
import "./react-shell";

// Built-in component definitions (all browser-safe — no Node.js deps)
// Paths use the ~scene-registry alias resolved by the build script.
import { backgroundColorComponent } from "~scene-registry/components/background-color";
import { imageComponent } from "~scene-registry/components/image/component";
import { shapeComponent } from "~scene-registry/components/shape/component";
import { staticTextComponent } from "~scene-registry/components/static-text/component";
import { equalizerComponent } from "~scene-registry/components/equalizer/component";
import { lyricsByLineComponent } from "~scene-registry/components/lyrics-by-line/component";
import { slideshowComponent } from "~scene-registry/components/slideshow/component";

// Video uses a separate react-component file to avoid pulling in prepare→probe→child_process
import { VideoRenderComponent } from "~scene-registry/components/video/react-component";

// Transform/timing utilities for plugin host
import {
  computeTransformStyle,
  computeTimingOpacity,
  transformCategory,
  timingCategory,
  DEFAULT_TRANSFORM_OPTIONS,
  DEFAULT_TIMING_OPTIONS
} from "@lyric-video-maker/plugin-base";

// Register all built-in components
const register = (window as any).__registerReactComponent;

register("background-color", backgroundColorComponent.Component);
register("image", imageComponent.Component);
register("shape", shapeComponent.Component);
register("static-text", staticTextComponent.Component);
register("equalizer", equalizerComponent.Component);
register("lyrics-by-line", lyricsByLineComponent.Component);
register("video", VideoRenderComponent);
register("slideshow", slideshowComponent.Component);

// Plugin host factory — used by activatePluginInBrowser to provide
// the host object that external plugins receive in activate(host).
(window as any).__getPluginHost = function () {
  return {
    React,
    core: {},
    transform: {
      computeTransformStyle,
      computeTimingOpacity,
      transformCategory,
      timingCategory,
      DEFAULT_TRANSFORM_OPTIONS,
      DEFAULT_TIMING_OPTIONS
    }
  };
};
