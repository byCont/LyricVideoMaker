import type {
  RenderJob,
  SceneAssetAccessor,
  SceneComponentDefinition,
  ValidatedSceneComponentInstance
} from "@lyric-video-maker/core";
import { isPluginAssetUri } from "@lyric-video-maker/core";
import { ASSET_URL_PREFIX } from "../constants";
import type { PreloadedAsset, PreviewAssetCache, RenderLogger } from "../types";
import { loadCachedAssetBody } from "./cache-body";
import { getExtensionSuffix } from "./mime";

export async function preloadSceneAssets(
  components: ValidatedSceneComponentInstance[],
  componentLookup: Map<string, SceneComponentDefinition<Record<string, unknown>>>,
  video: RenderJob["video"],
  logger: RenderLogger,
  signal?: AbortSignal,
  assetCache?: PreviewAssetCache,
  options: { includeVideoAssets?: boolean } = {},
  resolvePluginAsset?: (uri: string) => string | null
): Promise<Map<string, PreloadedAsset>> {
  const assets = new Map<string, PreloadedAsset>();

  for (const instance of components) {
    const definition = componentLookup.get(instance.componentId);
    if (!definition) {
      throw new Error(`Scene component definition "${instance.componentId}" is not registered.`);
    }

    // Iterate every option entry — including fields nested inside category
    // entries — and preload image assets. Video fields are skipped by default
    // because built-in video rendering reads source paths for frame extraction.
    const flatFields = definition.options.flatMap((entry) =>
      entry.type === "category" ? entry.options : [entry]
    );

    for (const field of flatFields) {
      if (field.type === "image-list") {
        const pathArray = instance.options[field.id];
        if (!Array.isArray(pathArray)) {
          continue;
        }
        for (let i = 0; i < pathArray.length; i++) {
          const itemPath = pathArray[i];
          if (typeof itemPath !== "string" || !itemPath) {
            continue;
          }

          let loadPath = itemPath;
          if (isPluginAssetUri(itemPath)) {
            if (!resolvePluginAsset) {
              logger.warn(
                `Skipping plugin asset "${itemPath}" for "${instance.id}/${field.id}[${i}]": no resolver available.`
              );
              continue;
            }
            const resolved = resolvePluginAsset(itemPath);
            if (!resolved) {
              logger.warn(
                `Skipping plugin asset "${itemPath}" for "${instance.id}/${field.id}[${i}]": could not resolve.`
              );
              continue;
            }
            loadPath = resolved;
          }

          const syntheticOptionId = `${field.id}[${i}]`;
          const cachedBody = await loadCachedAssetBody(
            loadPath,
            video,
            signal,
            logger,
            assetCache,
            "image"
          );
          const asset = {
            instanceId: instance.id,
            optionId: syntheticOptionId,
            path: itemPath,
            url: `${ASSET_URL_PREFIX}${encodeURIComponent(instance.id)}-${encodeURIComponent(syntheticOptionId)}${getExtensionSuffix(loadPath)}`,
            contentType: cachedBody.contentType,
            body: cachedBody.body
          } satisfies PreloadedAsset;

          assets.set(getAssetKey(instance.id, syntheticOptionId), asset);
          logger.info(
            `Preloaded image-list asset "${instance.id}/${syntheticOptionId}" from ${itemPath}`
          );
        }
        continue;
      }

      if (field.type !== "image" && (field.type !== "video" || !options.includeVideoAssets)) {
        continue;
      }

      const optionValue = instance.options[field.id];
      if (typeof optionValue !== "string" || !optionValue) {
        continue;
      }

      let loadPath = optionValue;
      if (isPluginAssetUri(optionValue)) {
        if (!resolvePluginAsset) {
          logger.warn(
            `Skipping plugin asset "${optionValue}" for "${instance.id}/${field.id}": no resolver available.`
          );
          continue;
        }
        const resolved = resolvePluginAsset(optionValue);
        if (!resolved) {
          logger.warn(
            `Skipping plugin asset "${optionValue}" for "${instance.id}/${field.id}": could not resolve.`
          );
          continue;
        }
        loadPath = resolved;
      }

      const cachedBody = await loadCachedAssetBody(
        loadPath,
        video,
        signal,
        logger,
        assetCache,
        field.type
      );
      const asset = {
        instanceId: instance.id,
        optionId: field.id,
        path: optionValue,
        url: `${ASSET_URL_PREFIX}${encodeURIComponent(instance.id)}-${encodeURIComponent(field.id)}${getExtensionSuffix(loadPath)}`,
        contentType: cachedBody.contentType,
        body: cachedBody.body
      } satisfies PreloadedAsset;

      assets.set(getAssetKey(instance.id, field.id), asset);
      logger.info(
        `Preloaded ${field.type} asset "${instance.id}/${field.id}" from ${optionValue}`
      );
    }
  }

  return assets;
}

export function createAssetAccessor(
  components: ValidatedSceneComponentInstance[],
  preloadedAssets: Map<string, PreloadedAsset>
): SceneAssetAccessor {
  const componentLookup = new Map(components.map((component) => [component.id, component]));

  return {
    getPath(instanceId, optionId) {
      const instance = componentLookup.get(instanceId);
      if (!instance) {
        return null;
      }

      const value = instance.options[optionId];
      return typeof value === "string" ? value : null;
    },
    getUrl(instanceId, optionId) {
      return preloadedAssets.get(getAssetKey(instanceId, optionId))?.url ?? null;
    }
  };
}

export function getAssetKey(instanceId: string, optionId: string) {
  return `${instanceId}:${optionId}`;
}
