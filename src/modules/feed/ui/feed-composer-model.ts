export type FeedComposerFileItem = {
  id: string
  file: File
  previewUrl: string
}

export type FeedComposerVisibility = "public" | "subscribers"

export function createFeedComposerFileItem(file: File): FeedComposerFileItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    previewUrl: URL.createObjectURL(file),
  }
}

export function isSupportedFeedComposerFile(file: File): boolean {
  return file.type.startsWith("image/") || file.type.startsWith("video/")
}
