import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { packager } from "@electron/packager";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const stageDir = join(rootDir, ".publish", "stage");
const outDir = join(rootDir, "publish");

const workspacePackages = [
  {
    name: "@lyric-video-maker/core",
    sourceDir: join(rootDir, "packages", "core"),
    stageDir: join(stageDir, "packages", "core"),
    stageDependency: "file:packages/core"
  },
  {
    name: "@lyric-video-maker/renderer",
    sourceDir: join(rootDir, "packages", "renderer"),
    stageDir: join(stageDir, "packages", "renderer"),
    stageDependency: "file:packages/renderer"
  },
  {
    name: "@lyric-video-maker/scene-registry",
    sourceDir: join(rootDir, "packages", "scene-registry"),
    stageDir: join(stageDir, "packages", "scene-registry"),
    stageDependency: "file:packages/scene-registry"
  }
];

await main();

async function main() {
  const rootPackage = await readJson(join(rootDir, "package.json"));
  const desktopPackage = await readJson(join(rootDir, "apps", "desktop", "package.json"));
  const electronPackage = await readJson(join(rootDir, "node_modules", "electron", "package.json"));

  console.log("Building workspace artifacts...");
  await runCommand(getNpmCommand(), ["run", "build"], { cwd: rootDir });

  console.log("Preparing publish staging directory...");
  await rm(stageDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
  await rm(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
  await mkdir(stageDir, { recursive: true });

  await cp(join(rootDir, "apps", "desktop", "dist"), join(stageDir, "dist"), { recursive: true });
  await cp(join(rootDir, "apps", "desktop", "dist-electron"), join(stageDir, "dist-electron"), {
    recursive: true
  });
  await cp(join(rootDir, "sidecars"), join(stageDir, "sidecars"), { recursive: true });

  for (const pkg of workspacePackages) {
    await stageWorkspacePackage(pkg);
  }

  const stagePackage = {
    name: rootPackage.name,
    productName: "Lyric Video Maker",
    version: rootPackage.version,
    private: true,
    description: rootPackage.description ?? "Desktop lyric video renderer",
    author: rootPackage.author ?? "Lyric Video Maker",
    license: rootPackage.license ?? "UNLICENSED",
    main: "./dist-electron/main.js",
    dependencies: rewriteDesktopDependencies(desktopPackage.dependencies ?? {})
  };
  await writeJson(join(stageDir, "package.json"), stagePackage);

  console.log("Installing production dependencies into the staged app...");
  await runCommand(
    getNpmCommand(),
    ["install", "--omit=dev", "--no-audit", "--no-fund"],
    {
      cwd: stageDir,
      env: {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: "0"
      }
    }
  );
  await runCommand(process.execPath, [join("node_modules", "playwright", "cli.js"), "install", "chromium"], {
    cwd: stageDir,
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: "0"
    },
    shell: false
  });

  console.log("Packaging the Windows app folder...");
  const packagePaths = await packager({
    dir: stageDir,
    out: outDir,
    overwrite: true,
    platform: "win32",
    arch: "x64",
    asar: false,
    prune: false,
    appVersion: rootPackage.version,
    electronVersion: electronPackage.version,
    executableName: "LyricVideoMaker",
    name: "Lyric Video Maker"
  });

  console.log(`Publish complete: ${packagePaths[0]}`);
}

async function stageWorkspacePackage(pkg) {
  await mkdir(pkg.stageDir, { recursive: true });
  await cp(join(pkg.sourceDir, "dist"), join(pkg.stageDir, "dist"), { recursive: true });
  await cp(join(pkg.sourceDir, "package.json"), join(pkg.stageDir, "package.json"));
}

function rewriteDesktopDependencies(dependencies) {
  const localPackages = new Map(
    workspacePackages.map((pkg) => [pkg.name, pkg.stageDependency])
  );
  const rewritten = {};

  for (const [dependencyName, dependencyVersion] of Object.entries(dependencies)) {
    if (dependencyName === "electron") {
      continue;
    }

    rewritten[dependencyName] = localPackages.get(dependencyName) ?? dependencyVersion;
  }

  return rewritten;
}

function getNpmCommand() {
  return "npm";
}

async function runCommand(command, args, options) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: "inherit",
      shell: options.shell ?? process.platform === "win32"
    });

    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} ${args.join(" ")} exited with code ${code}.`));
    });
  });
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
