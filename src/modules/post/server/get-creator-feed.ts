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

type MediaRow = {
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file"
  status: "processing" | "ready" | "failed"
  sort_order: number
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

      const isLocked =
        (isSubscribersOnly && !hasSubscriptionAccess) ||
        (isPaidPost && !hasPurchased)

      return {
        ...post,
        isLocked,
        content: isLocked ? null : post.content,
      }
    })
  )

  const postIds = resolvedPosts.map((post) => post.id)

  if (postIds.length === 0) {
    return resolvedPosts.map((post) => ({
      ...post,
      mediaThumbnailUrls: [],
    }))
  }

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
    resolvedPosts.map(async (post) => {
      const media = post.isLocked ? [] : (mediaMap.get(post.id) ?? []).slice(0, 3)

      const mediaThumbnailUrls = await Promise.all(
        media.map((item) =>
          createMediaSignedUrl({
            storagePath: item.storage_path,
          })
        )
      )

      return {
        ...post,
        mediaThumbnailUrls,
      }
    })
  )
}