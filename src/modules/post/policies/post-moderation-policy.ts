type PostModerationOutcome =
  | "approved"
  | "rejected"
  | "needs_review"
  | "pending"

type ApprovedPublishIntent = "published" | "scheduled"

type BuildPostModerationTransitionInput =
  | {
      outcome: "approved"
      publishIntent: ApprovedPublishIntent
      now?: string
      publishedAt?: string | null
      clearRejectionReason?: boolean
    }
  | {
      outcome: "rejected"
      now?: string
      rejectionReason?: string | null
    }
  | {
      outcome: "needs_review"
      now?: string
      clearRejectionReason?: boolean
    }
  | {
      outcome: "pending"
      now?: string
      clearRejectionReason?: boolean
    }

export type PostModerationTransitionPayload = {
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected"
  moderation_status: PostModerationOutcome
  moderation_completed_at: string | null
  updated_at: string
  published_at?: string | null
  rejection_reason?: string | null
}

function resolveNow(now?: string): string {
  return now ?? new Date().toISOString()
}

export function buildPostModerationTransitionPayload(
  input: BuildPostModerationTransitionInput
): PostModerationTransitionPayload {
  const now = resolveNow(input.now)

  if (input.outcome === "approved") {
    if (input.publishIntent === "scheduled") {
      return {
        status: "scheduled",
        visibility_status: "draft",
        moderation_status: "approved",
        moderation_completed_at: now,
        updated_at: now,
        published_at: input.publishedAt ?? null,
        ...(input.clearRejectionReason ? { rejection_reason: null } : {}),
      }
    }

    return {
      status: "published",
      visibility_status: "published",
      moderation_status: "approved",
      moderation_completed_at: now,
      updated_at: now,
      published_at: input.publishedAt ?? now,
      ...(input.clearRejectionReason ? { rejection_reason: null } : {}),
    }
  }

  if (input.outcome === "rejected") {
    return {
      status: "archived",
      visibility_status: "rejected",
      moderation_status: "rejected",
      moderation_completed_at: now,
      updated_at: now,
      rejection_reason: input.rejectionReason ?? null,
    }
  }

  if (input.outcome === "needs_review") {
    return {
      status: "draft",
      visibility_status: "processing",
      moderation_status: "needs_review",
      moderation_completed_at: now,
      updated_at: now,
      ...(input.clearRejectionReason ? { rejection_reason: null } : {}),
    }
  }

  return {
    status: "draft",
    visibility_status: "processing",
    moderation_status: "pending",
    moderation_completed_at: null,
    updated_at: now,
    ...(input.clearRejectionReason ? { rejection_reason: null } : {}),
  }
}