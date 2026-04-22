type ResolvePostComposerSubmitCTAParams = {
  disabled?: boolean
}

type ResolveCreatePostSubmitCTAParams = {
  isSubmitting?: boolean
  publishMode: "now" | "scheduled"
}

export function resolveCreatePostComposerErrorPresentation(
  message: string | null
) {
  if (!message) {
    return null
  }

  return {
    message,
    className:
      "rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300",
  }
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
