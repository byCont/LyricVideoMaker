import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  encodeGoogleFontFamilyForCss2,
  getSceneOptionFields,
  validateGoogleFontFamilyName,
  type SceneComponentDefinition,
  type ValidatedSceneComponentInstance
} from "@lyric-video-maker/core";
import { FONT_URL_PREFIX } from "../constants";
import type { RenderLogger } from "../types";

const GOOGLE_FONTS_CSS2_URL = "https://fonts.googleapis.com/css2";
const GOOGLE_FONT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const FONT_URL_PATTERN = /url\((["']?)(https:\/\/fonts\.gstatic\.com\/[^"')]+\.woff2[^"')]*)\1\)/g;
const LOCAL_FONT_URL_PATTERN = /url\((["']?)http:\/\/lyric-video\.local\/fonts\/([a-f0-9]{32}\.woff2)\1\)/g;

export interface PreparedGoogleFonts {
  css: string;
  cacheDir: string | null;
}

export interface PrepareGoogleFontsInput {
  components: ValidatedSceneComponentInstance[];
  componentLookup: Map<string, SceneComponentDefinition<Record<string, unknown>>>;
  fontCacheDir?: string;
  logger: RenderLogger;
  fetchImpl?: typeof fetch;
}

export async function prepareGoogleFonts({
  components,
  componentLookup,
  fontCacheDir,
  logger,
  fetchImpl = fetch
}: PrepareGoogleFontsInput): Promise<PreparedGoogleFonts> {
  const requests = collectGoogleFontRequests(components, componentLookup);
  if (requests.length === 0) {
    return { css: "", cacheDir: fontCacheDir ?? null };
  }
  if (!fontCacheDir) {
    throw new Error("Google Font cache directory was not configured.");
  }

  await mkdir(join(fontCacheDir, "css"), { recursive: true });
  await mkdir(join(fontCacheDir, "files"), { recursive: true });

  const cssParts = await Promise.all(
    requests.map((request) =>
      loadGoogleFontCss({
        request,
        fontCacheDir,
        fetchImpl,
        logger
      })
    )
  );

  return {
    css: cssParts.filter(Boolean).join("\n"),
    cacheDir: fontCacheDir
  };
}

export function collectGoogleFontRequests(
  components: ValidatedSceneComponentInstance[],
  componentLookup: Map<string, SceneComponentDefinition<Record<string, unknown>>>
): Array<{ family: string; weights: number[] }> {
  const fonts = new Map<string, Set<number>>();

  for (const instance of components) {
    const definition = componentLookup.get(instance.componentId);
    if (!definition) {
      continue;
    }

    for (const field of getSceneOptionFields(definition.options)) {
      if (field.type !== "font") {
        continue;
      }

      const family = validateGoogleFontFamilyName(
        instance.options[field.id] ?? field.defaultValue ?? ""
      );
      const weights = fonts.get(family) ?? new Set<number>([400]);
      for (const weight of getRequestedWeights(field.id, instance.options)) {
        weights.add(weight);
      }
      fonts.set(family, weights);
    }
  }

  return [...fonts.entries()]
    .map(([family, weights]) => ({
      family,
      weights: [...weights].sort((left, right) => left - right)
    }))
    .sort((left, right) => left.family.localeCompare(right.family));
}

export function buildGoogleFontsCss2Url(request: { family: string; weights: number[] }) {
  const encodedFamily = encodeGoogleFontFamilyForCss2(request.family);
  const weights = request.weights.filter(isGoogleFontWeight).sort((left, right) => left - right);
  const familySpec = weights.length > 0
    ? `${encodedFamily}:wght@${weights.join(";")}`
    : encodedFamily;
  return `${GOOGLE_FONTS_CSS2_URL}?family=${familySpec}&display=swap`;
}

export async function rewriteGoogleFontCssUrls({
  css,
  family,
  fontCacheDir,
  fetchImpl
}: {
  css: string;
  family: string;
  fontCacheDir: string;
  fetchImpl: typeof fetch;
}) {
  const matches = [...css.matchAll(FONT_URL_PATTERN)];
  if (matches.length === 0) {
    throw new Error(`Unable to load Google Font "${family}": Google Fonts returned no woff2 files.`);
  }

  const replacements = new Map<string, string>();
  for (const match of matches) {
    const sourceUrl = match[2];
    if (replacements.has(sourceUrl)) {
      continue;
    }

    const fileName = `${hashValue(sourceUrl)}.woff2`;
    const filePath = join(fontCacheDir, "files", fileName);
    await ensureFontFile({
      family,
      sourceUrl,
      filePath,
      fetchImpl
    });
    replacements.set(sourceUrl, `${FONT_URL_PREFIX}${fileName}`);
  }

  return css.replace(FONT_URL_PATTERN, (_full, _quote, sourceUrl: string) => {
    return `url("${replacements.get(sourceUrl) ?? sourceUrl}")`;
  });
}

async function loadGoogleFontCss({
  request,
  fontCacheDir,
  fetchImpl,
  logger
}: {
  request: { family: string; weights: number[] };
  fontCacheDir: string;
  fetchImpl: typeof fetch;
  logger: RenderLogger;
}) {
  const cacheKey = hashValue(`${request.family}:${request.weights.join(",")}`);
  const cssPath = join(fontCacheDir, "css", `${cacheKey}.css`);
  const cached = await readUtf8IfExists(cssPath);
  if (cached && await cachedFontFilesExist(cached, fontCacheDir)) {
    return cached;
  }

  const sourceUrl = buildGoogleFontsCss2Url(request);
  const response = await fetchImpl(sourceUrl, {
    headers: {
      "User-Agent": GOOGLE_FONT_USER_AGENT
    }
  });
  if (!response.ok) {
    throw new Error(
      `Unable to load Google Font "${request.family}": Google Fonts CSS request failed with ${response.status}.`
    );
  }

  const sourceCss = await response.text();
  if (!sourceCss.includes("@font-face")) {
    throw new Error(`Unable to load Google Font "${request.family}": Google Fonts returned no @font-face rules.`);
  }

  const rewrittenCss = await rewriteGoogleFontCssUrls({
    css: sourceCss,
    family: request.family,
    fontCacheDir,
    fetchImpl
  });
  await mkdir(dirname(cssPath), { recursive: true });
  await writeFile(cssPath, rewrittenCss, "utf8");
  logger.info(`Cached Google Font "${request.family}" (${request.weights.join(", ")}).`);
  return rewrittenCss;
}

async function ensureFontFile({
  family,
  sourceUrl,
  filePath,
  fetchImpl
}: {
  family: string;
  sourceUrl: string;
  filePath: string;
  fetchImpl: typeof fetch;
}) {
  const cached = await readBufferIfExists(filePath);
  if (cached) {
    return;
  }

  const response = await fetchImpl(sourceUrl, {
    headers: {
      "User-Agent": GOOGLE_FONT_USER_AGENT
    }
  });
  if (!response.ok) {
    throw new Error(
      `Unable to load Google Font "${family}": font file download failed with ${response.status}.`
    );
  }
  const body = Buffer.from(await response.arrayBuffer());
  if (body.byteLength === 0) {
    throw new Error(`Unable to load Google Font "${family}": font file download was empty.`);
  }
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
}

async function cachedFontFilesExist(css: string, fontCacheDir: string) {
  const matches = [...css.matchAll(LOCAL_FONT_URL_PATTERN)];
  if (matches.length === 0) {
    return false;
  }
  for (const match of matches) {
    if (!await readBufferIfExists(join(fontCacheDir, "files", match[2]))) {
      return false;
    }
  }
  return true;
}

function getRequestedWeights(fieldId: string, options: Record<string, unknown>) {
  const weights = new Set<number>([400]);
  if (fieldId.toLowerCase().includes("lyric")) {
    weights.add(700);
  }
  const fontWeight = Number(options.fontWeight);
  if (isGoogleFontWeight(fontWeight)) {
    weights.add(fontWeight);
  }
  return weights;
}

function isGoogleFontWeight(value: number) {
  return Number.isInteger(value) && value >= 100 && value <= 900 && value % 100 === 0;
}

async function readUtf8IfExists(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

async function readBufferIfExists(path: string) {
  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}
