import { resolveModerationOutcomeFromStatuses } from "@/modules/moderation/lib/moderation-outcome-policy"

type VideoModerationOutcome = "approved" | "rejected" | "needs_review"

type ResolveVideoModerationOutcomeInput = {
  statuses: Array<string | null>
}

export function resolveVideoModerationOutcome({
  statuses,
}: ResolveVideoModerationOutcomeInput): VideoModerationOutcome {
  const outcome = resolveModerationOutcomeFromStatuses({ statuses })

  if (outcome === "pending") {
    return "needs_review"
  }

  return outcome
}
