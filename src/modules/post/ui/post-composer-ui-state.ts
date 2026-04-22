type ResolvePostComposerSubmitCTAParams = {
  disabled?: boolean
}

export function resolvePostComposerSubmitCTA(
  params: ResolvePostComposerSubmitCTAParams
) {
  return {
    label: "Publish",
    disabled: Boolean(params.disabled),
  }
}
