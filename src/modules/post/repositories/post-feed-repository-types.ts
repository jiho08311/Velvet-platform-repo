import type { PostBlockEditorState } from "@/modules/post/types"

export type FeedCreatorRow = {
  id: string
  user_id: string
  status: "active" | "pending" | "suspended" | "inactive"
  creatorVisibilityState?: string | null
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
    profileLifecycleState?: string | null
    identityVisibilityState?: string | null
  } | null
}

export type CreatorFeedPostRow = {
  id: string
  creator_id: string
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
  status: string
  created_at: string
  published_at?: string | null
  visibility_status?: string | null
  moderation_status?: string | null
  deleted_at?: string | null
  feed_visibility_state?: string | null
  is_feed_visible?: boolean | null
}

export type SubscribedFeedPostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  published_at: string | null
  created_at: string
  updated_at: string
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  deleted_at: string | null
  feed_visibility_state?: string | null
  is_feed_visible?: boolean | null
}

export type FeedMediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file" | null
  mime_type: string | null
  status: "processing" | "ready" | "failed"
  sort_order: number
}

export type FeedPostBlockRow = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: PostBlockEditorState | null
}

export type CanonicalCreatorRow = {
  creator_id: string
  user_id: string
  creator_lifecycle_state: string | null
  creator_visibility_state: string | null
}

export type CanonicalProfileRow = {
  profile_id: string
  profile_lifecycle_state: string | null
  identity_visibility_state: string | null
}

export type CanonicalFeedItemRow = {
  post_id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
  status: string
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  published_at: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  feed_visibility_state: string
  is_feed_visible: boolean
}
