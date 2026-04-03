import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"

type MediaType = "image" | "video" | "audio" | "file"

export type HomeFeedItem = {
  id: string
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  text: string
  createdAt: string
  isLocked: boolean
  lockReason?: "none" | "subscription" | "purchase"
  price?: number
  media?: Array<{
    url: string
    type: MediaType
  }>
  likesCount: number
  isLiked: boolean
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
  price: number | null
  created_at: string
  published_at: string | null
}

type MediaRow = {
  post_id: string
  storage_path: string
  type: MediaType | null
  mime_type: string | null
  status: "processing" | "ready" | "failed"
  sort_order: number
}

type PostLikeRow = {
  post_id: string
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

export async function getHomeFeed(
  input: GetHomeFeedInput
): Promise<GetHomeFeedResult> {
  const viewerUserId = input.viewerUserId.trim()

  if (!viewerUserId) {
    throw new Error("Viewer user id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  let publicPostsQuery = supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, visibility, price, created_at, published_at"
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (input.cursor) {
    publicPostsQuery = publicPostsQuery.lt("published_at", input.cursor)
  }

  const { data: publicPosts, error: publicPostsError } = await publicPostsQuery
    .returns<PostRow[]>()

  if (publicPostsError) {
    throw publicPostsError
  }

  const postList = publicPosts ?? []

  if (postList.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const creatorIds = Array.from(
    new Set(postList.map((post) => post.creator_id))
  )

  const { data: creators, error: creatorsError } = await supabaseAdmin
    .from("creators")
    .select(`
    id,
    user_id,
    username,
    display_name,
    profiles!inner (
      id,
      is_deactivated,
      is_delete_pending,
      deleted_at
    )
  `)
    .in("id", creatorIds)
    .eq("status", "active")
    .eq("profiles.is_deactivated", false)
    .eq("profiles.is_delete_pending", false)
    .is("profiles.deleted_at", null)
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

  if (creatorMap.size === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const filteredPosts = postList.filter((post) =>
    creatorMap.has(post.creator_id)
  )

  if (filteredPosts.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, avatar_url")
    .in("id", creatorUserIds)
    .returns<ProfileRow[]>()

  if (profilesError) {
    throw profilesError
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  const postIds = filteredPosts.map((post) => post.id)

  const { data: likeRows, error: likeRowsError } = await supabaseAdmin
    .from("post_likes")
    .select("post_id")
    .in("post_id", postIds)
    .returns<PostLikeRow[]>()

  if (likeRowsError) {
    throw likeRowsError
  }

  const { data: myLikeRows, error: myLikeRowsError } = await supabaseAdmin
    .from("post_likes")
    .select("post_id")
    .eq("user_id", viewerUserId)
    .in("post_id", postIds)
    .returns<PostLikeRow[]>()

  if (myLikeRowsError) {
    throw myLikeRowsError
  }

  const likeCountMap = new Map<string, number>()

  for (const row of likeRows ?? []) {
    likeCountMap.set(row.post_id, (likeCountMap.get(row.post_id) ?? 0) + 1)
  }

  const myLikeSet = new Set((myLikeRows ?? []).map((row) => row.post_id))

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

  const items: HomeFeedItem[] = await Promise.all(
    filteredPosts.map(async (post) => {
      const creator = creatorMap.get(post.creator_id)
      const creatorUserId = creator?.user_id ?? ""
      const profile = profileMap.get(creatorUserId)

      const selectedMediaRows = (mediaMap.get(post.id) ?? []).slice(0, 3)

      const media = await Promise.all(
        selectedMediaRows.map(async (item) => ({
          url: await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId,
            creatorUserId,
            visibility: post.visibility,
            isSubscribed: false,
            hasPurchased: false,
          }),
          type: resolveMediaType(item),
        }))
      )

      return {
        id: post.id,
        creatorId: post.creator_id,
        creatorUserId,
        currentUserId: viewerUserId,
        text: post.content ?? post.title ?? "",
        createdAt: post.published_at ?? post.created_at,
        isLocked: false,
        lockReason: "none",
        price: post.price ?? undefined,
        media,
        likesCount: likeCountMap.get(post.id) ?? 0,
        isLiked: myLikeSet.has(post.id),
        creator: {
          username: creator?.username ?? "",
          displayName: creator?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        },
      }
    })
  )

  return {
    items,
    nextCursor:
      items.length === limit
        ? items[items.length - 1]?.createdAt ?? null
        : null,
  }
}