import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@lyric-video-maker/core": resolve(__dirname, "../../packages/core/src/index.ts"),
      "@lyric-video-maker/scene-registry": resolve(__dirname, "../../packages/scene-registry/src/index.ts"),
      "@lyric-video-maker/renderer": resolve(__dirname, "../../packages/renderer/src/index.ts")
    },
    dedupe: ["react", "react-dom"]
  },
  build: {
    outDir: "dist"
  }
});
