import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import {
  buildPostLikeCountMap,
  readPostLikeCount,
} from "@/shared/lib/post-like-count"
import {
  filterFeedPostCandidates,
  isVisibleFeedCreator,
} from "@/modules/feed/server/feed-inclusion-policy"
import { getPostLockedPreviewPresentation } from "@/modules/post/lib/get-post-locked-preview-presentation"
import type {
  PostBlockEditorState,
  PostRenderSurfaceItem,
} from "../types"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import { buildPostRenderReadModel } from "./post-render-read-model"
import { buildLockedPreviewPolicy } from "./locked-preview-policy"
import { resolvePostAccessState } from "./resolve-post-access-state"

type GetCreatorFeedInput = {
  creatorId: string
  creatorUserId?: string | null
  userId?: string | null
}

type CreatorRow = {
  id: string
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

type PostRow = {
  id: string
  creator_id: string
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
  status: string
  created_at: string
  published_at?: string | null
  visibility_status?: string | null
  moderation_status?: string | null
  deleted_at?: string | null
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
}: GetCreatorFeedInput): Promise<PostRenderSurfaceItem[]> {
  const safeUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId.trim()
      : null

  const safeCreatorUserId =
    typeof creatorUserId === "string" && creatorUserId.trim().length > 0
      ? creatorUserId.trim()
      : null

  const now = new Date().toISOString()

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      status,
      profiles (
        id,
        is_deactivated,
        is_delete_pending,
        deleted_at,
        is_banned
      )
    `)
    .eq("id", creatorId)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) {
    return []
  }

  const resolvedCreatorUserId = safeCreatorUserId ?? creator.user_id
  const isOwner =
    safeUserId !== null && safeUserId === resolvedCreatorUserId

  if (!isOwner && !isVisibleFeedCreator(creator)) {
    return []
  }

  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, content, visibility, price, status, created_at, published_at, visibility_status, moderation_status, deleted_at"
    )
    .eq("creator_id", creatorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<PostRow[]>()

  if (error) {
    throw error
  }

  const visiblePosts = filterFeedPostCandidates(posts ?? [], now, [
    "published",
    "upcoming",
  ])

  const resolvedPosts = await Promise.all(
    visiblePosts.map(async ({ post, publicState }) => {
      const resolvedAccessState = await resolvePostAccessState({
        viewerUserId: safeUserId,
        creatorId,
        creatorUserId: resolvedCreatorUserId,
        post: {
          id: post.id,
          title: null,
          content: post.content,
          status: post.status as PostRenderSurfaceItem["status"],
          visibility: post.visibility,
          price: post.price,
          publishedAt: post.published_at ?? null,
          createdAt: post.created_at,
          updatedAt: post.created_at,
        },
      })

      const lockedPreviewPresentation = getPostLockedPreviewPresentation(
        resolvedAccessState.access
      )
      const isLocked = lockedPreviewPresentation.isLockedPreview

      return {
        ...post,
        publicState,
        price: post.price,
        hasPurchased: resolvedAccessState.hasPurchased,
        isSubscribed: resolvedAccessState.isSubscribed,
        isLocked,
        lockReason: lockedPreviewPresentation.lockReason,
        purchaseEligibility: resolvedAccessState.purchaseEligibility,
        access: resolvedAccessState.access,
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

  const likeCountMap = buildPostLikeCountMap(likeRows)

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
      id: post.id,
      creatorId: post.creator_id,
      content: null,
      createdAt: post.created_at,
      renderInput: buildPostRenderInput({
        text: "",
        blocks: [],
        media: [],
      }),
      media: [],
      blocks: [],
      price: post.price,
      isLocked: post.isLocked,
      lockReason: post.lockReason,
      purchaseEligibility: post.purchaseEligibility,
      likesCount: 0,
      isLiked: false,
      visibility: post.visibility,
      commentsCount: 0,
      status: post.status as PostRenderSurfaceItem["status"],
      publishedAt: post.published_at ?? null,
    }))
  }

  const { data: blockRows, error: blockRowsError } = await supabaseAdmin
    .from("post_blocks")
    .select(
      "id, post_id, type, content, media_id, sort_order, created_at, editor_state"
    )
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

  const blocksMap = new Map<string, PostBlockRow[]>()

  for (const block of blockRows ?? []) {
    const current = blocksMap.get(block.post_id) ?? []
    current.push(block)
    blocksMap.set(block.post_id, current)
  }

  return Promise.all(
    resolvedPosts.map(async (post) => {
      const allBlocks = (blocksMap.get(post.id) ?? []).map((block) => ({
        id: block.id,
        postId: block.post_id,
        type: block.type,
        content: block.content,
        mediaId: block.media_id,
        sortOrder: block.sort_order,
        createdAt: block.created_at,
        editorState: block.editor_state ?? null,
      }))

      const allMediaRows = mediaMap.get(post.id) ?? []

      const previewPolicy = buildLockedPreviewPolicy({
        access: post.access,
        publicState: post.publicState,
        text: post.content ?? "",
        blocks: allBlocks,
        media: allMediaRows.map((item) => ({
          id: item.id,
          url: "",
          type: resolveMediaType(item),
          mimeType: item.mime_type,
          sortOrder: item.sort_order,
        })),
      })

      const selectedMediaRows = post.access.canView
        ? allMediaRows
        : allMediaRows.filter((item) =>
            previewPolicy.previewMedia.some((preview) => preview.id === item.id)
          )

      const media = await Promise.all(
        selectedMediaRows.map(async (item) => {
          const url = await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: safeUserId,
            creatorUserId: resolvedCreatorUserId,
            visibility: post.visibility,
            isSubscribed: post.isSubscribed,
            hasPurchased: post.hasPurchased,
            allowPreview:
              !post.access.canView && previewPolicy.allowPreviewMediaSigning,
          })

          return {
            id: item.id,
            url,
            type: resolveMediaType(item),
            mimeType: item.mime_type,
            sortOrder: item.sort_order,
          }
        })
      )

      const selectedBlocks = post.access.canView
        ? allBlocks
        : previewPolicy.previewBlocks

      const renderReadModel = buildPostRenderReadModel({
        blockRows: selectedBlocks.map((block) => ({
          id: block.id,
          post_id: block.postId,
          type: block.type,
          content: block.content,
          media_id: block.mediaId,
          sort_order: block.sortOrder,
          created_at: block.createdAt,
          editor_state: block.editorState ?? null,
        })),
        mediaItems: media,
      })

      const renderInput = buildPostRenderInput({
        text: post.access.canView ? (post.content ?? "") : previewPolicy.renderTextSeed,
        blocks: renderReadModel.blocks,
        media: renderReadModel.media,
      })

      return {
        id: post.id,
        creatorId: post.creator_id,
        content: post.access.canView
          ? (renderInput.blockText || null)
          : null,
        createdAt: post.created_at,
        renderInput,
        media,
        blocks: post.access.canView ? renderReadModel.blocks : [],
        price: post.price,
        isLocked: post.isLocked,
        lockReason: post.lockReason,
        purchaseEligibility: post.purchaseEligibility,
        likesCount: readPostLikeCount(likeCountMap, post.id),
        isLiked: myLikeSet.has(post.id),
        visibility: post.visibility,
        commentsCount: commentCountMap.get(post.id) ?? 0,
        status: post.status as PostRenderSurfaceItem["status"],
        publishedAt: post.published_at ?? null,
      }
    })
  )
}
