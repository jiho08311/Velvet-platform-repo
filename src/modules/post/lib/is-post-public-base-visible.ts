import { isModerationApprovedForPublicConsumption } from "@/modules/moderation/lib/moderation-outcome-policy"

type PostPublicBaseVisibilityInput = {
  visibility: string | null | undefined
  moderationStatus: string | null | undefined
  deletedAt: string | null | undefined
}

function isSupportedPublicVisibility(
  visibility: string | null | undefined
): boolean {
  return visibility === "public" || visibility === "subscribers"
}

export function isPostPublicBaseVisible(
  input: PostPublicBaseVisibilityInput
): boolean {
  if (input.deletedAt) {
    return false
  }

  if (!isSupportedPublicVisibility(input.visibility)) {
    return false
  }

  if (!isModerationApprovedForPublicConsumption(input.moderationStatus)) {
    return false
  }

  return true
}
