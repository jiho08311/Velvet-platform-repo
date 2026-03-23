import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price_cents: number
  published_at: string | null
  created_at: string
  updated_at: string
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
    status: "draft" | "published" | "archived"
    visibility: "public" | "subscribers" | "paid"
    priceCents: number
    publishedAt?: string
    createdAt: string
    updatedAt: string
    mediaThumbnailUrls?: string[]
    isLocked?: boolean
  }>
> {
  let query = supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price_cents, published_at, created_at, updated_at"
    )
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.returns<PostRow[]>()

  if (error) {
    throw error
  }

  const posts = data ?? []

  if (posts.length === 0) {
    return []
  }

  const filteredPosts: Array<PostRow & { isLocked?: boolean }> = []

  for (const post of posts) {
    let isLocked = false

    if (post.visibility === "subscribers") {
      if (!userId) {
        isLocked = true
      } else {
        const isSubscribed = await checkSubscription({
          userId,
          creatorId: post.creator_id,
        })

        if (!isSubscribed) {
          isLocked = true
        }
      }
    }

    if (post.visibility === "paid") {
      if (!userId) {
        isLocked = true
      } else {
        const hasPurchased = await hasPurchasedPost({
          userId,
          postId: post.id,
        })

        if (!hasPurchased) {
          isLocked = true
        }
      }
    }

    const nextPost: PostRow & { isLocked?: boolean } = {
      ...post,
      isLocked,
      content: isLocked ? null : post.content,
    }

    filteredPosts.push(nextPost)
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
        priceCents: post.price_cents,
        publishedAt: post.published_at ?? undefined,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        mediaThumbnailUrls,
        isLocked: post.isLocked,
      }
    })
  )
}