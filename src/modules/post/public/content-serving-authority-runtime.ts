import {
  resolveContentServingAuthorityRuntime as resolveContentServingAuthority,
} from "@/modules/post/runtime/resolve-content-serving-authority-runtime"

export const PUBLIC_CONTRACT = true

export type ResolveContentServingAuthorityInput = Parameters<
  typeof resolveContentServingAuthority
>[0]

export type ContentServingAuthorityRuntimeResult = Awaited<
  ReturnType<typeof resolveContentServingAuthority>
>

export async function resolveContentServingAuthorityRuntime(
  input: ResolveContentServingAuthorityInput
): Promise<ContentServingAuthorityRuntimeResult> {
  return resolveContentServingAuthority(input)
}
