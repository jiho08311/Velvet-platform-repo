import { normalizeLikeCount } from "@/shared/lib/like-interaction-result"

export type CommentItemProfile = {
  username: string | null
  avatar_url: string | null
}

export type CommentItem = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  likes_count: number
  is_liked: boolean
  profiles: CommentItemProfile
}

export type CommentRow = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
}

export function createCommentItem(input: {
  comment: CommentRow
  profile?: Partial<CommentItemProfile> | null
  likesCount?: number | null
  isLiked?: boolean | null
}): CommentItem {
  return {
    id: input.comment.id,
    post_id: input.comment.post_id,
    user_id: input.comment.user_id,
    content: input.comment.content,
    created_at: input.comment.created_at,
    likes_count: normalizeLikeCount(input.likesCount),
    is_liked: input.isLiked ?? false,
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
