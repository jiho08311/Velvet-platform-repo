import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"
import type { StoryPublicState, StoryPublicStateInput } from "../types"

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

export function getStoryPublicState(
  input: StoryPublicStateInput
): StoryPublicState {
  if (input.story.isDeleted) {
    return "not_visible"
  }

  if (isExpired(input.story.expiresAt, input.now)) {
    return "not_visible"
  }

  const isCreatorVisible = isPublicCreatorProfileVisible({
    creator: input.creator,
    profile: input.profile,
  })

  if (!isCreatorVisible) {
    return "not_visible"
  }

  return "visible"
}