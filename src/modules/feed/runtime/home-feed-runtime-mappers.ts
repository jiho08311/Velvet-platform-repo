import { getBlockedPostCommerceState } from "@/modules/post/public/get-post-commerce-cta-decision"
import type { CreatorPublicCardSearchRow } from "@/modules/search/public/creator-public-card-read-model"
import type { PostBlock, PostCommerceState } from "@/modules/post/types"
import type {
  HomeFeedMediaRow,
  HomeFeedPostRow,
  RuntimePostBlock,
} from "./home-feed-runtime-types"

export function isRuntimePostBlock(
  block: PostBlock
): block is RuntimePostBlock {
  return (
    block.type === "text" ||
    block.type === "image" ||
    block.type === "video" ||
    block.type === "audio" ||
    block.type === "file"
  )
}

export function getPublicFeedCommerceState(): PostCommerceState {
  return getBlockedPostCommerceState({
    blockingReason: "not_paid_post",
    hasPurchased: false,
    isSubscribed: false,
  })
}

export function mapPostBlocksForRender(post: HomeFeedPostRow): PostBlock[] {
  return [...(post.post_blocks ?? [])]
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
}

export function mapCreatorCardsById(
  creators: CreatorPublicCardSearchRow[]
): Map<string, CreatorPublicCardSearchRow> {
  return new Map(creators.map((creator) => [creator.creator_id, creator]))
}

export function mapHomeFeedMediaByPostId(
  mediaRows: HomeFeedMediaRow[] | null | undefined
): Map<string, HomeFeedMediaRow[]> {
  const mediaMap = new Map<string, HomeFeedMediaRow[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  return mediaMap
}

export function resolveProjectedFeedAccess(input: {
  post: HomeFeedPostRow
  entitlementProjectionObserved: boolean
}) {
  if (input.post.visibility === "public") {
    return {
      canView: true,
      isLocked: false,
      lockReason: "none" as const,
    }
  }

  if (input.entitlementProjectionObserved) {
    return {
      canView: true,
      isLocked: false,
      lockReason: "none" as const,
    }
  }

  return {
    canView: false,
    isLocked: true,
    lockReason:
      input.post.visibility === "paid"
        ? ("purchase" as const)
        : ("subscription" as const),
  }
}
