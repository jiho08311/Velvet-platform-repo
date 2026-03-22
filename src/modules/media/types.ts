export type MediaId = string

export type Media = {
  id: MediaId
  creatorId: string
  fileUrl: string
  thumbnailUrl: string | null
  mediaType: "image" | "video"
  createdAt: string
}