export type LikeInteractionTargetType = "post" | "comment"

export type LikeInteractionResult = {
  targetType: LikeInteractionTargetType
  targetId: string
  viewerHasLiked: boolean
  likesCount: number
}

export type CanonicalLikeState = Pick<
  LikeInteractionResult,
  "likesCount" | "viewerHasLiked"
>

export type PostLikeCompatibilityFields = {
  isLiked: boolean
}

export type CommentLikeCompatibilityFields = {
  likes_count: number
  is_liked: boolean
}

export function isLikeInteractionTargetType(
  value: unknown
): value is LikeInteractionTargetType {
  return value === "post" || value === "comment"
}

export function normalizeLikeCount(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return 0
  }

  return value
}

export function incrementLikeCountMap(
  countMap: Map<string, number>,
  targetId: string
): void {
  countMap.set(targetId, normalizeLikeCount(countMap.get(targetId)) + 1)
}

export function readLikeCountFromMap(
  countMap: Map<string, number>,
  targetId: string
): number {
  return normalizeLikeCount(countMap.get(targetId))
}

export function createLikeInteractionResult(input: {
  targetType: LikeInteractionTargetType
  targetId: string
  viewerHasLiked: boolean
  likesCount: number | null | undefined
}): LikeInteractionResult {
  return {
    targetType: input.targetType,
    targetId: input.targetId,
    viewerHasLiked: input.viewerHasLiked,
    likesCount: normalizeLikeCount(input.likesCount),
  }
}

export function createPostLikeCompatibilityFields(
  likeState: CanonicalLikeState
): PostLikeCompatibilityFields {
  return {
    isLiked: likeState.viewerHasLiked,
  }
}

export function createCommentLikeCompatibilityFields(
  likeState: {
    likesCount: number | null | undefined
    viewerHasLiked: boolean
  }
): CommentLikeCompatibilityFields {
  return {
    likes_count: normalizeLikeCount(likeState.likesCount),
    is_liked: likeState.viewerHasLiked,
  }
}

export function readViewerHasLikedFromCompatibility(input: {
  viewerHasLiked?: boolean | null
  isLiked?: boolean | null
}): boolean {
  return input.viewerHasLiked ?? input.isLiked ?? false
}

export function readLikeInteractionResult(
  value: unknown
): LikeInteractionResult | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Record<string, unknown>

  if (
    !isLikeInteractionTargetType(candidate.targetType) ||
    typeof candidate.targetId !== "string" ||
    typeof candidate.viewerHasLiked !== "boolean"
  ) {
    return null
  }

  return createLikeInteractionResult({
    targetType: candidate.targetType,
    targetId: candidate.targetId,
    viewerHasLiked: candidate.viewerHasLiked,
    likesCount:
      typeof candidate.likesCount === "number" ? candidate.likesCount : null,
  })
}
