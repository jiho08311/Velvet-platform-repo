import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { buildCreatorIdentity } from "@/modules/creator/server/build-creator-identity"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import type { PostBlockEditorState } from "@/modules/post/types"
import {
  buildPostLikeCountMap,
  readPostLikeCount,
} from "@/shared/lib/post-like-count"
import {
  filterFeedPostCandidates,
  isVisibleFeedCreator,
} from "./feed-inclusion-policy"

type MediaType = "image" | "video" | "audio" | "file"

type PostBlockType = "text" | "image" | "video" | "audio" | "file"

export type HomeFeedItem = {
  id: string
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  text: string
  createdAt: string
  isLocked: boolean
  status?: "draft" | "scheduled" | "published" | "archived"
  publishedAt?: string | null
  lockReason?: "none" | "subscription" | "purchase"
  price?: number
  media?: Array<{
    id: string
    url: string
    type: MediaType
  }>
  blocks?: Array<{
    id: string
    postId: string
    type: PostBlockType
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
    editorState: PostBlockEditorState | null
  }>
  likesCount: number
  isLiked: boolean
  commentsCount: number
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
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    username?: string | null
    display_name?: string | null
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

type ProfileRow = {
  id: string
  username?: string | null
  display_name?: string | null
  avatar_url: string | null
  bio?: string | null
}

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  status: "draft" | "scheduled" | "published" | "archived"
  price: number | null
  created_at: string
  published_at: string | null
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | null
  deleted_at: string | null
  post_blocks?: Array<{
    id: string
    post_id: string
    type: PostBlockType
    content: string | null
    media_id: string | null
    sort_order: number
    created_at: string
    editor_state: PostBlockEditorState | null
  }>
}

type MediaRow = {
  id: string
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

type CommentRow = {
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
  const viewerUserId = input.viewerUserId?.trim() ?? ""
  const safeLimit = Math.max(1, Math.min(input.limit ?? 20, 100))
  const fetchLimit = Math.max(safeLimit * 3, 60)
  const now = new Date().toISOString()

  let publicPostsQuery = supabaseAdmin
    .from("posts")
    .select(`
      id,
      creator_id,
      title,
      content,
      visibility,
      price,
      status,
      created_at,
      published_at,
      visibility_status,
      moderation_status,
      deleted_at,
         post_blocks (
        id,
        post_id,
        type,
        content,
        media_id,
        sort_order,
        created_at,
        editor_state
      )
    `)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(fetchLimit)

  if (input.cursor) {
    publicPostsQuery = publicPostsQuery.lt("published_at", input.cursor)
  }

  const { data: publicPosts, error: publicPostsError } = await publicPostsQuery
    .returns<PostRow[]>()

  if (publicPostsError) {
    throw publicPostsError
  }

  const visiblePostCandidates = filterFeedPostCandidates(
    publicPosts ?? [],
    now,
    ["published", "upcoming"]
  )

  if (visiblePostCandidates.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const creatorIds = Array.from(
    new Set(visiblePostCandidates.map(({ post }) => post.creator_id))
  )

  const { data: creators, error: creatorsError } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      username,
      display_name,
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

  if (creatorsError) {
    throw creatorsError
  }

  const creatorMap = new Map<string, CreatorRow>()

  for (const creator of creators ?? []) {
    if (isVisibleFeedCreator(creator)) {
      creatorMap.set(creator.id, creator)
    }
  }

  if (creatorMap.size === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const filteredPosts = visiblePostCandidates
    .filter(({ post }) => creatorMap.has(post.creator_id))
    .slice(0, safeLimit)

  if (filteredPosts.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const creatorUserIds = Array.from(
    new Set(
      filteredPosts
        .map(({ post }) => creatorMap.get(post.creator_id)?.user_id ?? "")
        .filter((value) => value.length > 0)
    )
  )

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

  const postIds = filteredPosts.map(({ post }) => post.id)

  const { data: likeRows, error: likeRowsError } = await supabaseAdmin
    .from("post_likes")
    .select("post_id")
    .in("post_id", postIds)
    .returns<PostLikeRow[]>()

  if (likeRowsError) {
    throw likeRowsError
  }

  let myLikeRows: PostLikeRow[] | null = null
  let myLikeRowsError: unknown = null

  if (viewerUserId) {
    const result = await supabaseAdmin
      .from("post_likes")
      .select("post_id")
      .eq("user_id", viewerUserId)
      .in("post_id", postIds)
      .returns<PostLikeRow[]>()

    myLikeRows = result.data
    myLikeRowsError = result.error
  }

  if (myLikeRowsError) {
    throw myLikeRowsError
  }

  const likeCountMap = buildPostLikeCountMap(likeRows)

  const myLikeSet = new Set((myLikeRows ?? []).map((row) => row.post_id))

  const { data: commentRows, error: commentError } = await supabaseAdmin
    .from("comments")
    .select("post_id")
    .in("post_id", postIds)
    .is("deleted_at", null)
    .returns<CommentRow[]>()

  if (commentError) {
    throw commentError
  }

  const commentCountMap = new Map<string, number>()

  for (const row of commentRows ?? []) {
    commentCountMap.set(
      row.post_id,
      (commentCountMap.get(row.post_id) ?? 0) + 1
    )
  }

  const publishedPostIds = filteredPosts
    .filter(({ publicState }) => publicState === "published")
    .map(({ post }) => post.id)

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("id, post_id, storage_path, type, mime_type, status, sort_order")
    .in(
      "post_id",
      publishedPostIds.length > 0
        ? publishedPostIds
        : ["00000000-0000-0000-0000-000000000000"]
    )
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
    filteredPosts.map(async ({ post, publicState }) => {
      const creator = creatorMap.get(post.creator_id)
      const creatorUserId = creator?.user_id ?? ""
      const profile = profileMap.get(creatorUserId)
      const identity =
        creator != null
          ? buildCreatorIdentity({
              creator,
              profile: profile ?? null,
            })
          : null

      if (publicState === "upcoming") {
        return {
          id: post.id,
          creatorId: post.creator_id,
          status: post.status,
          publishedAt: post.published_at ?? null,
          creatorUserId,
          currentUserId: viewerUserId || undefined,
          text: post.content ?? post.title ?? "",
          createdAt: post.created_at,
          isLocked: false,
          lockReason: "none",
          price: post.price ?? undefined,
          media: [],
          blocks: [],
          likesCount: 0,
          isLiked: false,
          commentsCount: 0,
          creator: {
            username: identity?.username ?? "",
            displayName: identity?.displayName ?? null,
            avatarUrl: identity?.avatarUrl ?? null,
          },
        }
      }

      const selectedMediaRows = (mediaMap.get(post.id) ?? []).slice(0, 3)

      const media = await Promise.all(
        selectedMediaRows.map(async (item) => ({
          id: item.id,
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
      const normalizedBlocks = [...(post.post_blocks ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((block) => ({
          id: block.id,
          postId: block.post_id,
          type: block.type,
          content: block.content,
          mediaId: block.media_id,
          sortOrder: block.sort_order,
          createdAt: block.created_at,
          editorState: block.editor_state ?? null,
        }))
      return {
        id: post.id,
        creatorId: post.creator_id,
        status: post.status,
        publishedAt: post.published_at ?? null,
        creatorUserId,
        currentUserId: viewerUserId || undefined,
        text: post.content ?? post.title ?? "",
        createdAt: post.published_at ?? post.created_at,
        isLocked: false,
        lockReason: "none",
        price: post.price ?? undefined,
        media,
        blocks: normalizedBlocks,
        likesCount: readPostLikeCount(likeCountMap, post.id),
        isLiked: myLikeSet.has(post.id),
        commentsCount: commentCountMap.get(post.id) ?? 0,
        creator: {
          username: identity?.username ?? "",
          displayName: identity?.displayName ?? null,
          avatarUrl: identity?.avatarUrl ?? null,
        },
      }
    })
  )

  return {
    items,
    nextCursor:
      items.length === safeLimit
        ? items[items.length - 1]?.publishedAt ?? null
        : null,
  }
}
