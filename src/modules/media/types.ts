export type MediaId = string

export type Media = {
  id: MediaId
  postId: string
  storagePath: string
  type: "image" | "video" | "audio" | "file"
  status: "processing" | "ready" | "failed"
  createdAt: string
}