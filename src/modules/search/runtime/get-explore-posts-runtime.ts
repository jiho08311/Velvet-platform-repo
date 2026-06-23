import { listContentPublicCardsByPostIds } from "@/modules/content/public/content-public-card-read-model"
import { resolveContentServingAuthorityRuntime } from "@/modules/post/public/content-serving-authority-runtime"
import {
  filterPublicDiscoveryPostCandidates,
  type PublicDiscoveryPostEligibilityInput,
} from "@/modules/search/contracts/discovery-eligibility-contract"
import type { DiscoveryPostLinkItem } from "@/modules/search/discovery-contract"
import {
  findPublicCreatorCardsByCreatorIds,
  type CreatorPublicCardSearchRow,
} from "@/modules/search/repositories/creator-public-card-search-repository"
import { listVisibleSearchDocuments } from "@/modules/search/repositories/search-document-repository"

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

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items]

  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }

  return next
}

function mapMediaPreview(
  postId: string,
  mediaPreview: unknown[]
): DiscoveryPostLinkItem["media"] {
  return mediaPreview
    .filter((item): item is Record<string, unknown> => {
      return item != null && typeof item === "object"
    })
    .map((item, index) => {
      const type = item.type === "video" ? "video" : "image"

      const url =
        typeof item.url === "string"
          ? item.url
          : typeof item.storagePath === "string"
            ? item.storagePath
            : typeof item.storage_path === "string"
              ? item.storage_path
              : ""

      return {
        id: typeof item.id === "string" ? item.id : `${postId}-media-${index}`,
        postId,
        type,
        url,
        mimeType:
          typeof item.mimeType === "string"
            ? item.mimeType
            : typeof item.mime_type === "string"
              ? item.mime_type
              : null,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
      }
    })
}

function mapBlockPreview(
  postId: string,
  createdAt: string,
  blockPreview: unknown[]
): DiscoveryPostLinkItem["blocks"] {
  return blockPreview
    .filter((item): item is Record<string, unknown> => {
      return item != null && typeof item === "object"
    })
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `${postId}-block-${index}`,
      postId,
      type:
        item.type === "image" ||
        item.type === "video" ||
        item.type === "audio" ||
        item.type === "file"
          ? item.type
          : "text",
      content: typeof item.content === "string" ? item.content : null,
      mediaId:
        typeof item.mediaId === "string"
          ? item.mediaId
          : typeof item.media_id === "string"
            ? item.media_id
            : null,
      sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
      createdAt,
      editorState: null,
    }))
}

function mapCreatorCardsById(
  creators: CreatorPublicCardSearchRow[]
): Map<string, CreatorPublicCardSearchRow> {
  return new Map(creators.map((creator) => [creator.creator_id, creator]))
}

export async function getExplorePostsRuntime(
  limit = 24
): Promise<DiscoveryPostLinkItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 60))
  const fetchSize = Math.max(safeLimit * 3, 60)
  const now = new Date().toISOString()

  const servingAuthority = await resolveContentServingAuthorityRuntime({
    runtimeSurface: "search.getExplorePostsRuntime",
    authoritySurface: "discovery_projection",
  })

  void servingAuthority

  const allowedPostStates: PublicDiscoveryPostEligibilityInput["allowedStates"] =
    ["published"]

  const searchDocuments = await listVisibleSearchDocuments({
    limit: fetchSize,
    documentType: "post",
  })

  const postRows: PostRow[] = searchDocuments
    .filter((doc) => doc.creator_id)
    .map((doc) => ({
      id: doc.source_id,
      creator_id: doc.creator_id!,
      created_at: doc.source_updated_at ?? doc.indexed_at,
      published_at: doc.source_updated_at ?? doc.indexed_at,
      content: doc.body,
      status: "published",
      visibility: "public",
      visibility_status: "published",
      moderation_status: "approved",
      deleted_at: null,
    }))

  const posts = filterPublicDiscoveryPostCandidates(
    postRows,
    now,
    allowedPostStates
  ).map(({ post }) => post)

  if (posts.length === 0) return []

  const creatorIds = Array.from(new Set(posts.map((post) => post.creator_id)))
  const creatorRows = await findPublicCreatorCardsByCreatorIds(creatorIds)
  const creatorMap = mapCreatorCardsById(creatorRows)

  const visiblePosts = posts.filter((post) => creatorMap.has(post.creator_id))

  if (visiblePosts.length === 0) return []

  const visiblePostIds = visiblePosts.map((post) => post.id)
  const contentCards = await listContentPublicCardsByPostIds(visiblePostIds)
  const contentCardMap = new Map(
    contentCards.map((card) => [card.post_id, card])
  )

  const postsWithCards = visiblePosts.filter((post) =>
    contentCardMap.has(post.id)
  )

  if (postsWithCards.length === 0) return []

  const shuffledPosts = shuffleArray(postsWithCards).slice(0, safeLimit)

  return shuffledPosts.map((post) => {
    const creator = creatorMap.get(post.creator_id)
    const card = contentCardMap.get(post.id)

    if (!creator || !card) {
      throw new Error("Invalid explore post projection data")
    }

    const mediaItems = mapMediaPreview(
      post.id,
      Array.isArray(card.media_preview) ? card.media_preview : []
    )

    const createdAt = card.published_at ?? card.created_at

    const blockItems = mapBlockPreview(
      post.id,
      createdAt,
      Array.isArray(card.block_preview) ? card.block_preview : []
    )

    return {
      id: post.id,
      postId: post.id,
      creatorId: creator.creator_id,
      creatorUserId: creator.user_id,
      creatorUsername: creator.username ?? creator.creator_id,
      creatorDisplayName: creator.display_name,
      imageUrl: mediaItems[0]?.url ?? "",
      mediaCount: card.media_count,
      mediaType: mediaItems[0]?.type === "video" ? "video" : "image",
      createdAt,
      text: card.render_text_seed ?? card.content ?? post.content ?? null,
      likesCount: 0,
      commentsCount: 0,
      viewerHasLiked: false,
      isLiked: false,
      media: mediaItems,
      blocks: blockItems,
    }
  })
}
