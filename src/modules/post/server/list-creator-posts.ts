import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import type { PostPublicState } from "@/modules/post/lib/get-post-public-state"
import {
  filterPublicDiscoveryPostCandidates,
  isEligiblePublicDiscoveryCreator,
} from "@/modules/post/lib/public-discovery-inclusion"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import type { PostBlockEditorState, PostRenderListItem } from "../types"
import { buildPostRenderReadModel } from "./post-render-read-model"
import { buildLockedPreviewPolicy } from "./locked-preview-policy"
import { resolvePostAccessState } from "./resolve-post-access-state"

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  published_at: string | null
  created_at: string
  updated_at: string
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  deleted_at: string | null
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

type MediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file"
  mime_type?: string | null
  status: "processing" | "ready" | "failed"
  sort_order: number
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

type ListCreatorPostsInput = {
  creatorId: string
  userId?: string
  limit?: number
  status?: "draft" | "published" | "archived"
}

type PostWithPublicState = {
  post: PostRow
  publicState: PostPublicState
}

export async function listCreatorPosts({
  creatorId,
  userId,
  limit = 20,
  status,
}: ListCreatorPostsInput): Promise<PostRenderListItem[]> {
  const safeUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId.trim()
      : undefined

  const safeLimit = Math.max(1, Math.min(limit, 100))
  const now = new Date().toISOString()

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
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
    .eq("id", creatorId)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) {
    return []
  }

  const isOwner = !!safeUserId && safeUserId === creator.user_id

  if (
    !isEligiblePublicDiscoveryCreator({
      creator: {
        status: creator.status,
      },
      profile: creator.profiles,
    })
  ) {
    return []
  }

  let query = supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price, published_at, created_at, updated_at, visibility_status, moderation_status, deleted_at"
    )
    .eq("creator_id", creatorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(safeLimit * 3)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.returns<PostRow[]>()

  if (error) {
    throw error
  }

  const posts = filterPublicDiscoveryPostCandidates(data ?? [], now, [
    "published",
  ])
    .map(({ post }) => post)
    .slice(0, safeLimit)

  if (posts.length === 0) {
    return []
  }

  const filteredPosts: Array<
    PostRow & {
      isLocked: boolean
      lockReason: PostRenderListItem["lockReason"]
      isSubscribed: boolean
      hasPurchased: boolean
      purchaseEligibility: PostRenderListItem["purchaseEligibility"]
      access: Awaited<
        ReturnType<typeof resolvePostAccessState>
      >["access"]
      publicState: "published"
    }
  > = []

  for (const post of posts) {
    const resolvedAccessState = await resolvePostAccessState({
      viewerUserId: safeUserId ?? null,
      creatorId: post.creator_id,
      creatorUserId: creator.user_id,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        status: post.status,
        visibility: post.visibility,
        price: post.price,
        publishedAt: post.published_at,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      },
    })

    filteredPosts.push({
      ...post,
      publicState: "published",
      isLocked: resolvedAccessState.access.locked,
      lockReason: resolvedAccessState.access.lockReason,
      isSubscribed: resolvedAccessState.isSubscribed,
      hasPurchased: resolvedAccessState.hasPurchased,
      access: resolvedAccessState.access,
      purchaseEligibility: resolvedAccessState.purchaseEligibility,
    })
  }

  const postIds = filteredPosts.map((post) => post.id)

  const { data: mediaRows, error: mediaError } = await supabaseAdmin
    .from("media")
    .select("id, post_id, storage_path, type, mime_type, status, sort_order")
    .in("post_id", postIds)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (mediaError) {
    throw mediaError
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
    filteredPosts.map(async (post) => {
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
          type: item.type,
          mimeType: item.mime_type,
          sortOrder: item.sort_order,
        })),
      })

      const selectedMediaRows = post.access.canView
        ? allMediaRows
        : allMediaRows.filter((item) =>
            previewPolicy.previewMedia.some((preview) => preview.id === item.id)
          )

      const selectedMedia = await Promise.all(
        selectedMediaRows.map(async (item) => {
          const url = await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: safeUserId,
            creatorUserId: creator.user_id,
            visibility: post.visibility,
            isSubscribed: post.isSubscribed,
            hasPurchased: post.hasPurchased,
            allowPreview:
              !post.access.canView && previewPolicy.allowPreviewMediaSigning,
          })

          return {
            id: item.id,
            url: url ?? "",
            type: item.type,
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
        mediaItems: selectedMedia.map((item) => ({
          id: item.id,
          url: item.url,
          type: item.type,
          mimeType: item.mimeType,
          sortOrder: item.sortOrder,
        })),
      })

      const renderInput = buildPostRenderInput({
        text: post.access.canView ? (post.content ?? "") : previewPolicy.renderTextSeed,
        blocks: renderReadModel.blocks,
        media: renderReadModel.media,
      })

      return {
        id: post.id,
        creatorId: post.creator_id,
        content: post.access.canView ? (renderInput.blockText || null) : null,
        status: post.status,
        visibility: post.visibility,
        price: post.price,
        isLocked: post.isLocked,
        lockReason: post.lockReason,
        purchaseEligibility: post.purchaseEligibility,
        publishedAt: post.published_at ?? null,
        createdAt: post.created_at,
        media: selectedMedia.map((item) => ({
          id: item.id,
          url: item.url,
          type: item.type,
          mimeType: item.mimeType,
          sortOrder: item.sortOrder,
        })),
        renderInput,
      }
    })
  )
}
