import type {
  TrustSafetyActionTargetType,
  TrustSafetyActionType,
} from "@/modules/governance/repositories/trust-safety-action-repository"

export function toTrustSafetyActionTargetType(
  targetType: string
): TrustSafetyActionTargetType {
  switch (targetType) {
    case "post":
      return "POST"
    case "story":
      return "STORY"
    case "media":
      return "MEDIA"
    case "creator":
      return "CREATOR"
    default:
      return "USER"
  }
}

export function toTrustSafetyActionType(input: {
  decision: string
  targetType: string
}): TrustSafetyActionType | null {
  if (input.decision === "approved") {
    return null
  }

  const targetType = toTrustSafetyActionTargetType(input.targetType)

  if (targetType === "POST" || targetType === "STORY" || targetType === "MEDIA") {
    return "HIDE_CONTENT"
  }

  if (targetType === "CREATOR" || targetType === "USER") {
    return "WARN_USER"
  }

  return null
}
