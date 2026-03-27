import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { canViewPost } from "@/modules/post/server/can-view-post"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"

export type HomeFeedItem = {
  id: string
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  text: string
  createdAt: string
  isLocked: boolean
  lockReason?: "none" | "subscription" | "purchase"
  mediaThumbnailUrls?: string[]
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
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
  username: string
  display_name: string | null
}

type ProfileRow = {
  id: string
  avatar_url: string | null
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
    .select("id, user_id, username, display_name")
    .in("id", creatorIds)
    .returns<CreatorRow[]>()

  if (creatorsError) {
    throw creatorsError
  }

  const creatorMap = new Map<string, CreatorRow>()
  const creatorUserIds: string[] = []

  for (const creator of creators ?? []) {
    creatorMap.set(creator.id, creator)
    creatorUserIds.push(creator.user_id)
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, avatar_url")
    .in("id", creatorUserIds)
    .returns<ProfileRow[]>()

  if (profilesError) {
    throw profilesError
  }

  const profileMap = new Map<string, ProfileRow>()

  for (const profile of profiles ?? []) {
    profileMap.set(profile.id, profile)
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
      const creator = creatorMap.get(post.creator_id)
      const creatorUserId = creator?.user_id ?? ""
      const profile = profileMap.get(creatorUserId)

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

      const lockReason: "none" | "subscription" | "purchase" =
        hasAccess
          ? "none"
          : post.visibility === "paid"
            ? "purchase"
            : post.visibility === "subscribers"
              ? "subscription"
              : "none"

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
        creatorUserId,
        currentUserId: viewerUserId,
        text: hasAccess ? post.content ?? post.title ?? "" : "",
        createdAt: post.published_at ?? post.created_at,
        isLocked: !hasAccess,
        lockReason,
        mediaThumbnailUrls,
        creator: {
          username: creator?.username ?? "",
          displayName: creator?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        },
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