import { ipcMain } from "electron";
import { promptFfmpegSetup } from "../services/ffmpeg-install-prompt";
import type { IpcDeps } from "./register-ipc-handlers";

export function registerAppSettingsHandlers({
  layoutPreferencesStore,
  ffmpegAvailability
}: IpcDeps) {
  ipcMain.handle("app:setup-ffmpeg", async () => {
    const result = await promptFfmpegSetup({
      initialReason: ffmpegAvailability.isAvailable()
        ? undefined
        : "FFmpeg is not currently configured."
    });

    if (result.kind === "found") {
      process.env.LYRIC_VIDEO_FFMPEG_PATH = result.ffmpegPath;
      process.env.LYRIC_VIDEO_FFPROBE_PATH = result.ffprobePath;
      await layoutPreferencesStore.updateFfmpeg({
        ffmpegPath: result.ffmpegPath,
        ffprobePath: result.ffprobePath
      });
      ffmpegAvailability.setAvailable(true);
      return { available: true };
    }

    return { available: ffmpegAvailability.isAvailable() };
  });
}
