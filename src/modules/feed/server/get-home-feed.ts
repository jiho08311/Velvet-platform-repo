import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { canViewPost } from "@/modules/post/server/can-view-post"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"

export type HomeFeedItem = {
  id: string
  creatorId: string
  text: string
  createdAt: string
  isLocked: boolean
  mediaThumbnailUrls?: string[]
}

export type GetHomeFeedInput = {
  viewerUserId: string
  limit?: number
  cursor?: string | null
}

export type GetHomeFeedResult = {
  items: HomeFeedItem[]
  nextCursor: string | null
}

type SubscriptionRow = {
  creator_id: string
}

type CreatorRow = {
  id: string
  user_id: string
}

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price_cents: number | null
  created_at: string
  published_at: string | null
}

type MediaRow = {
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file"
  status: "processing" | "ready" | "failed"
  sort_order: number
}

export async function getHomeFeed(
  input: GetHomeFeedInput
): Promise<GetHomeFeedResult> {
  const viewerUserId = input.viewerUserId.trim()

  if (!viewerUserId) {
    throw new Error("Viewer user id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
    .from("subscriptions")
    .select("creator_id")
    .eq("user_id", viewerUserId)
    .eq("status", "active")
    .returns<SubscriptionRow[]>()

  if (subscriptionsError) {
    throw subscriptionsError
  }

  const creatorIds = (subscriptions ?? []).map(
    (subscription) => subscription.creator_id
  )

  if (creatorIds.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const { data: creators, error: creatorsError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id")
    .in("id", creatorIds)
    .returns<CreatorRow[]>()

  if (creatorsError) {
    throw creatorsError
  }

  const creatorUserIdMap = new Map<string, string>()

  for (const creator of creators ?? []) {
    creatorUserIdMap.set(creator.id, creator.user_id)
  }

  let query = supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, visibility, price_cents, created_at, published_at"
    )
    .in("creator_id", creatorIds)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit)

  if (input.cursor) {
    query = query.lt("published_at", input.cursor)
  }

  const { data: posts, error: postsError } = await query.returns<PostRow[]>()

  if (postsError) {
    throw postsError
  }

  const postList = posts ?? []

  if (postList.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const postIds = postList.map((post) => post.id)

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

  const items: HomeFeedItem[] = await Promise.all(
    postList.map(async (post) => {
      const creatorUserId = creatorUserIdMap.get(post.creator_id) ?? ""

      const hasPurchased =
        post.visibility === "paid" && post.price_cents !== null
          ? await hasPurchasedPost({
              userId: viewerUserId,
              postId: post.id,
            })
          : false

      const hasAccess = canViewPost({
        viewerUserId,
        creatorId: creatorUserId,
        visibility: post.visibility,
        isSubscribed: true,
        hasPurchased,
      })

      const media = hasAccess ? (mediaMap.get(post.id) ?? []).slice(0, 3) : []

      const mediaThumbnailUrls = await Promise.all(
        media.map((item) =>
          createMediaSignedUrl({
            storagePath: item.storage_path,
          })
        )
      )

      return {
        id: post.id,
        creatorId: post.creator_id,
        text: hasAccess ? post.content ?? post.title ?? "" : "",
        createdAt: post.published_at ?? post.created_at,
        isLocked: !hasAccess,
        mediaThumbnailUrls,
      }
    })
  )

  const nextCursor =
    items.length === limit ? items[items.length - 1]?.createdAt ?? null : null

  return {
    items,
    nextCursor,
  }
}