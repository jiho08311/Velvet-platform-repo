export type MediaType = "image" | "video" | "audio" | "file"

export type MediaStatus = "processing" | "ready" | "failed"

export type Media = {
  id: string
  postId: string
  type: MediaType
  storagePath: string
  mimeType: string | null
  sortOrder: number
  status: MediaStatus
  createdAt: string
}