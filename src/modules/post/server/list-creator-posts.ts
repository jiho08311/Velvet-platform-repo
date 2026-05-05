import { createMediaSignedUrl } from "@/modules/media/public/create-media-signed-url"
import {
  filterPublicDiscoveryPostCandidates,
  isEligiblePublicDiscoveryCreator,
} from "@/modules/post/lib/public-discovery-inclusion"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import {
  findListCreatorPostBlocksByPostIds,
  type ListCreatorPostBlockRow,
} from "../repositories/post-block-repository"
import {
  findReadyPostMediaRowsByPostIds,
  type PostMediaRow,
} from "../repositories/post-media-repository"
import {
  findCreatorForListCreatorPosts,
  findPostRowsForCreatorPostList,
  type ListCreatorPostsPostRow,
} from "../repositories/post-repository"
import type { PostRenderListItem } from "../types"
import { buildPostRenderReadModel } from "./post-render-read-model"
import { buildLockedPreviewPolicy } from "./locked-preview-policy"
import { resolvePostAccessState } from "./resolve-post-access-state"

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
}: ListCreatorPostsInput): Promise<PostRenderListItem[]> {
  const safeUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId.trim()
      : undefined

  const safeLimit = Math.max(1, Math.min(limit, 100))
  const now = new Date().toISOString()

  const creator = await findCreatorForListCreatorPosts(creatorId)

  if (!creator) {
    return []
  }

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

  const rows = await findPostRowsForCreatorPostList({
    creatorId,
    status,
    limit: safeLimit * 3,
  })

  const posts = filterPublicDiscoveryPostCandidates(rows, now, [
    "published",
  ])
    .map(({ post }) => post)
    .slice(0, safeLimit)

  if (posts.length === 0) {
    return []
  }

  const filteredPosts: Array<
    ListCreatorPostsPostRow & {
      isLocked: boolean
      lockReason: PostRenderListItem["lockReason"]
      isSubscribed: boolean
      hasPurchased: boolean
      commerce: Awaited<
        ReturnType<typeof resolvePostAccessState>
      >["commerce"]
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
      isLocked: resolvedAccessState.isLocked,
      lockReason: resolvedAccessState.lockReason,
      isSubscribed: resolvedAccessState.isSubscribed,
      hasPurchased: resolvedAccessState.hasPurchased,
      commerce: resolvedAccessState.commerce,
      access: resolvedAccessState.access,
    })
  }

  const postIds = filteredPosts.map((post) => post.id)

  const mediaRows = await findReadyPostMediaRowsByPostIds(postIds)
  const blockRows = await findListCreatorPostBlocksByPostIds(postIds)

  const mediaMap = new Map<string, PostMediaRow[]>()

  for (const media of mediaRows) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  const blocksMap = new Map<string, ListCreatorPostBlockRow[]>()

  for (const block of blockRows) {
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
            canView: post.access.canView,
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
        canView: post.access.canView,
        isLocked: post.isLocked,
        lockReason: post.lockReason,
        commerce: post.commerce,
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
