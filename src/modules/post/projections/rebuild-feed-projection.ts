import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  recordCanonicalFeedProjectionEvent,
  upsertCanonicalFeedItem,
} from "@/modules/post/repositories/feed-projection-repository"
import { logger } from "@/shared/observability/structured-logger"

type FeedProjectionSurface = "home_feed" | "discovery"

type PostFeedProjectionSourceRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  published_at: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

function isFeedVisible(post: PostFeedProjectionSourceRow) {
  return (
    post.deleted_at == null &&
    post.published_at != null &&
    (post.status === "published" || post.status === "scheduled") &&
    post.visibility_status !== "rejected" &&
    post.moderation_status !== "rejected" &&
    post.moderation_status !== "needs_review"
  )
}

function buildCanonicalFeedItem(input: {
  post: PostFeedProjectionSourceRow
  projectionSurface: FeedProjectionSurface
}) {
  const { post, projectionSurface } = input
  const isVisible = isFeedVisible(post)

return {
  post_id: post.id,
  creator_id: post.creator_id,
  projection_surface: projectionSurface,

  title: post.title,
  content: post.content,

  visibility: post.visibility,
  price: post.price ?? 0,

  status: post.status,
  visibility_status: post.visibility_status,
  moderation_status: post.moderation_status,

  published_at: post.published_at,
  created_at: post.created_at,
  updated_at: post.updated_at ?? post.created_at,
  deleted_at: post.deleted_at,

  feed_visibility_state: isVisible ? "visible" : "hidden",
  is_feed_visible: isVisible,

  source_table: "posts",
  authority_mode: "projection",

  runtime_authoritative: true,
  serving_authoritative: true,
  rollback_safe: true,

  observed_at: new Date().toISOString(),
}
}

export async function rebuildFeedProjection(input?: {
  projectionSurface?: FeedProjectionSurface
  limit?: number
  dryRun?: boolean
}) {
  const projectionSurface = input?.projectionSurface ?? "home_feed"
  const limit = Math.max(1, Math.min(input?.limit ?? 500, 5000))

  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select(
      `
        id,
        creator_id,
        title,
        content,
        visibility,
        price,
        status,
        visibility_status,
        moderation_status,
        published_at,
        created_at,
        updated_at,
        deleted_at
      `
    )
    .not("published_at", "is", null)
    .limit(limit)
    .returns<PostFeedProjectionSourceRow[]>()

  if (error) throw error

  let scannedCount = 0
  let upsertedCount = 0
  let failedCount = 0

  for (const post of posts ?? []) {
    scannedCount += 1

    const row = buildCanonicalFeedItem({
      post,
      projectionSurface,
    })

    try {
      if (!input?.dryRun) {
        const { error: upsertError } = await upsertCanonicalFeedItem({ row })

        if (upsertError) {
          throw upsertError
        }

        await recordCanonicalFeedProjectionEvent({
          row: {
            post_id: post.id,
            projection_surface: projectionSurface,
            event_type: "rebuild_upsert",
            payload: {
              source: "rebuildFeedProjection",
              postId: post.id,
              projectionSurface,
              isFeedVisible: row.is_feed_visible,
            },
            created_at: new Date().toISOString(),
          },
        })
      }

      upsertedCount += 1
    } catch (error) {
      logger.error({
        event: "post.feed_projection_rebuild_failed",
        context: { postId: post.id, projectionSurface },
        error,
      })

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
