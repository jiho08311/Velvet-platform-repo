import {
  enforcePostVisibility as enforcePostVisibilityInternal,
} from "@/modules/post/server/enforce-post-visibility"

type EnforcePostVisibilityInput = Parameters<
  typeof enforcePostVisibilityInternal
>[0]

export async function enforcePostVisibility(
  input: EnforcePostVisibilityInput
) {
  return enforcePostVisibilityInternal(input)
}