import {
  assemblePostProjectionRuntime as assemblePostProjection,
} from "@/modules/post/runtime/post-projection-runtime"

export const PUBLIC_CONTRACT = true

export type AssemblePostProjectionRuntimeInput = Parameters<
  typeof assemblePostProjection
>[0]

export type PostProjectionRuntimeResult = Awaited<
  ReturnType<typeof assemblePostProjection>
>

export type PostProjectionRuntimeBlock =
  AssemblePostProjectionRuntimeInput["blocks"][number]

export async function assemblePostProjectionRuntime(
  input: AssemblePostProjectionRuntimeInput
): Promise<PostProjectionRuntimeResult> {
  return assemblePostProjection(input)
}
