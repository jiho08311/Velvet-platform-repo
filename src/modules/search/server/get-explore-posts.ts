import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"

export type ExplorePostItem = {
  id: string
  postId: string
  creatorId: string
  creatorUserId: string
  creatorUsername: string
  creatorDisplayName: string | null
  imageUrl: string
  mediaType?: "image" | "video"
  mediaCount: number
  createdAt: string
  text: string | null
  likesCount: number
  commentsCount: number
}

type PostRow = {
  id: string
  creator_id: string
  created_at: string
  published_at: string | null
  content: string | null
}

type MediaRow = {
  post_id: string
  storage_path: string
  sort_order: number
  type: "image" | "video" | "audio" | "file" | null
}

type CreatorRow = {
  id: string
  username: string
  display_name: string | null
  user_id: string
  profiles: {
    id: string
    is_deactivated: boolean
  } | null
}

type PostLikeRow = {
  post_id: string
}

type CommentRow = {
  post_id: string
}

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items]

  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }

  return next
}

export async function getExplorePosts(limit = 24): Promise<ExplorePostItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 60))
  const fetchSize = Math.max(safeLimit * 3, 60)

  const { data: postRows, error: postError } = await supabaseAdmin
    .from("posts")
    .select("id, creator_id, created_at, published_at, content")
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(fetchSize)
    .returns<PostRow[]>()

  if (postError) throw postError

  const posts = postRows ?? []
  if (posts.length === 0) return []

  const postIds = posts.map((post) => post.id)

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("post_id, storage_path, sort_order, type")
    .in("post_id", postIds)
    .in("type", ["image", "video"])
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (mediaError) throw mediaError

  const mediaMap = new Map<string, MediaRow[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  const firstMediaMap = new Map<string, MediaRow>()

  for (const media of mediaRows ?? []) {
    if (!firstMediaMap.has(media.post_id)) {
      firstMediaMap.set(media.post_id, media)
    }
  }

  const postsWithMedia = posts.filter((post) => firstMediaMap.has(post.id))

  if (postsWithMedia.length === 0) return []

  const filteredPostIds = postsWithMedia.map((post) => post.id)

  const { data: likeRows, error: likeError } = await supabaseAdmin
    .from("post_likes")
    .select("post_id")
    .in("post_id", filteredPostIds)
    .returns<PostLikeRow[]>()

  if (likeError) throw likeError

  const likeCountMap = new Map<string, number>()

  for (const row of likeRows ?? []) {
    likeCountMap.set(row.post_id, (likeCountMap.get(row.post_id) ?? 0) + 1)
  }

  const { data: commentRows, error: commentError } = await supabaseAdmin
    .from("comments")
    .select("post_id")
    .in("post_id", filteredPostIds)
    .is("deleted_at", null)
    .returns<CommentRow[]>()

  if (commentError) throw commentError

  const commentCountMap = new Map<string, number>()

  for (const row of commentRows ?? []) {
    commentCountMap.set(row.post_id, (commentCountMap.get(row.post_id) ?? 0) + 1)
  }

  const creatorIds = Array.from(
    new Set(postsWithMedia.map((post) => post.creator_id))
  )

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      username,
      display_name,
      user_id,
      profiles!inner (
        id,
        is_deactivated
      )
    `)
    .in("id", creatorIds)
    .eq("status", "active")
    .eq("profiles.is_deactivated", false)
    .returns<CreatorRow[]>()

  if (creatorError) throw creatorError

  const creatorMap = new Map(
    (creatorRows ?? []).map((creator) => [creator.id, creator])
  )

  const filteredPosts = postsWithMedia.filter((post) =>
    creatorMap.has(post.creator_id)
  )

  if (filteredPosts.length === 0) return []

  const shuffledPosts = shuffleArray(filteredPosts).slice(0, safeLimit)

  return Promise.all(
    shuffledPosts.map(async (post) => {
      const creator = creatorMap.get(post.creator_id)
      const media = firstMediaMap.get(post.id)
      const mediaCount = (mediaMap.get(post.id) ?? []).length

      if (!creator || !media) {
        throw new Error("Invalid explore post data")
      }

      const imageUrl = await createMediaSignedUrl({
        storagePath: media.storage_path,
        viewerUserId: creator.user_id,
        creatorUserId: creator.user_id,
        visibility: "public",
        hasPurchased: true,
      })

      return {
        id: `${post.id}:${media.storage_path}`,
        postId: post.id,
        creatorId: creator.id,
        creatorUserId: creator.user_id,
        creatorUsername: creator.username,
        creatorDisplayName: creator.display_name,
        imageUrl,
        mediaCount,
        mediaType: media.type === "video" ? "video" : "image",
        createdAt: post.published_at ?? post.created_at,
        text: post.content ?? null,
        likesCount: likeCountMap.get(post.id) ?? 0,
        commentsCount: commentCountMap.get(post.id) ?? 0,
      }
    })
  )
}