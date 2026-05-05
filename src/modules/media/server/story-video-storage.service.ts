import {
  downloadTempStoryVideoFromStorage,
  removeTempStoryVideoFromStorage,
  uploadProcessedStoryVideoToStorage,
  uploadTempStoryVideoToStorage,
} from "@/modules/media/repositories/story-video-storage-repository"
import {
  buildProcessedStoryVideoStoragePath,
  buildTempStoryVideoStoragePath,
} from "@/modules/media/services/story-video-storage-path-service"

export async function uploadTempStoryVideo(params: {
  creatorId: string
  file: File
}) {
  const storagePath = buildTempStoryVideoStoragePath({
    creatorId: params.creatorId,
    fileName: params.file.name,
    mimeType: params.file.type,
  })
  const fileBuffer = Buffer.from(await params.file.arrayBuffer())

  await uploadTempStoryVideoToStorage({
    storagePath,
    fileBuffer,
    contentType: params.file.type || "video/mp4",
  })

  return storagePath
}

export async function downloadTempStoryVideo(tempStoragePath: string) {
  return downloadTempStoryVideoFromStorage(tempStoragePath)
}

export async function uploadProcessedStoryVideo(params: {
  creatorId: string
  localFileBuffer: Buffer
  contentType?: string
}) {
  const storagePath = buildProcessedStoryVideoStoragePath({
    creatorId: params.creatorId,
  })

  await uploadProcessedStoryVideoToStorage({
    storagePath,
    localFileBuffer: params.localFileBuffer,
    contentType: params.contentType ?? "video/mp4",
  })

  return storagePath
}

export async function removeTempStoryVideo(tempStoragePath: string) {
  await removeTempStoryVideoFromStorage(tempStoragePath)
}
