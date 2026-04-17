import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"
import { getPostPublicState } from "@/modules/post/lib/get-post-public-state"
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
  media: Array<{
    id: string
    postId: string
    type: "image" | "video" | "audio" | "file"
    url: string
    mimeType: string | null
    sortOrder: number
  }>
  blocks: Array<{
    id: string
    postId: string
    type: "text" | "image" | "video" | "audio" | "file"
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
    editorState: unknown | null
  }>
}

type PostRow = {
  id: string
  creator_id: string
  created_at: string
  published_at: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | null
  deleted_at: string | null
}

type MediaRow = {
  id: string
  post_id: string
  storage_path: string
  mime_type: string | null
  sort_order: number
  type: "image" | "video" | "audio" | "file" | null
}

type CreatorRow = {
  id: string
  username: string
  display_name: string | null
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

type PostLikeRow = {
  post_id: string
}

type CommentRow = {
  post_id: string
}

type PostBlockRow = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: unknown | null
}

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items]

  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }

  return next
}

function resolveMediaType(
  type: MediaRow["type"],
  mimeType: string | null
): "image" | "video" | "audio" | "file" {
  if (
    type === "image" ||
    type === "video" ||
    type === "audio" ||
    type === "file"
  ) {
    return type
  }

  if (typeof mimeType === "string") {
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType.startsWith("video/")) return "video"
    if (mimeType.startsWith("audio/")) return "audio"
  }

  return "file"
}

export async function getExplorePosts(limit = 24): Promise<ExplorePostItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 60))
  const fetchSize = Math.max(safeLimit * 3, 60)
  const now = new Date().toISOString()

  const { data: postRows, error: postError } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, created_at, published_at, content, status, visibility, visibility_status, moderation_status, deleted_at"
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(fetchSize)
    .returns<PostRow[]>()

  if (postError) throw postError

  const posts = (postRows ?? []).filter((post) => {
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

  if (posts.length === 0) return []

  const postIds = posts.map((post) => post.id)

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("id, post_id, storage_path, mime_type, sort_order, type")
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

  const { data: blockRows, error: blockError } = await supabaseAdmin
    .from("post_blocks")
    .select("id, post_id, type, content, media_id, sort_order, created_at, editor_state")
    .in("post_id", filteredPostIds)
    .order("sort_order", { ascending: true })
    .returns<PostBlockRow[]>()

  if (blockError) throw blockError

  const blocksMap = new Map<string, ExplorePostItem["blocks"]>()

  for (const block of blockRows ?? []) {
    const current = blocksMap.get(block.post_id) ?? []

    current.push({
      id: block.id,
      postId: block.post_id,
      type: block.type,
      content: block.content,
      mediaId: block.media_id,
      sortOrder: block.sort_order,
      createdAt: block.created_at,
      editorState: block.editor_state ?? null,
    })

    blocksMap.set(block.post_id, current)
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

  if (creatorError) throw creatorError

  const creatorMap = new Map(
    ((creatorRows ?? []) as CreatorRow[])
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

  const visiblePosts = postsWithMedia.filter((post) =>
    creatorMap.has(post.creator_id)
  )

  if (visiblePosts.length === 0) return []

  const shuffledPosts = shuffleArray(visiblePosts).slice(0, safeLimit)

  return Promise.all(
    shuffledPosts.map(async (post) => {
      const creator = creatorMap.get(post.creator_id)
      const media = firstMediaMap.get(post.id)
      const mediaRowsForPost = mediaMap.get(post.id) ?? []
      const mediaCount = mediaRowsForPost.length

      if (!creator || !media) {
        throw new Error("Invalid explore post data")
      }

      const signedMedia = await Promise.all(
        mediaRowsForPost.map(async (item) => {
          const url = await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: creator.user_id,
            creatorUserId: creator.user_id,
            visibility: "public",
            hasPurchased: true,
          })

          return {
            id: item.id,
            postId: item.post_id,
            type: resolveMediaType(item.type, item.mime_type),
            url,
            mimeType: item.mime_type,
            sortOrder: item.sort_order,
          }
        })
      )

      const existingBlocks = blocksMap.get(post.id) ?? []

      const fallbackBlocks: ExplorePostItem["blocks"] =
        existingBlocks.length > 0
          ? existingBlocks
          : [
              ...(post.content?.trim()
                ? [
                    {
                      id: `${post.id}-fallback-text`,
                      postId: post.id,
                      type: "text" as const,
                      content: post.content,
                      mediaId: null,
                      sortOrder: 0,
                      createdAt: post.published_at ?? post.created_at,
                      editorState: null,
                    },
                  ]
                : []),
              ...signedMedia.map((item, index) => ({
                id: `${post.id}-fallback-media-${item.id}`,
                postId: post.id,
                type: item.type === "video" ? ("video" as const) : ("image" as const),
                content: null,
                mediaId: item.id,
                sortOrder: (post.content?.trim() ? 1 : 0) + index,
                createdAt: post.published_at ?? post.created_at,
                editorState: null,
              })),
            ]

      return {
        id: `${post.id}:${media.storage_path}`,
        postId: post.id,
        creatorId: creator.id,
        creatorUserId: creator.user_id,
        creatorUsername: creator.username,
        creatorDisplayName: creator.display_name,
        imageUrl: signedMedia[0]?.url ?? "",
        mediaCount,
        mediaType: signedMedia[0]?.type === "video" ? "video" : "image",
        createdAt: post.published_at ?? post.created_at,
        text: post.content ?? null,
        likesCount: likeCountMap.get(post.id) ?? 0,
        commentsCount: commentCountMap.get(post.id) ?? 0,
        media: signedMedia,
        blocks: fallbackBlocks,
      }
    })
  )
}