import {
  createLyricRuntime,
  type RenderJob,
  type SceneComponentDefinition
} from "@lyric-video-maker/core";
import { throwIfAborted } from "../abort";
import { createAudioAnalysisAccessor } from "../audio-analysis";
import { createAssetAccessor, preloadSceneAssets } from "../assets/preload";
import { createRenderSession } from "../browser/render-session";
import { prepareGoogleFonts } from "../fonts/google-fonts";
import { createRenderLogger } from "../logging";
import { createPreviewProfiler, measurePreviewStage } from "../profiling";
import { prepareSceneComponents } from "../scene-prep/prepare-components";
import {
  NOOP_PROGRESS_EMITTER,
  type FramePreviewSession,
  type PreviewAssetCache,
  type PreviewComputationCache
} from "../types";
import {
  cleanupVideoFrameExtractions,
  prepareVideoFrameExtractions,
  type VideoFrameExtractionEntry
} from "../video-frame-extraction";

export interface CreateFramePreviewSessionInput {
  job: RenderJob;
  componentDefinitions: SceneComponentDefinition<Record<string, unknown>>[];
  pluginBundleSources?: string[];
  signal?: AbortSignal;
  assetCache?: PreviewAssetCache;
  previewCache?: PreviewComputationCache;
  fontCacheDir?: string;
}

export async function createFramePreviewSession({
  job,
  componentDefinitions,
  pluginBundleSources = [],
  signal,
  assetCache,
  previewCache,
  fontCacheDir
}: CreateFramePreviewSessionInput): Promise<FramePreviewSession> {
  const logger = createRenderLogger(job.id, NOOP_PROGRESS_EMITTER);
  const previewProfiler = createPreviewProfiler(job.id);
  const componentLookup = new Map(componentDefinitions.map((component) => [component.id, component]));
  const enabledComponents = job.components.filter((component) => component.enabled);
  const effectiveAssetCache = previewCache?.assetBodies ?? assetCache;
  const preloadedAssets = await measurePreviewStage(previewProfiler, "preloadSceneAssets", async () =>
    await preloadSceneAssets(
      enabledComponents,
      componentLookup,
      job.video,
      logger,
      signal,
      effectiveAssetCache
    )
  );
  const assets = createAssetAccessor(enabledComponents, preloadedAssets);
  const googleFonts = await prepareGoogleFonts({
    components: enabledComponents,
    componentLookup,
    fontCacheDir,
    logger
  });
  const audio = createAudioAnalysisAccessor({
    audioPath: job.audioPath,
    video: job.video,
    signal,
    logger,
    sharedCache: previewCache?.audioAnalysis
  });

  throwIfAborted(signal);

  const initialLyricsRuntime = createLyricRuntime(job.lyrics, 0);
  const prepared = await measurePreviewStage(previewProfiler, "prepareSceneComponents", async () =>
    await prepareSceneComponents(enabledComponents, componentLookup, {
      video: job.video,
      lyrics: initialLyricsRuntime,
      assets,
      audio,
      signal,
      logger,
      prepareCache: previewCache?.prepareResults
    })
  );
  let videoFrameExtractions: VideoFrameExtractionEntry[] = [];
  try {
    const extractionResult = await measurePreviewStage(previewProfiler, "prepareSceneComponents", async () =>
      await prepareVideoFrameExtractions({
        job,
        components: enabledComponents,
        assets,
        prepared,
        signal,
        logger
      })
    );
    videoFrameExtractions = extractionResult.entries;

    const session = await createRenderSession({
      sessionLabel: "preview",
      job,
      componentLookup,
      components: enabledComponents,
      assets,
      preloadedAssets,
      prepared,
      pluginBundleSources,
      signal,
      logger,
      previewProfiler,
      videoFrameExtractions,
      fontCss: googleFonts.css,
      fontCacheDir: googleFonts.cacheDir ?? undefined
    });

    return {
      renderFrame: session.renderFrame,
      async dispose() {
        await session.dispose();
        await cleanupVideoFrameExtractions(videoFrameExtractions);
      }
    };
  } catch (error) {
    await cleanupVideoFrameExtractions(videoFrameExtractions);
    throw error;
  }
}
