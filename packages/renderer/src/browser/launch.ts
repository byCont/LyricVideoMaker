import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface LaunchedChromium {
  process: ChildProcess;
  port: number;
  wsEndpoint: string;
  userDataDir: string;
  kill(): Promise<void>;
}

export interface LaunchChromiumOptions {
  executable: string;
  /** Extra command-line flags appended after the defaults. */
  extraArgs?: string[];
  /** How long to wait for the DevToolsActivePort file to appear. Default 10s. */
  startupTimeoutMs?: number;
}

const DEFAULT_FLAGS = [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--mute-audio",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-dev-shm-usage",
  "--disable-background-networking",
  "--disable-sync",
  "--disable-translate",
  "--disable-features=TranslateUI",
  "--disable-extensions",
  "--remote-debugging-port=0"
];

/**
 * Spawn Chromium with `--remote-debugging-port=0`, wait for the
 * `DevToolsActivePort` file inside the user-data-dir, and return the
 * negotiated port plus the browser-level WebSocket endpoint.
 *
 * Each call uses a fresh temp user-data-dir so concurrent renders never
 * collide.
 */
export async function launchChromium(options: LaunchChromiumOptions): Promise<LaunchedChromium> {
  const userDataDir = await mkdtemp(join(tmpdir(), "lvm-chromium-"));
  const args = [
    ...DEFAULT_FLAGS,
    `--user-data-dir=${userDataDir}`,
    ...(options.extraArgs ?? []),
    "about:blank"
  ];

  const child = spawn(options.executable, args, {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  const exitInfo: { code: number | null; signal: NodeJS.Signals | null; stderr: string } = {
    code: null,
    signal: null,
    stderr: ""
  };

  child.stderr?.on("data", (chunk: Buffer) => {
    // Cap stderr capture so a chatty browser does not balloon memory.
    if (exitInfo.stderr.length < 8192) {
      exitInfo.stderr += chunk.toString("utf8");
    }
  });

  const exitPromise = new Promise<void>((resolveExit) => {
    child.once("exit", (code, signal) => {
      exitInfo.code = code;
      exitInfo.signal = signal;
      resolveExit();
    });
  });

  try {
    const { port, wsEndpoint } = await waitForDevToolsActivePort({
      userDataDir,
      child,
      startupTimeoutMs: options.startupTimeoutMs ?? 10_000,
      onExit: exitInfo
    });

    return {
      process: child,
      port,
      wsEndpoint,
      userDataDir,
      kill: () => terminate(child, exitPromise, userDataDir)
    };
  } catch (error) {
    await terminate(child, exitPromise, userDataDir);
    throw error;
  }
}

async function waitForDevToolsActivePort({
  userDataDir,
  child,
  startupTimeoutMs,
  onExit
}: {
  userDataDir: string;
  child: ChildProcess;
  startupTimeoutMs: number;
  onExit: { code: number | null; signal: NodeJS.Signals | null; stderr: string };
}): Promise<{ port: number; wsEndpoint: string }> {
  const portFile = join(userDataDir, "DevToolsActivePort");
  const deadline = Date.now() + startupTimeoutMs;

  while (Date.now() < deadline) {
    if (onExit.code !== null || onExit.signal !== null) {
      throw new Error(
        `Chromium exited before DevToolsActivePort appeared (code=${onExit.code}, signal=${onExit.signal}). stderr: ${onExit.stderr.slice(0, 1024)}`
      );
    }
    if (!child.pid) {
      throw new Error("Chromium failed to spawn (no pid).");
    }

    try {
      const contents = await readFile(portFile, "utf8");
      const [portLine, pathLine] = contents.split("\n");
      const port = Number.parseInt(portLine ?? "", 10);
      const wsPath = (pathLine ?? "").trim();
      if (Number.isInteger(port) && port > 0 && wsPath) {
        return {
          port,
          wsEndpoint: `ws://127.0.0.1:${port}${wsPath}`
        };
      }
    } catch {
      // File not yet written — keep polling.
    }

    await sleep(50);
  }

  throw new Error(
    `Timed out after ${startupTimeoutMs}ms waiting for Chromium DevToolsActivePort. stderr: ${onExit.stderr.slice(0, 1024)}`
  );
}

async function terminate(child: ChildProcess, exitPromise: Promise<void>, userDataDir: string) {
  if (child.exitCode === null && child.signalCode === null) {
    try {
      child.kill("SIGTERM");
    } catch {
      // Ignore — child may already be gone.
    }
  }

  const killTimeout = setTimeout(() => {
    try {
      child.kill("SIGKILL");
    } catch {
      // Ignore.
    }
  }, 2_000);

  try {
    await exitPromise;
  } finally {
    clearTimeout(killTimeout);
  }

  await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
