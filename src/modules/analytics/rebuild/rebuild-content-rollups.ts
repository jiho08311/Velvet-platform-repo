import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { upsertContentMetricRollup } from "@/modules/analytics/repositories/content-metric-rollup-repository"

type FeedItemRow = {
  post_id: string
  creator_id: string | null
  published_at: string | null
  created_at: string
  is_feed_visible: boolean | null
}

type CommentRow = {
  id: string
  post_id: string | null
  creator_id?: string | null
  user_id?: string | null
  created_at: string
}

function dayStart(value: string): string {
  const date = new Date(value)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

function dayEnd(value: string): string {
  const date = new Date(value)
  date.setUTCHours(23, 59, 59, 999)
  return date.toISOString()
}

export async function rebuildContentRollups(input?: {
  dryRun?: boolean
  limit?: number
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 5000, 10000))

  const { data: feedItems, error: feedError } = await supabaseAdmin
    .from("canonical_feed_items")
    .select("post_id, creator_id, published_at, created_at, is_feed_visible")
    .eq("is_feed_visible", true)
    .limit(limit)
    .returns<FeedItemRow[]>()

  if (feedError) {
    throw feedError
  }

  const { data: comments, error: commentError } = await supabaseAdmin
    .from("comments")
    .select("id, post_id, created_at")
    .limit(limit)
    .returns<CommentRow[]>()

  if (commentError) {
    throw commentError
  }

  const feedRows = feedItems ?? []
  const commentRows = comments ?? []

  const feedByPost = new Map<string, FeedItemRow>()

  for (const item of feedRows) {
    if (!item.post_id || !item.creator_id) continue
    feedByPost.set(item.post_id, item)
  }

  let upsertedCount = 0
  let skippedCount = 0
  let failedCount = 0

  for (const item of feedRows) {
    if (!item.post_id || !item.creator_id) {
      skippedCount += 1
      continue
    }

    const occurredAt =
      item.published_at ?? item.created_at ?? new Date().toISOString()

    const commentCount = commentRows.filter(
      (comment) => comment.post_id === item.post_id
    ).length

    try {
      if (!input?.dryRun) {
        const { error } = await upsertContentMetricRollup({
          content_id: item.post_id,
          creator_id: item.creator_id,
          period_start: dayStart(occurredAt),
          period_end: dayEnd(occurredAt),
          views: 0,
          likes: 0,
          comments: commentCount,
          engagement_rate: 0,
          source_event_id: null,
          idempotency_key: `content:rebuild:post:${item.post_id}`,
        })

        if (error) throw error
      }

      upsertedCount += 1
    } catch {
      failedCount += 1
    }
  }

  return {
    scannedFeedItemCount: feedRows.length,
    scannedCommentCount: commentRows.length,
    upsertedCount,
    skippedCount,
    failedCount,
  }
}