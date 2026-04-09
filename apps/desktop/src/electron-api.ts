import type {
  RenderHistoryEntry,
  RenderProgressEvent,
  SerializedSceneComponentDefinition,
  SerializedSceneDefinition,
  VideoSettings
} from "@lyric-video-maker/core";

export interface AppBootstrapData {
  scenes: SerializedSceneDefinition[];
  components: SerializedSceneComponentDefinition[];
  fonts: string[];
  history: RenderHistoryEntry[];
}

export type FilePickKind = "audio" | "subtitle" | "image" | "output";

export interface StartRenderRequest {
  audioPath: string;
  subtitlePath: string;
  outputPath: string;
  scene: SerializedSceneDefinition;
  video?: Partial<Pick<VideoSettings, "width" | "height" | "fps">>;
}

export interface ElectronApi {
  getBootstrapData(): Promise<AppBootstrapData>;
  pickPath(kind: FilePickKind, suggestedName?: string): Promise<string | null>;
  startRender(request: StartRenderRequest): Promise<RenderHistoryEntry>;
  saveScene(scene: SerializedSceneDefinition): Promise<SerializedSceneDefinition>;
  deleteScene(sceneId: string): Promise<void>;
  importScene(): Promise<SerializedSceneDefinition | null>;
  exportScene(scene: SerializedSceneDefinition): Promise<string | null>;
  cancelRender(jobId: string): Promise<void>;
  onRenderProgress(callback: (event: RenderProgressEvent) => void): () => void;
}

declare global {
  interface Window {
    lyricVideoApp: ElectronApi;
  }
}
