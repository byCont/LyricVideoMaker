import type {
  RenderHistoryEntry,
  RenderProgressEvent,
  SerializedSceneDefinition
} from "@lyric-video-maker/core";

export interface AppBootstrapData {
  scenes: SerializedSceneDefinition[];
  fonts: string[];
  history: RenderHistoryEntry[];
}

export type FilePickKind = "audio" | "subtitle" | "image" | "output";

export interface StartRenderRequest {
  audioPath: string;
  subtitlePath: string;
  outputPath: string;
  sceneId: string;
  options: Record<string, unknown>;
}

export interface ElectronApi {
  getBootstrapData(): Promise<AppBootstrapData>;
  pickPath(kind: FilePickKind, suggestedName?: string): Promise<string | null>;
  startRender(request: StartRenderRequest): Promise<RenderHistoryEntry>;
  cancelRender(jobId: string): Promise<void>;
  onRenderProgress(callback: (event: RenderProgressEvent) => void): () => void;
}

declare global {
  interface Window {
    lyricVideoApp: ElectronApi;
  }
}
