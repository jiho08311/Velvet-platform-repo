type ResolvePostComposerSubmitCTAParams = {
  disabled?: boolean
}

type ResolveCreatePostSubmitCTAParams = {
  isSubmitting?: boolean
  publishMode: "now" | "scheduled"
}

const COMPOSER_TOOL_CHIP_BASE_CLASS_NAME =
  "rounded-full px-3 py-1.5 text-xs font-medium transition"

const COMPOSER_MINOR_CTA_CLASS_NAME =
  "rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"

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

export function resolveComposerToolChipClassName(active: boolean) {
  return `${COMPOSER_TOOL_CHIP_BASE_CLASS_NAME} ${
    active ? "bg-white text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
  }`
}

export function getComposerMinorCTAClassName() {
  return COMPOSER_MINOR_CTA_CLASS_NAME
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
