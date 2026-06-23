import {
  enforcePostVisibility as enforcePostVisibilityInternal,
} from "@/modules/post/policies/enforce-post-visibility"

export const PUBLIC_CONTRACT = true

export type EnforcePostVisibilityInput = Parameters<
  typeof enforcePostVisibilityInternal
>[0]
export type EnforcePostVisibilityResult = Awaited<
  ReturnType<typeof enforcePostVisibilityInternal>
>

export async function enforcePostVisibility(
  input: EnforcePostVisibilityInput
): Promise<EnforcePostVisibilityResult> {
  return enforcePostVisibilityInternal(input)
}
