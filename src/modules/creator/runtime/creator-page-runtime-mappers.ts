import { isModerationApprovedForPublicConsumption } from "@/modules/moderation/public/moderation-outcome-policy"
import {
  filterPublicDiscoveryPostCandidates,
  type PublicDiscoveryPostEligibilityInput,
} from "@/modules/post/public/public-discovery-inclusion"
import type { CreatorPublicPostReadModel } from "@/modules/post/public/list-creator-public-posts"
import type {
  CreatorPageBlockRow,
  CreatorPageMediaRow,
  CreatorPagePostRow,
} from "./creator-page-runtime-types"

function isCreatorPagePaidTeaser(post: CreatorPagePostRow): boolean {
  return (
    post.visibility === "paid" &&
    post.status === "published" &&
    post.visibility_status === "published" &&
    isModerationApprovedForPublicConsumption(post.moderation_status) &&
    !post.deleted_at
  )
}

export function mapCreatorPublicPostsForRuntime(
  posts: CreatorPublicPostReadModel[]
): CreatorPagePostRow[] {
  return posts.map((post) => ({
    id: post.id,
    creator_id: post.creatorId,
    content: post.content,
    visibility: post.visibility,
    price: post.price,
    status: post.status as CreatorPagePostRow["status"],
    created_at: post.createdAt,
    published_at: post.publishedAt ?? null,
    visibility_status:
      post.visibilityStatus as CreatorPagePostRow["visibility_status"],
    moderation_status:
      post.moderationStatus as CreatorPagePostRow["moderation_status"],
    deleted_at: post.deletedAt ?? null,
  }))
}

export function filterCreatorPageVisiblePosts(
  posts: CreatorPagePostRow[],
  now: string
): CreatorPagePostRow[] {
  const canonicalPosts = filterPublicDiscoveryPostCandidates(
    posts,
    now,
    [
      "published",
      "upcoming",
    ] satisfies PublicDiscoveryPostEligibilityInput["allowedStates"]
  ).map(({ post }) => post)

  const canonicalPostIds = new Set(canonicalPosts.map((post) => post.id))
  const paidTeaserPosts = posts.filter(
    (post) => !canonicalPostIds.has(post.id) && isCreatorPagePaidTeaser(post)
  )

  return [...canonicalPosts, ...paidTeaserPosts]
}

export function mapCreatorPageBlocks(blocks: CreatorPageBlockRow[]) {
  return blocks.map((block) => ({
    id: block.id,
    postId: block.postId,
    type: block.type,
    content: block.content,
    mediaId: block.mediaId,
    sortOrder: block.sortOrder,
    createdAt: block.createdAt,
    editorState: block.editorState ?? null,
  }))
}

export function mapCreatorPageMediaByPostId(
  mediaRows: CreatorPageMediaRow[] | null | undefined
): Map<string, CreatorPageMediaRow[]> {
  const mediaMap = new Map<string, CreatorPageMediaRow[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  return mediaMap
}

export function mapCreatorPageBlocksByPostId(
  blockRows: CreatorPageBlockRow[] | null | undefined
): Map<string, CreatorPageBlockRow[]> {
  const blocksMap = new Map<string, CreatorPageBlockRow[]>()

  for (const block of blockRows ?? []) {
    const current = blocksMap.get(block.postId) ?? []
    current.push(block)
    blocksMap.set(block.postId, current)
  }

  return blocksMap
}
