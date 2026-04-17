import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"
import { getPostPublicState } from "@/modules/post/lib/get-post-public-state"

type SubscriptionRow = {
  creator_id: string
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
  moderation_status: "pending" | "approved" | "rejected" | null
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
  post_id: string
  storage_path: string
  type: MediaType | null
  mime_type: string | null
  status: "processing" | "ready" | "failed"
  sort_order: number
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
}: ListFeedPostsInput): Promise<
  Array<{
    id: string
    creatorId: string
    title?: string
    content?: string
    status: "draft" | "scheduled" | "published" | "archived"
    visibility: "public" | "subscribers" | "paid"
    price: number
    publishedAt?: string
    createdAt: string
    updatedAt: string
    media: Array<{
      url: string
      type: MediaType
    }>
  }>
> {
  const safeLimit = Math.max(1, Math.min(limit, 100))
  const now = new Date().toISOString()

  const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
    .from("subscriptions")
    .select("creator_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .returns<SubscriptionRow[]>()

  if (subscriptionsError) {
    throw subscriptionsError
  }

  const creatorIds = (subscriptions ?? []).map(
    (subscription) => subscription.creator_id
  )

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
      .filter((creator) =>
        isPublicCreatorProfileVisible({
          creator: {
            status: creator.status,
          },
          profile: creator.profiles
            ? {
                isDeactivated: creator.profiles.is_deactivated,
                isDeletePending: creator.profiles.is_delete_pending,
                deletedAt: creator.profiles.deleted_at,
                isBanned: creator.profiles.is_banned,
              }
            : null,
        })
      )
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

  const resolvedPosts = (posts ?? [])
    .filter((post) => {
      return (
        getPostPublicState({
          status: post.status,
          visibility: post.visibility,
          visibilityStatus: post.visibility_status,
          moderationStatus: post.moderation_status,
          publishedAt: post.published_at,
          deletedAt: post.deleted_at,
          now,
        }) === "published"
      )
    })
    .slice(0, safeLimit)

  const postIds = resolvedPosts.map((post) => post.id)

  if (postIds.length === 0) {
    return []
  }

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("post_id, storage_path, type, mime_type, status, sort_order")
    .in("post_id", postIds)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (mediaError) {
    throw mediaError
  }

  const mediaMap = new Map<string, MediaRow[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
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
            viewerUserId: userId,
            creatorUserId,
            visibility: post.visibility,
            isSubscribed: true,
            hasPurchased: false,
          })

          return {
            url,
            type: resolveMediaType(item),
          }
        })
      )

      return {
        id: post.id,
        creatorId: post.creator_id,
        title: post.title ?? undefined,
        content: post.content ?? undefined,
        status: post.status,
        visibility: post.visibility,
        price: post.price,
        publishedAt: post.published_at ?? undefined,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        media,
      }
    })
  )
}