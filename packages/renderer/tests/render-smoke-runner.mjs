import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRenderJob, parseSrt } from "../../core/dist/index.js";
import { builtInSceneComponents, singleImageLyricsScene } from "../../scene-registry/dist/index.js";
import { probeAudioDurationMs, renderLyricVideo } from "../dist/index.js";

const workspace = await mkdtemp(join(tmpdir(), "lyric-video-smoke-"));
const audioPath = join(workspace, "tone.mp3");
const subtitlePath = join(workspace, "lyrics.srt");
const imagePath = join(workspace, "background.png");
const outputPath = join(workspace, "output.mp4");

try {
  await runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=2.4",
    "-q:a",
    "2",
    audioPath
  ]);
  await runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=#202030:s=1920x1080:d=1",
    "-frames:v",
    "1",
    imagePath
  ]);
  await writeFile(
    subtitlePath,
    `1
00:00:00,000 --> 00:00:01,000
Hello

2
00:00:01,100 --> 00:00:02,300
World`,
    "utf8"
  );

  const durationMs = await probeAudioDurationMs(audioPath);
  const job = createRenderJob({
    audioPath,
    subtitlePath,
    outputPath,
    componentDefinitions: builtInSceneComponents,
    cues: parseSrt(await readFile(subtitlePath, "utf8")),
    durationMs,
    validationContext: {
      isFileAccessible: () => true
    },
    scene: {
      ...singleImageLyricsScene,
      components: [
        {
          id: "background-image-1",
          componentId: "background-image",
          enabled: true,
          options: {
            imagePath
          }
        },
        {
          id: "background-color-1",
          componentId: "background-color",
          enabled: false,
          options: {}
        },
        {
          id: "lyrics-by-line-1",
          componentId: "lyrics-by-line",
          enabled: true,
          options: {
            lyricSize: 72,
            lyricFont: "Montserrat",
            lyricColor: "#ffffff"
          }
        }
      ]
    }
  });

  await renderLyricVideo({
    job,
    componentDefinitions: builtInSceneComponents
  });

  await access(outputPath);
  const outputDurationMs = await probeAudioDurationMs(outputPath);
  if (Math.abs(outputDurationMs - durationMs) > 250) {
    throw new Error(
      `Output duration ${outputDurationMs}ms differed from source duration ${durationMs}ms by more than 250ms.`
    );
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}

async function runFfmpeg(args) {
  await new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    const stderr = [];
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(Buffer.concat(stderr).toString("utf8")));
    });
  });
}
