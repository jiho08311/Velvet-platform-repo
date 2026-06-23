import { findCanonicalPostById } from "@/modules/post/repositories/canonical-post-repository"
import { findPostById } from "@/modules/post/repositories/post-repository"
import { logger } from "@/shared/observability/structured-logger"

export async function shadowReadPostAuthorityRuntime(input: {
  postId: string
  sourceSurface: string
}) {
  const [legacyPost, canonicalPost] = await Promise.all([
    findPostById(input.postId),
    findCanonicalPostById(input.postId),
  ])

  if (!legacyPost || !canonicalPost) {
    logger.warn({
      event: "post.authority_shadow_read_missing_row",
      context: {
        postId: input.postId,
        sourceSurface: input.sourceSurface,
        hasLegacy: Boolean(legacyPost),
        hasCanonical: Boolean(canonicalPost),
      },
    })

    return
  }

  const mismatch = {
    creatorId: legacyPost.creator_id !== canonicalPost.creator_id,
    title: (legacyPost.title ?? null) !== (canonicalPost.title ?? null),
    content: (legacyPost.content ?? null) !== (canonicalPost.content ?? null),
    visibility: legacyPost.visibility !== canonicalPost.visibility,
    price: (legacyPost.price ?? 0) !== canonicalPost.price,
    lifecycleState: legacyPost.status !== canonicalPost.lifecycle_state,
    visibilityState:
      (legacyPost.visibility_status ?? "draft") !== canonicalPost.visibility_state,
    moderationState:
      (legacyPost.moderation_status ?? "pending") !== canonicalPost.moderation_state,
    publishedAt:
      (legacyPost.published_at ?? null) !== (canonicalPost.published_at ?? null),
    deletedAt:
      (legacyPost.deleted_at ?? null) !== (canonicalPost.deleted_at ?? null),
  }

  if (Object.values(mismatch).some(Boolean)) {
    logger.warn({
      event: "post.authority_shadow_read_mismatch",
      context: {
        postId: input.postId,
        sourceSurface: input.sourceSurface,
        mismatch,
      },
    })
  }
}
