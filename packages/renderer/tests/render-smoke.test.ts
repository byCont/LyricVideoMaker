import { spawn } from "node:child_process";

const shouldRun = process.env.RUN_RENDER_SMOKE === "1";

describe.skipIf(!shouldRun)("render smoke test", () => {
  it("renders an mp4 close to the source duration", async () => {
    await runCommand("npm", ["run", "build"]);
    await runCommand("node", ["packages/renderer/tests/render-smoke-runner.mjs"]);
  }, 180_000);
});

async function runCommand(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}
