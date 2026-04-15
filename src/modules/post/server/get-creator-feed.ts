import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"
import type { PostBlockEditorState } from "../types"

type CreatorFeedPost = {
  id: string
  content: string | null
  created_at: string
  media: Array<{
    id: string
    url: string
    type: "image" | "video" | "audio" | "file"
  }>
  blocks?: {
    id: string
    postId: string
    type: "text" | "image" | "video" | "audio" | "file"
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
    editorState: PostBlockEditorState | null
  }[]
  price: number
  isLocked: boolean
  likesCount: number
  isLiked: boolean
  visibility: "public" | "subscribers" | "paid"
  commentsCount: number
  status?: string
  published_at?: string | null
}

type GetCreatorFeedInput = {
  creatorId: string
  creatorUserId?: string | null
  userId?: string | null
}

type PostRow = {
  id: string
  creator_id: string
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
  status: string
  created_at: string
  published_at?: string | null
}

type MediaType = "image" | "video" | "audio" | "file"

type MediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: MediaType | null
  mime_type: string | null
  status: "processing" | "ready" | "failed"
  sort_order: number
}

type PostLockReason = "none" | "subscription" | "purchase"

type PostLikeRow = {
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
  editor_state: PostBlockEditorState | null
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

export async function getCreatorFeed({
  creatorId,
  creatorUserId,
  userId,
}: GetCreatorFeedInput): Promise<CreatorFeedPost[]> {
  const safeUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId.trim()
      : null

  const safeCreatorUserId =
    typeof creatorUserId === "string" && creatorUserId.trim().length > 0
      ? creatorUserId.trim()
      : null

  const isOwner =
    safeUserId !== null &&
    safeCreatorUserId !== null &&
    safeUserId === safeCreatorUserId

  const hasSubscriptionAccess = isOwner
    ? true
    : safeUserId
      ? await checkSubscription({
          userId: safeUserId,
          creatorId,
        })
      : false

  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select("id, creator_id, content, visibility, price, status, created_at, published_at")
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .eq("visibility_status", "published")
    .eq("moderation_status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<PostRow[]>()

  if (error) {
    throw error
  }

  const resolvedPosts = await Promise.all(
    (posts ?? []).map(async (post) => {
      const isSubscribersOnly = post.visibility === "subscribers"
      const isPaidPost = post.visibility === "paid" && post.price > 0

      let hasPurchased = false

      if (safeUserId && isPaidPost && !isOwner) {
        hasPurchased = await hasPurchasedPost({
          userId: safeUserId,
          postId: post.id,
        })
      }

      let lockReason: PostLockReason = "none"

      if (isSubscribersOnly && !hasSubscriptionAccess) {
        lockReason = "subscription"
      }

      if (isPaidPost && !hasPurchased && !isOwner) {
        lockReason = "purchase"
      }

      const isLocked = lockReason !== "none"

      return {
        ...post,
        price: post.price,
        hasPurchased: isOwner ? true : hasPurchased,
        isLocked,
        lockReason,
        content: isLocked ? null : post.content,
      }
    })
  )

  const postIds = resolvedPosts.map((post) => post.id)

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
    .eq("user_id", safeUserId ?? "")
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

  const { data: commentRows, error: commentRowsError } = await supabaseAdmin
    .from("comments")
    .select("post_id")
    .in("post_id", postIds)

  if (commentRowsError) {
    throw commentRowsError
  }

  const commentCountMap = new Map<string, number>()

  for (const row of commentRows ?? []) {
    commentCountMap.set(row.post_id, (commentCountMap.get(row.post_id) ?? 0) + 1)
  }

  if (postIds.length === 0) {
    return resolvedPosts.map((post) => ({
      ...post,
      media: [],
      blocks: [],
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
    }))
  }

  const { data: blockRows, error: blockRowsError } = await supabaseAdmin
    .from("post_blocks")
    .select("id, post_id, type, content, media_id, sort_order, created_at, editor_state")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true })
    .returns<PostBlockRow[]>()

  if (blockRowsError) {
    throw blockRowsError
  }

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("id, post_id, storage_path, type, mime_type, status, sort_order")
    .in("post_id", postIds)
    .in("status", ["processing", "ready"])
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

  const blocksMap = new Map<string, CreatorFeedPost["blocks"]>()

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

  return Promise.all(
    resolvedPosts.map(async (post) => {
      const selectedMediaRows = post.isLocked
        ? []
        : (mediaMap.get(post.id) ?? [])

      const media = await Promise.all(
        selectedMediaRows.map(async (item) => {
          const url = await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: safeUserId,
            creatorUserId: safeCreatorUserId,
            visibility: post.visibility,
            isSubscribed: hasSubscriptionAccess,
            hasPurchased: post.hasPurchased,
          })

          return {
            id: item.id,
            url,
            type: resolveMediaType(item),
          }
        })
      )

      return {
        ...post,
        media,
        blocks: post.isLocked ? [] : blocksMap.get(post.id) ?? [],
        likesCount: likeCountMap.get(post.id) ?? 0,
        isLiked: myLikeSet.has(post.id),
        commentsCount: commentCountMap.get(post.id) ?? 0,
      }
    })
  )
}