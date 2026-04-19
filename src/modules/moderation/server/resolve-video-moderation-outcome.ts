type VideoModerationOutcome = "approved" | "rejected" | "needs_review"

type ResolveVideoModerationOutcomeInput = {
  statuses: Array<string | null>
}

export function resolveVideoModerationOutcome({
  statuses,
}: ResolveVideoModerationOutcomeInput): VideoModerationOutcome {
  if (statuses.some((status) => status === "rejected")) {
    return "rejected"
  }

  if (statuses.some((status) => status === "needs_review")) {
    return "needs_review"
  }

  return "approved"
}