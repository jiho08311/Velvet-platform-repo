export function buildTempStoryVideoStoragePath(params: {
  creatorId: string
  fileName: string
  mimeType: string
}) {
  const ext = getStoryVideoFileExtension(params.fileName, params.mimeType)

  return `${params.creatorId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
}

export function buildProcessedStoryVideoStoragePath(params: {
  creatorId: string
}) {
  return `${params.creatorId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.mp4`
}

function getStoryVideoFileExtension(fileName: string, mimeType: string) {
  const byName = fileName.split(".").pop()?.toLowerCase()

  if (byName && byName.length <= 5) {
    return byName
  }

  if (mimeType.includes("quicktime")) {
    return "mov"
  }

  return "mp4"
}
