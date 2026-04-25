import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"
import type {
  StorySurfaceEligibility,
  StorySurfaceEligibilityInput,
} from "../types"

function isExpired(expiresAt: string | null, now: string): boolean {
  if (!expiresAt) {
    return true
  }

  const expiresAtTime = new Date(expiresAt).getTime()
  const nowTime = new Date(now).getTime()

  if (Number.isNaN(expiresAtTime) || Number.isNaN(nowTime)) {
    return true
  }

  return expiresAtTime <= nowTime
}

export function getStorySurfaceEligibility(
  input: StorySurfaceEligibilityInput
): StorySurfaceEligibility {
  if (input.story.isDeleted) {
    return "excluded"
  }

  if (isExpired(input.story.expiresAt, input.now)) {
    return "excluded"
  }

  const isCreatorVisible = isPublicCreatorProfileVisible({
    creator: input.creator,
    profile: input.profile,
  })

  if (!isCreatorVisible) {
    return "excluded"
  }

  return "included"
}
