import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type {
  PostBlock,
  PostPurchaseEligibility,
  PostRenderInput,
} from "../types"
import type { LockedPreviewRenderableBlock } from "./locked-preview-policy"
import { getPostBlocks } from "@/modules/post/server/get-post-blocks"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { buildLockedPreviewPolicy } from "./locked-preview-policy"
import { resolvePostAccessState } from "./resolve-post-access-state"
import {
  getPublicDiscoveryPostState,
  isEligiblePublicDiscoveryCreator,
} from "@/modules/post/lib/public-discovery-inclusion"
import { normalizeLikeCount } from "@/shared/lib/like-interaction-result"

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  created_at: string
  published_at: string | null
  deleted_at?: string | null
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

type MediaRow = {
  id: string
  post_id: string
  type: "image" | "video" | "audio" | "file"
  storage_path: string
  mime_type: string | null
  sort_order: number
  status: "processing" | "ready" | "failed"
}

export type PostDetail = {
  id: string
  creatorId: string
  creatorUserId: string
  creator: {
    username: string
    displayName: string | null
  }
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
  createdAt: string
  publishedAt: string | null
  isLocked: boolean
  lockReason: "none" | "subscription" | "purchase"
  purchaseEligibility: PostPurchaseEligibility
  likesCount: number
  commentsCount: number
  media: {
    id: string
    postId: string
    type: "image" | "video" | "audio" | "file"
    url: string
    mimeType: string | null
    sortOrder: number
  }[]
  blocks?: PostBlock[]
  renderInput: PostRenderInput
}

function sortBlocks(
  blocks: LockedPreviewRenderableBlock[]
): LockedPreviewRenderableBlock[] {
  return [...blocks].sort((a, b) => a.sortOrder - b.sortOrder)
}

function sortMediaRows(rows: MediaRow[]): MediaRow[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order)
}

export async function getPostById(
  postId: string,
  viewerUserId?: string | null
): Promise<PostDetail | null> {
  const resolvedPostId = postId.trim()
  const resolvedViewerUserId =
    typeof viewerUserId === "string" && viewerUserId.trim().length > 0
      ? viewerUserId.trim()
      : null

  if (!resolvedPostId) {
    throw new Error("postId is required")
  }

  const { data: post, error: postError } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, visibility, price, status, visibility_status, moderation_status, created_at, published_at, deleted_at"
    )
    .eq("id", resolvedPostId)
    .is("deleted_at", null)
    .maybeSingle<PostRow>()

  if (postError) {
    throw postError
  }

  if (!post) {
    return null
  }

  const { data: creator, error: creatorError } = await supabaseAdmin
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
    .eq("id", post.creator_id)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) {
    throw new Error("Creator not found")
  }

  const isOwner =
    resolvedViewerUserId !== null &&
    creator.user_id === resolvedViewerUserId

  const now = new Date().toISOString()

  const publicState = getPublicDiscoveryPostState(post, now)

  const isVisibleCreator = isEligiblePublicDiscoveryCreator({
    creator: {
      status: creator.status,
    },
    profile: creator.profiles,
  })

  if (!isOwner) {
    if (!isVisibleCreator) {
      return null
    }

    if (publicState !== "published") {
      return null
    }
  }

  const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
    supabaseAdmin
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id),
    supabaseAdmin
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id)
      .is("deleted_at", null),
  ])

  const resolvedLikesCount = normalizeLikeCount(likesCount)

  const {
    isSubscribed,
    hasPurchased,
    access,
    purchaseEligibility,
  } = await resolvePostAccessState({
    viewerUserId: resolvedViewerUserId,
    creatorId: post.creator_id,
    creatorUserId: creator.user_id,
    post: {
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status,
      visibility: post.visibility,
      price: post.price ?? 0,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.created_at,
    },
  })

  const [allBlockRows, allMediaRows] = await Promise.all([
    getPostBlocks(post.id),
    supabaseAdmin
      .from("media")
      .select("id, post_id, type, storage_path, mime_type, sort_order, status")
      .eq("post_id", post.id)
      .in("status", ["processing", "ready"])
      .order("sort_order", { ascending: true })
      .returns<MediaRow[]>(),
  ])

  const sortedBlocks = sortBlocks(
    allBlockRows.map((block): LockedPreviewRenderableBlock => ({
      id: block.id,
      postId: block.postId,
      type: block.type === "carousel" ? "text" : block.type,
      content: block.content,
      mediaId: block.mediaId,
      sortOrder: block.sortOrder,
      createdAt: block.createdAt,
      editorState: block.editorState ?? null,
    }))
  )

  const sortedMediaRows = sortMediaRows(allMediaRows.data ?? [])

  const previewPolicy = buildLockedPreviewPolicy({
    access,
    publicState,
    text: post.content ?? "",
    blocks: sortedBlocks,
    media: sortedMediaRows.map((item) => ({
      id: item.id,
      url: "",
      type: item.type,
      mimeType: item.mime_type,
      sortOrder: item.sort_order,
    })),
  })

  const selectedMediaRows = access.canView
    ? sortedMediaRows
    : sortedMediaRows.filter((item) =>
        previewPolicy.previewMedia.some((preview) => preview.id === item.id)
      )

  const selectedMedia = await Promise.all(
    selectedMediaRows.map(async (item) => {
      const url = await createMediaSignedUrl({
        storagePath: item.storage_path,
        viewerUserId: resolvedViewerUserId,
        creatorUserId: creator.user_id,
        visibility: post.visibility,
        isSubscribed,
        hasPurchased,
        allowPreview: !access.canView && previewPolicy.allowPreviewMediaSigning,
      })

      return {
        id: item.id,
        postId: item.post_id,
        type: item.type,
        url,
        mimeType: item.mime_type,
        sortOrder: item.sort_order,
      }
    })
  )

  const selectedBlocks = access.canView
    ? sortedBlocks
    : previewPolicy.previewBlocks

  const renderInput = buildPostRenderInput({
    text: access.canView ? (post.content ?? "") : previewPolicy.renderTextSeed,
    blocks: selectedBlocks,
    media: selectedMedia.map((item) => ({
      id: item.id,
      url: item.url,
      type: item.type,
      mimeType: item.mimeType,
      sortOrder: item.sortOrder,
    })),
  })

  return {
    id: post.id,
    creatorId: post.creator_id,
    creatorUserId: creator.user_id,
    creator: {
      username: creator.username,
      displayName: creator.display_name,
    },
    title: post.title,
    content: access.canView ? (renderInput.blockText || null) : null,
    visibility: post.visibility,
    price: post.price,
    status: post.status,
    createdAt: post.created_at,
    publishedAt: post.published_at,
    isLocked: access.locked,
    lockReason: access.lockReason,
    purchaseEligibility,
    likesCount: resolvedLikesCount,
    commentsCount: commentsCount ?? 0,
    media: access.canView ? selectedMedia : [],
    blocks: access.canView ? selectedBlocks : [],
    renderInput,
  }
}
