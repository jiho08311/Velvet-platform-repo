import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"
import { getPostPublicState } from "@/modules/post/lib/get-post-public-state"

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

type MediaRow = {
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file"
  status: "processing" | "ready" | "failed"
  sort_order: number
}

type ListCreatorPostsInput = {
  creatorId: string
  userId?: string
  limit?: number
  status?: "draft" | "published" | "archived"
}

export async function listCreatorPosts({
  creatorId,
  userId,
  limit = 20,
  status,
}: ListCreatorPostsInput): Promise<
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
    mediaThumbnailUrls?: string[]
    isLocked?: boolean
  }>
> {
  const safeUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId.trim()
      : undefined

  const safeLimit = Math.max(1, Math.min(limit, 100))
  const now = new Date().toISOString()

  const { data: creator, error: creatorError } = await supabaseAdmin
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
    .eq("id", creatorId)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) {
    return []
  }

  const isOwner = !!safeUserId && safeUserId === creator.user_id

  if (
    !isOwner &&
    !isPublicCreatorProfileVisible({
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
  ) {
    return []
  }

  let query = supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price, published_at, created_at, updated_at, visibility_status, moderation_status, deleted_at"
    )
    .eq("creator_id", creatorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(safeLimit * 3)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.returns<PostRow[]>()

  if (error) {
    throw error
  }

  const posts = isOwner
    ? (data ?? []).slice(0, safeLimit)
    : (data ?? [])
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

  if (posts.length === 0) {
    return []
  }

  const filteredPosts: Array<
    PostRow & {
      isLocked?: boolean
      isSubscribed: boolean
      hasPurchased: boolean
    }
  > = []

  for (const post of posts) {
    let isLocked = false
    let isSubscribed = false
    let hasPurchased = false

    if (post.visibility === "subscribers") {
      if (!safeUserId) {
        isLocked = true
      } else if (!isOwner) {
        isSubscribed = await checkSubscription({
          userId: safeUserId,
          creatorId: post.creator_id,
        })

        if (!isSubscribed) {
          isLocked = true
        }
      } else {
        isSubscribed = true
      }
    }

    if (post.visibility === "paid") {
      if (!safeUserId) {
        isLocked = true
      } else if (!isOwner) {
        hasPurchased = await hasPurchasedPost({
          userId: safeUserId,
          postId: post.id,
        })

        if (!hasPurchased) {
          isLocked = true
        }
      } else {
        hasPurchased = true
      }
    }

    filteredPosts.push({
      ...post,
      isLocked,
      isSubscribed,
      hasPurchased,
      content: isLocked ? null : post.content,
    })
  }

  const postIds = filteredPosts.map((post) => post.id)

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("post_id, storage_path, type, status, sort_order")
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
    filteredPosts.map(async (post) => {
      const media = post.isLocked
        ? []
        : (mediaMap.get(post.id) ?? []).slice(0, 3)

      const mediaThumbnailUrls = await Promise.all(
        media.map((item) =>
          createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: safeUserId,
            creatorUserId: creator.user_id,
            visibility: post.visibility,
            isSubscribed: post.isSubscribed,
            hasPurchased: post.hasPurchased,
          })
        )
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
        mediaThumbnailUrls,
        isLocked: post.isLocked,
      }
    })
  )
}