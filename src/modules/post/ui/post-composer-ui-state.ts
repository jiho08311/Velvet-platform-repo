type ResolvePostComposerSubmitCTAParams = {
  disabled?: boolean
}

type ResolveCreatePostSubmitCTAParams = {
  isSubmitting?: boolean
  publishMode: "now" | "scheduled"
}

export function resolvePostComposerSubmitCTA(
  params: ResolvePostComposerSubmitCTAParams
) {
  return {
    label: "Publish",
    disabled: Boolean(params.disabled),
  }
}

export function resolveCreatePostSubmitCTA(
  params: ResolveCreatePostSubmitCTAParams
) {
  if (params.isSubmitting) {
    return {
      label: params.publishMode === "scheduled" ? "Scheduling..." : "Publishing...",
      disabled: true,
    }
  }

  return {
    label: params.publishMode === "scheduled" ? "Schedule" : "Publish",
    disabled: false,
  }
}
