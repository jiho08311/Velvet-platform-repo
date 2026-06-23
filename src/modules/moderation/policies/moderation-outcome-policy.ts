export const MODERATION_OUTCOMES = [
  "approved",
  "rejected",
  "needs_review",
  "pending",
] as const

export type ModerationOutcome = (typeof MODERATION_OUTCOMES)[number]

export type NormalizedModerationOutcome =
  | ModerationOutcome
  | "unknown"

type ResolveModerationOutcomeFromStatusesInput = {
  statuses: Array<string | null | undefined>
  emptyOutcome?: ModerationOutcome
  unknownOutcome?: ModerationOutcome
}

export function normalizeModerationOutcome(
  value: string | null | undefined
): NormalizedModerationOutcome {
  if (
    value === "approved" ||
    value === "rejected" ||
    value === "needs_review" ||
    value === "pending"
  ) {
    return value
  }

  return "unknown"
}

export function isModerationApproved(
  value: string | null | undefined
): boolean {
  return normalizeModerationOutcome(value) === "approved"
}

export function isModerationRejected(
  value: string | null | undefined
): boolean {
  return normalizeModerationOutcome(value) === "rejected"
}

export function isModerationUnresolved(
  value: string | null | undefined
): boolean {
  const outcome = normalizeModerationOutcome(value)

  return (
    outcome === "pending" ||
    outcome === "needs_review" ||
    outcome === "unknown"
  )
}

export function isModerationApprovedForPublicConsumption(
  value: string | null | undefined
): boolean {
  return isModerationApproved(value)
}

export function resolveModerationOutcomeFromStatuses({
  statuses,
  emptyOutcome = "needs_review",
  unknownOutcome = "needs_review",
}: ResolveModerationOutcomeFromStatusesInput): ModerationOutcome {
  const normalizedStatuses = statuses.map(normalizeModerationOutcome)

  if (normalizedStatuses.length === 0) {
    return emptyOutcome
  }

  if (normalizedStatuses.some((status) => status === "rejected")) {
    return "rejected"
  }

  if (normalizedStatuses.some((status) => status === "needs_review")) {
    return "needs_review"
  }

  if (normalizedStatuses.some((status) => status === "pending")) {
    return "pending"
  }

  if (normalizedStatuses.every((status) => status === "approved")) {
    return "approved"
  }

  return unknownOutcome
}
