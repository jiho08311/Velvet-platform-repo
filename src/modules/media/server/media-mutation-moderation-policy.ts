type MediaMutationModerationStateInput = {
  type: "image" | "video" | "audio" | "file"
}

export type MediaMutationModerationState = {
  status: "processing" | "ready" | "failed"
  processingStatus?: "processing" | "ready" | "failed"
  moderationStatus?: "pending" | "approved" | "rejected" | "needs_review"
  moderationSummary: null
}

export function buildInitialMediaMutationModerationState(
  input: MediaMutationModerationStateInput
): MediaMutationModerationState {
  if (input.type === "video") {
    return {
      status: "processing",
      processingStatus: "processing",
      moderationStatus: "pending",
      moderationSummary: null,
    }
  }

  return {
    status: "ready",
    moderationSummary: null,
  }
}