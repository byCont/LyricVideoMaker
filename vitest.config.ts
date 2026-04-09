import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  esbuild: {
    jsxDev: false
  },
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/**/tests/**/*.test.ts?(x)", "apps/**/src/**/*.test.ts?(x)"],
    coverage: {
      reporter: ["text", "html"]
    }
  },
  resolve: {
    alias: {
      "@lyric-video-maker/core": resolve(__dirname, "packages/core/src/index.ts"),
      "@lyric-video-maker/scene-registry": resolve(__dirname, "packages/scene-registry/src/index.ts"),
      "@lyric-video-maker/renderer": resolve(__dirname, "packages/renderer/src/index.ts"),
      react: resolve(__dirname, "node_modules/react/index.js"),
      "react/jsx-dev-runtime": resolve(__dirname, "node_modules/react/jsx-dev-runtime.js"),
      "react/jsx-runtime": resolve(__dirname, "node_modules/react/jsx-runtime.js"),
      "react-dom/client": resolve(__dirname, "node_modules/react-dom/client.js"),
      "react-dom/server": resolve(__dirname, "node_modules/react-dom/server.node.js"),
      "react-dom": resolve(__dirname, "node_modules/react-dom/index.js")
    }
  }
});
