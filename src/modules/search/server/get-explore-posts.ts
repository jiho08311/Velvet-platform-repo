import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"

export type ExplorePostItem = {
  id: string
  postId: string
  creatorId: string
  creatorUsername: string
  creatorDisplayName: string | null
  imageUrl: string
  createdAt: string
}

type PostRow = {
  id: string
  creator_id: string
  created_at: string
  published_at: string | null
}

type MediaRow = {
  post_id: string
  storage_path: string
  sort_order: number
}

type CreatorRow = {
  id: string
  username: string
  display_name: string | null
  user_id: string
}

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]

    next[index] = next[randomIndex]
    next[randomIndex] = current
  }

  return next
}

export async function getExplorePosts(limit = 24): Promise<ExplorePostItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 60))
  const fetchSize = Math.max(safeLimit * 3, 60)

  const { data: postRows, error: postError } = await supabaseAdmin
    .from("posts")
    .select("id, creator_id, created_at, published_at")
    .eq("status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false })
    .limit(fetchSize)
    .returns<PostRow[]>()

  if (postError) {
    throw postError
  }

  const posts = postRows ?? []

  if (posts.length === 0) {
    return []
  }

  const postIds = posts.map((post) => post.id)

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("post_id, storage_path, sort_order")
    .in("post_id", postIds)
    .eq("type", "image")
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (mediaError) {
    throw mediaError
  }

  const firstImageMap = new Map<string, MediaRow>()

  for (const media of mediaRows ?? []) {
    if (!firstImageMap.has(media.post_id)) {
      firstImageMap.set(media.post_id, media)
    }
  }

  const postsWithImage = posts.filter((post) => firstImageMap.has(post.id))

  if (postsWithImage.length === 0) {
    return []
  }

  const creatorIds = Array.from(
    new Set(postsWithImage.map((post) => post.creator_id))
  )

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, username, display_name, user_id")
    .in("id", creatorIds)
    .eq("status", "active")
    .returns<CreatorRow[]>()

  if (creatorError) {
    throw creatorError
  }

  const creatorMap = new Map(
    (creatorRows ?? []).map((creator) => [creator.id, creator])
  )

  const shuffledPosts = shuffleArray(postsWithImage).slice(0, safeLimit)

  return Promise.all(
    shuffledPosts.map(async (post) => {
      const creator = creatorMap.get(post.creator_id)
      const media = firstImageMap.get(post.id)

      if (!creator || !media) {
        throw new Error("Invalid explore post data")
      }

      const imageUrl = await createMediaSignedUrl({
        storagePath: media.storage_path,
      })

      return {
        id: `${post.id}:${media.storage_path}`,
        postId: post.id,
        creatorId: creator.id,
        creatorUsername: creator.username,
        creatorDisplayName: creator.display_name,
        imageUrl,
        createdAt: post.published_at ?? post.created_at,
      }
    })
  )
}