// src/modules/post/server/resolve-post-mutation-moderation-outcome.ts

import {
  resolvePostMutationModerationOutcome as resolveInternal,
} from "@/modules/post/services/post-mutation-moderation-service"

export type PostMutationModerationOutcome =
  ReturnType<typeof resolveInternal>

type ResolvePostMutationModerationOutcomeInput =
  Parameters<typeof resolveInternal>[0]

export function resolvePostMutationModerationOutcome(
  input: ResolvePostMutationModerationOutcomeInput
): PostMutationModerationOutcome {
  return resolveInternal(input)
}