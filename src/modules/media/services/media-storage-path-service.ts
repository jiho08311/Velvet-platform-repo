export type MediaStoragePurpose =
  | "post"
  | "message"
  | "story"
  | "feed-composer"

export type MediaStoragePathLineageStatus =
  | "explicit_in_path"
  | "runtime_only"

export type MediaStoragePathLineage = {
  uploaderUserId: string
  purpose: MediaStoragePurpose
  storagePath: string
  status: MediaStoragePathLineageStatus
}

function getFileExtension(fileName: string): string {
  const segments = fileName.split(".")
  return segments.length > 1 ? segments[segments.length - 1].toLowerCase() : ""
}

export function resolveMediaStoragePathLineageStatus(
  purpose: MediaStoragePurpose
): MediaStoragePathLineageStatus {
  if (purpose === "message" || purpose === "post") {
    return "explicit_in_path"
  }

  return "runtime_only"
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

export function buildMediaStoragePathLineage({
  uploaderUserId,
  file,
  purpose,
}: {
  uploaderUserId: string
  file: File
  purpose: MediaStoragePurpose
}): MediaStoragePathLineage {
  const storagePath = buildMediaStoragePath(uploaderUserId, file, purpose)

  return {
    uploaderUserId,
    purpose,
    storagePath,
    status: resolveMediaStoragePathLineageStatus(purpose),
  }
}