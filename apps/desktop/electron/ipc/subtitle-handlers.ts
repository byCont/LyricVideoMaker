import { ipcMain } from "electron";
import type { StartSubtitleGenerationRequest } from "../../src/electron-api";
import { createGeneratedSubtitlePath } from "../services/subtitle-generator";
import type { IpcDeps } from "./register-ipc-handlers";

export function registerSubtitleHandlers({
  getMainWindow,
  subtitleGenerationRunner
}: IpcDeps) {
  ipcMain.handle(
    "subtitle:start-generation",
    async (_event, request: StartSubtitleGenerationRequest) => {
      const outputPath =
        request.outputPath ||
        (await createGeneratedSubtitlePath({
          audioPath: request.audioPath,
          mode: request.mode
        }));

      return await subtitleGenerationRunner.run(
        {
          ...request,
          outputPath
        },
        (event) => {
          getMainWindow()?.webContents.send("subtitle:progress", {
            ...event,
            outputPath: event.outputPath ?? outputPath
          });
        }
      );
    }
  );

  ipcMain.handle("subtitle:cancel-generation", async () => {
    subtitleGenerationRunner.cancel();
  });

  ipcMain.handle("subtitle:parse-file", async (_event, filePath: string) => {
    const { readFile } = await import("node:fs/promises");
    const { parseLrc, parseSrt } = await import("@lyric-video-maker/core");
    const content = await readFile(filePath, "utf8");
    const isLrc = filePath.toLowerCase().endsWith(".lrc");
    return isLrc ? parseLrc(content) : parseSrt(content);
  });

  ipcMain.handle("subtitle:save-file", async (_event, filePath: string, cues: import("@lyric-video-maker/core").LyricCue[]) => {
    const { writeFile } = await import("node:fs/promises");
    const { serializeLrc, serializeSrt } = await import("@lyric-video-maker/core");
    const isLrc = filePath.toLowerCase().endsWith(".lrc");
    const content = isLrc ? serializeLrc(cues) : serializeSrt(cues);
    await writeFile(filePath, content, "utf8");
  });
}
