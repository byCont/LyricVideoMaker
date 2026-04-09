import { useEffect, useRef, useState } from "react";
import type { RenderPreviewResponse } from "./electron-api";
import type { ComposerState } from "./composer-types";

const PREVIEW_DEBOUNCE_MS = 250;

export interface FramePreviewState {
  result: RenderPreviewResponse | null;
  error: string;
  isLoading: boolean;
  requestedTimeMs: number;
}

const emptyPreviewState: FramePreviewState = {
  result: null,
  error: "",
  isLoading: false,
  requestedTimeMs: 0
};

export function useFramePreview({
  composer,
  paused
}: {
  composer: ComposerState;
  paused: boolean;
}) {
  const [preview, setPreview] = useState<FramePreviewState>(emptyPreviewState);
  const requestIdRef = useRef(0);
  const enabled = Boolean(composer.audioPath && composer.subtitlePath && composer.scene);

  useEffect(() => {
    return () => {
      void window.lyricVideoApp.disposePreview();
    };
  }, []);

  useEffect(() => {
    if (enabled && !paused) {
      return;
    }

    requestIdRef.current += 1;
    setPreview((current) =>
      enabled
        ? {
            ...current,
            isLoading: false
          }
        : emptyPreviewState
    );
    void window.lyricVideoApp.disposePreview();
  }, [enabled, paused]);

  useEffect(() => {
    const scene = composer.scene;

    if (!enabled || paused || !scene) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const safeTimeMs =
      preview.result?.durationMs !== undefined
        ? Math.min(preview.requestedTimeMs, preview.result.durationMs)
        : preview.requestedTimeMs;

    const timeout = window.setTimeout(() => {
      setPreview((current) => ({ ...current, isLoading: true }));
      void window.lyricVideoApp
        .renderPreviewFrame({
          audioPath: composer.audioPath,
          subtitlePath: composer.subtitlePath,
          scene,
          video: composer.video,
          timeMs: safeTimeMs
        })
        .then((result) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setPreview((current) => ({
            ...current,
            result,
            error: "",
            isLoading: false,
            requestedTimeMs: result.timeMs
          }));
        })
        .catch((previewError) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setPreview((current) => ({
            ...current,
            error: previewError instanceof Error ? previewError.message : String(previewError),
            isLoading: false
          }));
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    composer.audioPath,
    composer.scene,
    composer.subtitlePath,
    composer.video,
    enabled,
    paused,
    preview.requestedTimeMs,
    preview.result?.durationMs
  ]);

  function updatePreviewTime(nextTimeMs: number) {
    setPreview((current) => ({
      ...current,
      requestedTimeMs:
        current.result?.durationMs !== undefined
          ? clamp(nextTimeMs, 0, current.result.durationMs)
          : Math.max(0, nextTimeMs)
    }));
  }

  return {
    enabled,
    preview,
    updatePreviewTime
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
