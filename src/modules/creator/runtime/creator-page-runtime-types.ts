import type { CreatorIdentity } from "@/modules/creator/mappers/build-creator-identity"
import type { ReadyPostMediaRow } from "@/modules/media/public/ready-post-media-contract"
import type { FeedProjectionBlockReadModel } from "@/modules/post/public/list-feed-projection-blocks"

export type GetCreatorPageInput = {
  username: string
  viewerUserId?: string | null
}

export type CreatorPagePostRow = {
  id: string
  creator_id: string
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
  status: "published" | "scheduled"
  created_at: string
  published_at: string | null
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | null
  deleted_at: string | null
}

export type CreatorPageMediaRow = ReadyPostMediaRow
export type CreatorPageBlockRow = FeedProjectionBlockReadModel

export type CreatorPageIdentity = CreatorIdentity
