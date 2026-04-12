import { spawn } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sidecarDir = join(rootDir, "sidecars", "subtitle-aligner");
const venvDir = join(sidecarDir, ".venv");
const venvPython =
  process.platform === "win32"
    ? join(venvDir, "Scripts", "python.exe")
    : join(venvDir, "bin", "python");

await main();

async function main() {
  const bootstrapPython = await resolveBootstrapPython();

  if (!(await pathExists(venvPython))) {
    console.log("Creating subtitle sidecar virtual environment...");
    await runCommand(bootstrapPython.command, [...bootstrapPython.args, "-m", "venv", venvDir]);
  }

  console.log("Installing subtitle sidecar dependencies...");
  await runCommand(venvPython, ["-m", "pip", "install", "--upgrade", "pip"]);
  await runCommand(venvPython, ["-m", "pip", "install", "-e", sidecarDir]);
}

async function resolveBootstrapPython() {
  const candidates = [
    { command: "py", args: ["-3"] },
    { command: "python", args: [] }
  ];

  for (const candidate of candidates) {
    if (await canRun(candidate.command, [...candidate.args, "--version"])) {
      return candidate;
    }
  }

  throw new Error("Python 3.10+ was not found. Install Python before running npm run setup:runtime.");
}

function canRun(command, args) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: "ignore",
      shell: false
    });

    child.once("error", () => resolvePromise(false));
    child.once("close", (code) => resolvePromise(code === 0));
  });
}

async function runCommand(command, args) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: "inherit",
      shell: false
    });

    child.once("error", rejectPromise);
    child.once("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} ${args.join(" ")} exited with code ${code}.`));
    });
  });
}

async function pathExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
