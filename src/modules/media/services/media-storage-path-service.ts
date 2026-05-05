export type MediaStoragePurpose =
  | "post"
  | "message"
  | "story"
  | "feed-composer"

function getFileExtension(fileName: string): string {
  const segments = fileName.split(".")
  return segments.length > 1 ? segments[segments.length - 1].toLowerCase() : ""
}

export function buildMediaStoragePath(
  uploaderUserId: string,
  file: File,
  purpose: MediaStoragePurpose
): string {
  const now = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  const extension = getFileExtension(file.name)
  const safeExtension = extension ? `.${extension}` : ""

  if (purpose === "message") {
    return `user/${uploaderUserId}/messages/${now}-${random}${safeExtension}`
  }

  if (purpose === "story") {
    return `story/${now}-${random}${safeExtension}`
  }

  if (purpose === "feed-composer") {
    return `creator/${now}-${random}${safeExtension}`
  }

  return `creator/${uploaderUserId}/posts/${now}-${random}${safeExtension}`
}
