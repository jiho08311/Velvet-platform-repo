import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import type { VideoModerationMediaType } from "@/modules/moderation/contracts/video-moderation-job"

export type VideoModerationJobMedia = {
  id: string
  mediaId?: string | null
  type: VideoModerationMediaType
  storagePath: string
}

export type VideoModerationJob = {
  postId: string
  publishIntent: "published" | "scheduled"
  publishedAt?: string | null
  media: VideoModerationJobMedia[]
  correlation?: AuditCorrelationContext
}