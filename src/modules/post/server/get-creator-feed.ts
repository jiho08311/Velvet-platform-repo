import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"

type GetCreatorFeedInput = {
  creatorId: string
  userId?: string | null
}

type PostRow = {
  id: string
  creator_id: string
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price_cents: number
  status: string
  created_at: string
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

type PostLockReason = "none" | "subscription" | "purchase"

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

export async function getCreatorFeed({
  creatorId,
  userId,
}: GetCreatorFeedInput) {
  const safeUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId.trim()
      : null

  const hasSubscriptionAccess = safeUserId
    ? await checkSubscription({
        userId: safeUserId,
        creatorId,
      })
    : false

  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select("id, creator_id, content, visibility, price_cents, status, created_at")
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<PostRow[]>()

  if (error) {
    throw error
  }

  const resolvedPosts = await Promise.all(
    (posts ?? []).map(async (post) => {
      const isSubscribersOnly = post.visibility === "subscribers"
      const isPaidPost = post.visibility === "paid" && post.price_cents > 0

      let hasPurchased = false

      if (safeUserId && isPaidPost) {
        hasPurchased = await hasPurchasedPost({
          userId: safeUserId,
          postId: post.id,
        })
      }

      let lockReason: PostLockReason = "none"

      if (isSubscribersOnly && !hasSubscriptionAccess) {
        lockReason = "subscription"
      }

      if (isPaidPost && !hasPurchased) {
        lockReason = "purchase"
      }

      const isLocked = lockReason !== "none"

      return {
        ...post,
        priceCents: post.price_cents,
        hasPurchased,
        isLocked,
        lockReason,
        content: isLocked ? null : post.content,
      }
    })
  )

  const postIds = resolvedPosts.map((post) => post.id)

  if (postIds.length === 0) {
    return resolvedPosts.map((post) => ({
      ...post,
      media: [],
    }))
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
      const selectedMediaRows = post.isLocked
        ? []
        : (mediaMap.get(post.id) ?? []).slice(0, 3)

      const media = await Promise.all(
        selectedMediaRows.map(async (item) => {
          const url = await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: safeUserId,
            creatorUserId: post.creator_id,
            visibility: post.visibility,
            isSubscribed: hasSubscriptionAccess,
            hasPurchased: post.hasPurchased,
          })

          return {
            url,
            type: resolveMediaType(item),
          }
        })
      )

      return {
        ...post,
        media,
      }
    })
  )
}