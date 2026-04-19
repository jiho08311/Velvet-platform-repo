export type VideoModerationMediaType = "image" | "video" | "audio" | "file"

export type VideoModerationJobMedia = {
  id: string
  type: VideoModerationMediaType
  storagePath: string
}

export type VideoModerationPublishIntent = "published" | "scheduled"

export type VideoModerationJob = {
  postId: string
  publishIntent: VideoModerationPublishIntent
  publishedAt?: string | null
  media: VideoModerationJobMedia[]
}