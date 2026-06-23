export type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  created_at: string
  published_at: string | null
  deleted_at?: string | null
}

export type PostCreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

export type ListCreatorPostsCreatorRow = {
  id: string
  user_id: string
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

export type ListCreatorPostsPostRow = {
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
}

export type PostCreateCreatorRow = {
  id: string
}

export type CreatorStudioPostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type CreatorStudioPostDetailRow = CreatorStudioPostRow & {
  price: number | null
}

export type MyPostsCreatorRow = {
  id: string
  user_id: string
}

export type MyPostsPostRow = {
  id: string
  creator_id: string
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  created_at: string
  published_at: string | null
}

export type PostMediaAccessPostRow = {
  id: string
  creator_id: string
  visibility: "public" | "subscribers" | "paid"
  price: number
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  published_at: string | null
  deleted_at: string | null
}

export type PostMediaCreatorRow = {
  id: string
  user_id: string
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

export type CurrentPostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived"
  | null

export type CanonicalPostRow = {
  post_id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  lifecycle_state: "draft" | "scheduled" | "published" | "archived"
  visibility_state: "draft" | "processing" | "published" | "rejected" | null
  moderation_state: "pending" | "approved" | "needs_review" | "rejected" | "archived" | null
  published_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}
