import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { buildSubscriptionReadModel } from "@/modules/subscription/server/build-subscription-read-model"
import {
  filterFeedPostCandidates,
  isVisibleFeedCreator,
} from "@/modules/feed/server/feed-inclusion-policy"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import type { PostBlockEditorState, PostRenderListItem } from "../types"
import { buildPostRenderReadModel } from "./post-render-read-model"

type SubscriptionRow = {
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

type PostRow = {
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

type CreatorRow = {
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

type MediaType = "image" | "video" | "audio" | "file"

type MediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: MediaType | null
  mime_type: string | null
  status: "processing" | "ready" | "failed"
  sort_order: number
}

type PostBlockRow = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: PostBlockEditorState | null
}

type ListFeedPostsInput = {
  userId: string
  limit?: number
}

function resolveMediaType(row: MediaRow): MediaType {
  if (
    row.type === "image" ||
    row.type === "video" ||
    row.type === "audio" ||
    row.type === "file"
  ) {
    return row.type
  }

  if (typeof row.mime_type === "string") {
    if (row.mime_type.startsWith("image/")) return "image"
    if (row.mime_type.startsWith("video/")) return "video"
    if (row.mime_type.startsWith("audio/")) return "audio"
  }

  return "file"
}

export async function listFeedPosts({
  userId,
  limit = 20,
}: ListFeedPostsInput): Promise<PostRenderListItem[]> {
  const resolvedUserId = userId.trim()
  const safeLimit = Math.max(1, Math.min(limit, 100))
  const now = new Date().toISOString()

  if (!resolvedUserId) {
    return []
  }

  const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, creator_id, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at"
    )
    .eq("user_id", resolvedUserId)
    .returns<SubscriptionRow[]>()

  if (subscriptionsError) {
    throw subscriptionsError
  }

  const creatorIds = (subscriptions ?? [])
    .filter((subscription) =>
      buildSubscriptionReadModel(subscription).hasAccess
    )
    .map((subscription) => subscription.creator_id)

  if (creatorIds.length === 0) {
    return []
  }

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
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
    .returns<CreatorRow[]>()

  if (creatorError) {
    throw creatorError
  }

  const visibleCreatorMap = new Map(
    (creatorRows ?? [])
      .filter((creator) => isVisibleFeedCreator(creator))
      .map((creator) => [creator.id, creator])
  )

  const visibleCreatorIds = Array.from(visibleCreatorMap.keys())

  if (visibleCreatorIds.length === 0) {
    return []
  }

  const { data: posts, error: postsError } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price, published_at, created_at, updated_at, visibility_status, moderation_status, deleted_at"
    )
    .in("creator_id", visibleCreatorIds)
    .in("visibility", ["public", "subscribers"])
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(safeLimit * 3)
    .returns<PostRow[]>()

  if (postsError) {
    throw postsError
  }

  const resolvedPosts = filterFeedPostCandidates(posts ?? [], now, [
    "published",
  ])
    .map(({ post }) => post)
    .slice(0, safeLimit)

  const postIds = resolvedPosts.map((post) => post.id)

  if (postIds.length === 0) {
    return []
  }

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("id, post_id, storage_path, type, mime_type, status, sort_order")
    .in("post_id", postIds)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (mediaError) {
    throw mediaError
  }

  const { data: blockRows, error: blockRowsError } = await supabaseAdmin
    .from("post_blocks")
    .select("id, post_id, type, content, media_id, sort_order, created_at, editor_state")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true })
    .returns<PostBlockRow[]>()

  if (blockRowsError) {
    throw blockRowsError
  }

  const mediaMap = new Map<string, MediaRow[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  const blocksMap = new Map<string, PostBlockRow[]>()

  for (const block of blockRows ?? []) {
    const current = blocksMap.get(block.post_id) ?? []
    current.push(block)
    blocksMap.set(block.post_id, current)
  }

  return Promise.all(
    resolvedPosts.map(async (post) => {
      const creator = visibleCreatorMap.get(post.creator_id)
      const creatorUserId = creator?.user_id ?? ""

      const selectedMediaRows = (mediaMap.get(post.id) ?? []).slice(0, 3)

      const media = await Promise.all(
        selectedMediaRows.map(async (item) => {
          const url = await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: resolvedUserId,
            creatorUserId,
            visibility: post.visibility,
            isSubscribed: true,
            hasPurchased: false,
          })

          return {
            id: item.id,
            url,
            type: resolveMediaType(item),
            mimeType: item.mime_type,
            sortOrder: item.sort_order,
          }
        })
      )

      const renderReadModel = buildPostRenderReadModel({
        blockRows: blocksMap.get(post.id) ?? [],
        mediaItems: media,
      })

      const renderInput = buildPostRenderInput({
        text: post.content ?? "",
        blocks: renderReadModel.blocks,
        media: renderReadModel.media,
      })

      return {
        id: post.id,
        creatorId: post.creator_id,
        content: renderInput.blockText || null,
        status: post.status,
        visibility: post.visibility,
        price: post.price,
        isLocked: false,
        publishedAt: post.published_at ?? null,
        createdAt: post.created_at,
        media: media.map((item) => ({
          id: item.id,
          url: item.url,
          type: item.type,
          mimeType: item.mimeType,
          sortOrder: item.sortOrder,
        })),
      }
    })
  )
}
