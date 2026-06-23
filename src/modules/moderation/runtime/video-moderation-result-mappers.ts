import type { ModerationResultShape } from "@/modules/moderation/contracts/video-moderation-runtime-contract"

const VIDEO_REVIEW_THRESHOLD = Number(
  process.env.VIDEO_REVIEW_THRESHOLD ?? 0.75
)

export function toBooleanRecord(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object") {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, Boolean(item)])
  )
}

export function toNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, Number(item) || 0])
  )
}

export function shouldRejectFromImageResult(
  result: ModerationResultShape
): boolean {
  const categories = result.categories ?? {}
  const scores = result.category_scores ?? {}

  return (
    categories["sexual/minors"] === true ||
    categories["violence/graphic"] === true ||
    categories["self-harm/intent"] === true ||
    categories["self-harm/instructions"] === true ||
    categories["illicit/violent"] === true ||
    (scores["sexual"] ?? 0) >= VIDEO_REVIEW_THRESHOLD ||
    (scores["violence"] ?? 0) >= VIDEO_REVIEW_THRESHOLD
  )
}
