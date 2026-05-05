// src/modules/post/repositories/post-feed-repository.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PostBlockEditorState } from "@/modules/post/types"

export type FeedCreatorRow = {
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

export type FeedSubscriptionRow = {
  id: string
  user_id: string
  creator_id: string
  status: "incomplete" | "active" | "canceled" | "expired"
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  canceled_at: string | null
  created_at: string
  updated_at: string
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

export async function findCreatorFeedCreatorById(
  creatorId: string
): Promise<FeedCreatorRow | null> {
  const { data, error } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      status,
      profiles (
        id,
        is_deactivated,
        is_delete_pending,
        deleted_at,
        is_banned
      )
    `)
    .eq("id", creatorId)
    .maybeSingle<FeedCreatorRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findCreatorFeedPostsByCreatorId(
  creatorId: string
): Promise<CreatorFeedPostRow[]> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, content, visibility, price, status, created_at, published_at, visibility_status, moderation_status, deleted_at"
    )
    .eq("creator_id", creatorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<CreatorFeedPostRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findSubscribedFeedSubscriptionsByUserId(
  userId: string
): Promise<FeedSubscriptionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, creator_id, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .returns<FeedSubscriptionRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findSubscribedFeedCreatorsByIds(
  creatorIds: string[]
): Promise<FeedCreatorRow[]> {
  if (creatorIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      status,
      profiles!inner (
        id,
        is_deactivated,
        is_delete_pending,
        deleted_at,
        is_banned
      )
    `)
    .in("id", creatorIds)
    .returns<FeedCreatorRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findSubscribedFeedPostsByCreatorIds(params: {
  creatorIds: string[]
  limit: number
}): Promise<SubscribedFeedPostRow[]> {
  if (params.creatorIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price, published_at, created_at, updated_at, visibility_status, moderation_status, deleted_at"
    )
    .in("creator_id", params.creatorIds)
    .in("visibility", ["public", "subscribers"])
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(params.limit)
    .returns<SubscribedFeedPostRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findFeedPostBlocksByPostIds(
  postIds: string[]
): Promise<FeedPostBlockRow[]> {
  if (postIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("post_blocks")
    .select(
      "id, post_id, type, content, media_id, sort_order, created_at, editor_state"
    )
    .in("post_id", postIds)
    .order("sort_order", { ascending: true })
    .returns<FeedPostBlockRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findFeedPostMediaRowsByPostIds(params: {
  postIds: string[]
  statuses: Array<"processing" | "ready" | "failed">
}): Promise<FeedMediaRow[]> {
  if (params.postIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, post_id, storage_path, type, mime_type, status, sort_order")
    .in("post_id", params.postIds)
    .in("status", params.statuses)
    .order("sort_order", { ascending: true })
    .returns<FeedMediaRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}