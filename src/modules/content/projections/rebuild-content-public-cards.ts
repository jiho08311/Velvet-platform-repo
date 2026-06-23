import { listCanonicalFeedItems } from "@/modules/post/public/canonical-feed-item-read-model"
import { getReadyPostMediaRowsByPostIds } from "@/modules/media/public/get-ready-post-media"
import { listFeedProjectionBlocksByPostIds } from "@/modules/post/public/list-feed-projection-blocks"
import { buildContentPublicCard } from "./build-content-public-card"
import { upsertContentPublicCard } from "@/modules/content/repositories/content-public-card-repository"

type FeedItemRow = {
  post_id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: string
  status: string
  price: number | null
  published_at: string | null
  created_at: string
  updated_at: string | null
  visibility_status: string | null
  moderation_status: string | null
  feed_visibility_state: string | null
  is_feed_visible: boolean
  deleted_at: string | null
}

export async function rebuildContentPublicCards(input?: {
  projectionSurface?: string
  limit?: number
  dryRun?: boolean
}) {
  const projectionSurface = input?.projectionSurface ?? "home_feed"
  const limit = Math.max(1, Math.min(input?.limit ?? 500, 5000))

  const { data, error } = await listCanonicalFeedItems({
    projectionSurface,
    limit,
  })

  if (error) throw error

  const feedItems = (data ?? []) as FeedItemRow[]
  const postIds = feedItems.map((row) => row.post_id)

  const [mediaRows, blockRows] = await Promise.all([
    getReadyPostMediaRowsByPostIds(postIds),
    listFeedProjectionBlocksByPostIds(postIds),
  ])

  const mediaByPostId = new Map<string, typeof mediaRows>()
  for (const row of mediaRows) {
    const current = mediaByPostId.get(row.post_id) ?? []
    current.push(row)
    mediaByPostId.set(row.post_id, current)
  }

  const blocksByPostId = new Map<string, typeof blockRows>()
  for (const row of blockRows) {
    const current = blocksByPostId.get(row.postId) ?? []
    current.push(row)
    blocksByPostId.set(row.postId, current)
  }

  let scannedCount = 0
  let upsertedCount = 0
  let failedCount = 0

  for (const feedItem of feedItems) {
    scannedCount += 1

    try {
      const card = buildContentPublicCard({
        feedItem,
        mediaRows: mediaByPostId.get(feedItem.post_id) ?? [],
        blockRows: blocksByPostId.get(feedItem.post_id) ?? [],
      })

      if (!input?.dryRun) {
        const { error: upsertError } = await upsertContentPublicCard(card)
        if (upsertError) throw upsertError
      }

      upsertedCount += 1
    } catch {
      failedCount += 1
    }
  }

  return {
    projectionSurface,
    scannedCount,
    upsertedCount,
    failedCount,
  }
}
