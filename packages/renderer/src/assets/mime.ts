const MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska"
};

export function getMimeType(path: string): string {
  const lowerPath = path.toLowerCase();
  for (const ext of Object.keys(MIME_BY_EXTENSION)) {
    if (lowerPath.endsWith(ext)) {
      return MIME_BY_EXTENSION[ext];
    }
  }

  return "image/jpeg";
}

export function getExtensionSuffix(path: string): string {
  const match = /\.[^./\\]+$/.exec(path);
  return match ? match[0] : "";
}
