export type LikeInteractionTargetType = "post" | "comment"

export type LikeInteractionResult = {
  targetType: LikeInteractionTargetType
  targetId: string
  viewerHasLiked: boolean
  likesCount: number
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
