import type { StoryAccessState, StoryAccessStateInput } from "../types"

export function getStoryAccessState(
  input: StoryAccessStateInput
): StoryAccessState {
  if (input.isOwner) {
    return "visible_unlocked"
  }

  if (input.visibility === "public") {
    return "visible_unlocked"
  }

  if (input.visibility === "subscribers") {
    if (input.hasSubscriptionAccess) {
      return "visible_unlocked"
    }

    return "visible_locked"
  }

  return "not_visible"
}