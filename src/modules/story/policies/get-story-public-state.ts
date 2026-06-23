import type { StoryPublicState, StoryPublicStateInput } from "../types"
import { getStorySurfaceEligibility } from "./get-story-surface-eligibility"

export function getStoryPublicState(
  input: StoryPublicStateInput
): StoryPublicState {
  if (getStorySurfaceEligibility(input) === "excluded") {
    return "not_visible"
  }

  return "visible"
}
