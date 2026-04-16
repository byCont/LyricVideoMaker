import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/plugin.ts"],
  format: ["cjs"],
  outDir: "dist",
  clean: true,
  dts: false,
  // Plugin bundles are `new Function`-evaluated inside headless Chromium, where
  // `process` does not exist. Replace the dev check React uses so the bundled
  // react entry never evaluates a `process.env.NODE_ENV` lookup at call time.
  define: {
    "process.env.NODE_ENV": JSON.stringify("production")
  },
  outExtension() {
    return { js: ".cjs" };
  }
});
