import { spawn } from "node:child_process";
import { access, constants, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sidecarDir = join(rootDir, "sidecars", "subtitle-aligner");
const venvDir = join(sidecarDir, ".venv");
const venvPython =
  process.platform === "win32"
    ? join(venvDir, "Scripts", "python.exe")
    : join(venvDir, "bin", "python");
const specFile = join(sidecarDir, "pyinstaller.spec");
const distFrozenDir = join(sidecarDir, "dist-frozen");
const buildWorkDir = join(sidecarDir, "build-frozen");
const frozenAppDir = join(distFrozenDir, "lyric-video-subtitle-aligner");

await main();

async function main() {
  if (!(await pathExists(venvPython))) {
    throw new Error(
      `Virtual environment python.exe not found at "${venvPython}". ` +
        `Run "node scripts/install-subtitle-sidecar.mjs" first to bootstrap the venv.`
    );
  }

  if (!(await pathExists(specFile))) {
    throw new Error(`PyInstaller spec file not found at "${specFile}".`);
  }

  console.log("[freeze-subtitle-sidecar] Ensuring PyInstaller is installed in the sidecar venv...");
  await runCommand(venvPython, ["-m", "pip", "install", "--upgrade", "pyinstaller"]);

  console.log("[freeze-subtitle-sidecar] Cleaning previous frozen output...");
  await rm(distFrozenDir, { recursive: true, force: true });
  await rm(buildWorkDir, { recursive: true, force: true });

  console.log("[freeze-subtitle-sidecar] Running PyInstaller...");
  await runCommand(
    venvPython,
    [
      "-m",
      "PyInstaller",
      "--clean",
      "--noconfirm",
      "--distpath",
      distFrozenDir,
      "--workpath",
      buildWorkDir,
      specFile
    ],
    { cwd: sidecarDir }
  );

  if (!(await pathExists(frozenAppDir))) {
    throw new Error(
      `PyInstaller completed but no frozen output was found at "${frozenAppDir}". ` +
        "Check the build output above for errors."
    );
  }

  console.log(`[freeze-subtitle-sidecar] Frozen sidecar produced at ${frozenAppDir}`);
}

async function pathExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function runCommand(command, args, options = {}) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? rootDir,
      env: options.env ?? process.env,
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
