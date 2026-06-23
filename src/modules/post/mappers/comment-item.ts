import {
  createCommentLikeCompatibilityFields,
  readViewerHasLikedFromCompatibility,
} from "@/shared/lib/like-interaction-result"
import type { CommentRow } from "@/modules/post/types"

export type { CommentRow } from "@/modules/post/types"

export type CommentItemProfile = {
  username: string | null
  avatar_url: string | null
}


/**
 * Current comment item render contract for comment consumers.
 *
 * This compatibility shape is consumed by PostCard and
 * SearchExploreCommentsDrawer. Keep legacy snake_case fields until all
 * comment consumers are explicitly migrated to a new view model.
 *
 * Legacy compatibility fields intentionally kept:
 * - post_id
 * - user_id
 * - created_at
 * - likes_count
 * - is_liked
 * - profiles.avatar_url
 */


/**
 * Current comment item render contract for comment consumers.
 *
 * This compatibility shape is consumed by PostCard and
 * SearchExploreCommentsDrawer. Keep legacy snake_case fields until all
 * comment consumers are explicitly migrated to the CommentItemViewModel name.
 *
 * Legacy compatibility fields intentionally kept:
 * - post_id
 * - user_id
 * - created_at
 * - likes_count
 * - is_liked
 * - profiles.avatar_url
 */
export type CommentItemViewModel = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  likes_count: number
  is_liked: boolean
  canDelete?: boolean
  profiles: CommentItemProfile
}

/**
 * Backward-compatible alias for existing comment consumers.
 * Do not remove until PostCard and SearchExploreCommentsDrawer imports are migrated.
 */
export type CommentItem = CommentItemViewModel




export function createCommentItem(input: {
  comment: CommentRow
  profile?: Partial<CommentItemProfile> | null
  likesCount?: number | null
  viewerHasLiked?: boolean | null
  isLiked?: boolean | null
  canDelete?: boolean | null
}): CommentItem {
  const likeCompatibilityFields = createCommentLikeCompatibilityFields({
    likesCount: input.likesCount,
    viewerHasLiked: readViewerHasLikedFromCompatibility(input),
  })

  return {
    id: input.comment.id,
    canDelete: input.canDelete === true,
    post_id: input.comment.post_id,
    user_id: input.comment.user_id,
    content: input.comment.content,
    created_at: input.comment.created_at,
    ...likeCompatibilityFields,
    profiles: {
      username: input.profile?.username ?? null,
      avatar_url: input.profile?.avatar_url ?? null,
    },
  }
}

export function isCommentItem(value: unknown): value is CommentItem {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<CommentItem>

  return (
    typeof candidate.id === "string" &&
    typeof candidate.post_id === "string" &&
    typeof candidate.user_id === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.created_at === "string" &&
    typeof candidate.likes_count === "number" &&
    typeof candidate.is_liked === "boolean" &&
    Boolean(candidate.profiles) &&
    typeof candidate.profiles?.username !== "undefined" &&
    typeof candidate.profiles?.avatar_url !== "undefined"
  )
}
