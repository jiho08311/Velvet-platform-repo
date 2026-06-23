import {
  filterPublicDiscoveryPostCandidates,
  isEligiblePublicDiscoveryCreator,
} from "@/modules/post/policies/public-discovery-inclusion"
import {
  findListCreatorPostBlocksByPostIds,
  type ListCreatorPostBlockRow,
} from "@/modules/post/repositories/post-block-repository"
import {
  findReadyPostMediaRowsByPostIds,
  type PostMediaRow,
} from "@/modules/media/public/get-post-media-bindings"
import {
  findCreatorForListCreatorPosts,
  findPostRowsForCreatorPostList,
  type ListCreatorPostsPostRow,
} from "@/modules/post/repositories/post-repository"
import type { PostRenderListItem } from "@/modules/post/types"
import { resolvePostAccessEntitlement as resolvePostAccessState } from "@/modules/post/runtime/resolve-post-access-entitlement"
import { assemblePostProjectionRuntime } from "@/modules/post/runtime/post-projection-runtime"

export type ListCreatorPostsInput = {
  creatorId: string
  userId?: string
  limit?: number
  status?: "draft" | "published" | "archived"
}

function mapListCreatorPostBlocksForRuntime(
  blocks: ListCreatorPostBlockRow[],
) {
  return blocks.map((block) => ({
    id: block.id,
    postId: block.post_id,
    type: block.type,
    content: block.content,
    mediaId: block.media_id,
    sortOrder: block.sort_order,
    createdAt: block.created_at,
    editorState: block.editor_state ?? null,
  }))
}

export async function listCreatorPostsRuntime({
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

  const assembledItems = await Promise.all(
    filteredPosts.map(async (post) => {
      const allBlocks = mapListCreatorPostBlocksForRuntime(
        blocksMap.get(post.id) ?? [],
      )
      const allMediaRows = mediaMap.get(post.id) ?? []

      const projectionRuntime = await assemblePostProjectionRuntime({
        sourceFile: "src/modules/post/runtime/list-creator-posts-runtime.ts",
        sourceSymbol: "listCreatorPosts",
        surface: "creator_post_list_projection",
        post: {
          id: post.id,
          creatorId: post.creator_id,
          content: post.content,
          visibility: post.visibility,
        },
        access: post.access,
        publicState: post.publicState,
        viewerUserId: safeUserId ?? null,
        creatorUserId: creator.user_id,
        isSubscribed: post.isSubscribed,
        hasPurchased: post.hasPurchased,
        blocks: allBlocks,
        mediaRows: allMediaRows,
        correlationKeys: {
          postId: post.id,
          creatorId: post.creator_id,
          viewerUserId: safeUserId ?? null,
        },
      })

      const item: PostRenderListItem = {
        id: post.id,
        creatorId: post.creator_id,
        content: post.access.canView
          ? projectionRuntime.renderInput.blockText || null
          : null,
        status: post.status,
        visibility: post.visibility,
        price: post.price,
        canView: post.access.canView,
        isLocked: post.isLocked,
        lockReason: post.lockReason,
        commerce: post.commerce,
        publishedAt: post.published_at ?? null,
        createdAt: post.created_at,
        media: projectionRuntime.selectedMedia.map((media) => ({
          id: media.id,
          url: media.url,
          type: media.type,
          mimeType: media.mimeType,
          sortOrder: media.sortOrder ?? 0,
        })),
        renderInput: projectionRuntime.renderInput,
      }

      return {
        item,
        projectionRuntime,
      }
    }),
  )

  const legacyResponse = assembledItems.map(({ item }) => item)

  return legacyResponse
}
