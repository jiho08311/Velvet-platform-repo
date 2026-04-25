import type { StoryAccessState, StoryAccessStateInput } from "../types"

export function getStoryAccessState(
  input: StoryAccessStateInput
): StoryAccessState {
  if (input.isOwner) {
    return "visible_unlocked"
  }

  switch (input.visibility) {
    case "public":
      return "visible_unlocked"

    case "subscribers":
      if (input.hasSubscriptionAccess) {
        return "visible_unlocked"
      }

      return "visible_locked"
  }

  const unreachableVisibility: never = input.visibility

  throw new Error(`Unsupported story visibility: ${unreachableVisibility}`)
}
