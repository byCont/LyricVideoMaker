import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
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
  const deferredComposer = useDeferredValue(composer);
  const deferredRequestedTimeMs = useDeferredValue(preview.requestedTimeMs);

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
    const scene = deferredComposer.scene;

    if (!enabled || paused || !scene) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const safeTimeMs =
      preview.result?.durationMs !== undefined
        ? Math.min(deferredRequestedTimeMs, preview.result.durationMs)
        : deferredRequestedTimeMs;

    const timeout = window.setTimeout(() => {
      startTransition(() => {
        setPreview((current) => ({ ...current, isLoading: true }));
      });
      void window.lyricVideoApp
        .renderPreviewFrame({
          audioPath: deferredComposer.audioPath,
          subtitlePath: deferredComposer.subtitlePath,
          scene,
          video: deferredComposer.video,
          timeMs: safeTimeMs
        })
        .then((result) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          startTransition(() => {
            setPreview((current) => ({
              ...current,
              result,
              error: "",
              isLoading: false,
              requestedTimeMs: result.timeMs
            }));
          });
        })
        .catch((previewError) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          startTransition(() => {
            setPreview((current) => ({
              ...current,
              error: previewError instanceof Error ? previewError.message : String(previewError),
              isLoading: false
            }));
          });
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    deferredComposer.audioPath,
    deferredComposer.scene,
    deferredComposer.subtitlePath,
    deferredComposer.video,
    deferredRequestedTimeMs,
    enabled,
    paused,
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
