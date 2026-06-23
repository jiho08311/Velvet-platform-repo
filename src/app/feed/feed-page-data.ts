import { getHomeFeed } from "@/modules/feed/public/get-home-feed"
import { getRecommendedCreators } from "@/modules/search/public/get-recommended-creators"
import { getStories } from "@/modules/story/public/get-stories"

import { readVerifiedFeedSession } from "./feed-page-auth"
import { loadSignedInFeedData } from "./feed-page-signed-in-data"

type FeedMediaItem = {
  id: string
  url: string
  type: "image" | "video" | "audio" | "file"
}

function normalizeMedia(item: unknown): FeedMediaItem[] {
  if (!item || typeof item !== "object") {
    return []
  }

  const maybeItem = item as {
    id?: string
    media?: Array<{
      id?: string
      url?: string
      type?: "image" | "video" | "audio" | "file"
    }>
    mediaThumbnailUrls?: string[]
  }

  if (Array.isArray(maybeItem.media)) {
    return maybeItem.media
      .filter(
        (m): m is {
          id?: string
          url: string
          type: "image" | "video" | "audio" | "file"
        } =>
          !!m &&
          typeof m.url === "string" &&
          (m.type === "image" ||
            m.type === "video" ||
            m.type === "audio" ||
            m.type === "file")
      )
      .map((m, index) => ({
        id: m.id ?? `${maybeItem.id ?? "post"}-media-${index}`,
        url: m.url,
        type: m.type,
      }))
  }

  if (Array.isArray(maybeItem.mediaThumbnailUrls)) {
    return maybeItem.mediaThumbnailUrls.map((url, index) => ({
      id: `${maybeItem.id ?? "post"}-thumb-${index}`,
      url,
      type: "image" as const,
    }))
  }

  return []
}

function normalizePrice(item: unknown): number | undefined {
  if (!item || typeof item !== "object") {
    return undefined
  }

  const maybeItem = item as {
    price?: number
  }

  return typeof maybeItem.price === "number" ? maybeItem.price : undefined
}

export async function loadFeedPageData() {
  const nextPath = "/feed"
  const session = await readVerifiedFeedSession(nextPath)

  const feedData = session?.userId
    ? await loadSignedInFeedData({ userId: session.userId, nextPath })
    : await loadAnonymousFeedData()

  const { currentCreatorId, feed, readStateMap, recommendedCreators, stories } =
    feedData

  return {
    session,
    currentCreatorId,
    readStateMap,
    recommendedCreators,
    stories,
    feed,
    initialFeedPosts: feed.items.map((item) => ({
      id: item.id,
      postId: item.id,
      creatorId: item.creatorId,
      creatorUserId: item.creatorUserId,
      currentUserId: session?.userId ?? undefined,
      text: item.text,
      createdAt: item.createdAt,
      renderInput: item.renderInput,
      status: item.status,
      publishedAt: item.publishedAt ?? null,
      media: normalizeMedia(item),
      blocks:
        "blocks" in item && Array.isArray(item.blocks)
          ? item.blocks.map((block) => ({
              id: block.id,
              postId: block.postId,
              type: block.type,
              content: block.content,
              mediaId: block.mediaId,
              sortOrder: block.sortOrder,
              createdAt: block.createdAt,
              editorState:
                "editorState" in block ? block.editorState ?? null : null,
            }))
          : [],
      canView: item.canView,
      isLocked: item.isLocked,
      lockReason: item.lockReason,
      commerce: item.commerce,
      price: normalizePrice(item),
      commentsCount: item.commentsCount,
      likesCount: item.likesCount,
      viewerHasLiked: item.viewerHasLiked,
      isLiked: item.isLiked,
      creator: item.creator,
    })),
  }
}

async function loadAnonymousFeedData() {
  const [feed, recommendedCreators, stories] = await Promise.all([
        getHomeFeed({ limit: 10 }),
        getRecommendedCreators({ limit: 3 }),
        getStories(),
      ])

  return {
    currentCreatorId: undefined,
    feed,
    readStateMap: {},
    recommendedCreators,
    stories,
  }
}
