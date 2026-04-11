import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dialog, shell } from "electron";
import { deriveFfprobePath, discoverFfmpeg, type FfmpegDiscoveryResult } from "./ffmpeg-discovery";

const execFileAsync = promisify(execFile);

const WINGET_TIMEOUT_MS = 10 * 60 * 1000;
const FFMPEG_DOWNLOAD_URL = "https://ffmpeg.org/download.html";

const BUTTON_INSTALL_WINGET = 0;
const BUTTON_LOCATE = 1;
const BUTTON_DOWNLOAD = 2;
const BUTTON_SKIP = 3;

export interface PromptFfmpegSetupOptions {
  initialReason?: string;
}

export async function promptFfmpegSetup(
  options: PromptFfmpegSetupOptions = {}
): Promise<FfmpegDiscoveryResult> {
  let lastReason = options.initialReason;

  for (;;) {
    const choice = await dialog.showMessageBox({
      type: "warning",
      title: "FFmpeg required",
      message: "Lyric Video Maker requires FFmpeg to render and preview videos.",
      detail: buildDetailMessage(lastReason),
      buttons: ["Install via winget", "Locate ffmpeg.exe…", "Open download page", "Continue without FFmpeg"],
      defaultId: BUTTON_INSTALL_WINGET,
      cancelId: BUTTON_SKIP,
      noLink: true
    });

    switch (choice.response) {
      case BUTTON_INSTALL_WINGET: {
        const installResult = await installViaWinget();
        if (installResult.kind === "found") {
          return installResult;
        }
        lastReason = installResult.reason;
        break;
      }

      case BUTTON_LOCATE: {
        const locateResult = await locateManually();
        if (locateResult.kind === "found") {
          return locateResult;
        }
        if (locateResult.kind === "missing" && locateResult.reason !== "cancelled") {
          lastReason = locateResult.reason;
        }
        break;
      }

      case BUTTON_DOWNLOAD: {
        await shell.openExternal(FFMPEG_DOWNLOAD_URL);
        lastReason = "After installing FFmpeg, click Locate ffmpeg.exe… or restart the app.";
        break;
      }

      case BUTTON_SKIP:
      default:
        return {
          kind: "missing",
          reason: lastReason ?? "User skipped FFmpeg setup."
        };
    }
  }
}

function buildDetailMessage(reason: string | undefined): string {
  const lines = [
    "FFmpeg is a separate program that Lyric Video Maker uses for audio decoding, video frame extraction, and final encoding.",
    "",
    "Choose how to set it up:",
    "  • Install via winget — Windows Package Manager installs Gyan.FFmpeg automatically.",
    "  • Locate ffmpeg.exe… — Browse for an existing ffmpeg.exe on disk.",
    "  • Open download page — Visit ffmpeg.org for manual download instructions.",
    "  • Continue without FFmpeg — The app loads, but rendering and preview will be disabled."
  ];
  if (reason) {
    lines.push("", `Last attempt: ${reason}`);
  }
  return lines.join("\n");
}

async function installViaWinget(): Promise<FfmpegDiscoveryResult> {
  if (process.platform !== "win32") {
    return {
      kind: "missing",
      reason: "winget is only available on Windows."
    };
  }

  try {
    await execFileAsync(
      "winget",
      [
        "install",
        "--id=Gyan.FFmpeg",
        "--accept-package-agreements",
        "--accept-source-agreements",
        "--silent"
      ],
      { timeout: WINGET_TIMEOUT_MS, windowsHide: true }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      kind: "missing",
      reason: `winget install failed: ${message}`
    };
  }

  // winget installs ffmpeg.exe under %LOCALAPPDATA%\Microsoft\WinGet\Links\
  const result = await discoverFfmpeg();
  if (result.kind === "found") {
    return result;
  }
  return {
    kind: "missing",
    reason: "winget reported success but FFmpeg still not detected. Try restarting the app."
  };
}

async function locateManually(): Promise<FfmpegDiscoveryResult> {
  const filters =
    process.platform === "win32"
      ? [{ name: "FFmpeg executable", extensions: ["exe"] }]
      : [{ name: "FFmpeg executable", extensions: ["*"] }];

  const result = await dialog.showOpenDialog({
    title: "Locate ffmpeg",
    properties: ["openFile"],
    filters
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { kind: "missing", reason: "cancelled" };
  }

  const ffmpegPath = result.filePaths[0];
  const ffprobePath = deriveFfprobePath(ffmpegPath);

  return await discoverFfmpeg({
    knownFfmpegPath: ffmpegPath,
    knownFfprobePath: ffprobePath
  });
}
