// src/modules/post/services/post-mutation-moderation-service.ts

import {
  resolveModerationOutcomeFromStatuses,
  type ModerationOutcome,
} from "@/modules/moderation/public/moderation-outcome-policy"

export type PostMutationModerationOutcome = ModerationOutcome

type ResolvePostMutationModerationOutcomeInput = {
  statuses: Array<string | null>
}

export function resolvePostMutationModerationOutcome({
  statuses,
}: ResolvePostMutationModerationOutcomeInput): PostMutationModerationOutcome {
  return resolveModerationOutcomeFromStatuses({ statuses })
}