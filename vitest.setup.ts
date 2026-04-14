import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement HTMLMediaElement methods — stub them to avoid noisy errors
Object.defineProperty(globalThis.HTMLMediaElement?.prototype ?? {}, "pause", {
  configurable: true,
  value: () => {}
});
Object.defineProperty(globalThis.HTMLMediaElement?.prototype ?? {}, "play", {
  configurable: true,
  value: () => Promise.resolve()
});

// jsdom doesn't implement URL.createObjectURL/revokeObjectURL
if (typeof globalThis.URL.createObjectURL !== "function") {
  globalThis.URL.createObjectURL = () => "blob:mock";
}
if (typeof globalThis.URL.revokeObjectURL !== "function") {
  globalThis.URL.revokeObjectURL = () => {};
}
