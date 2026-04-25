import {
  resolveModerationOutcomeFromStatuses,
  type ModerationOutcome,
} from "@/modules/moderation/lib/moderation-outcome-policy"

export type PostMutationModerationOutcome = ModerationOutcome

type ResolvePostMutationModerationOutcomeInput = {
  statuses: Array<string | null>
}

/**
 * Post edit mutation(remove-only 등) 이후 남아 있는 media moderation 상태를 기준으로
 * post의 후속 moderation outcome을 계산한다.
 *
 * 이 resolver는 worker 기반 video moderation finalize 용도가 아니라,
 * synchronous post mutation recompute 용도다.
 */
export function resolvePostMutationModerationOutcome({
  statuses,
}: ResolvePostMutationModerationOutcomeInput): PostMutationModerationOutcome {
  return resolveModerationOutcomeFromStatuses({ statuses })
}
