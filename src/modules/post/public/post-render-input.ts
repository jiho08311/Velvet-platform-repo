import {
  buildPostRenderInput as buildPostRenderInputMapper,
} from "@/modules/post/mappers/post-render-input"

export const PUBLIC_CONTRACT = true

export type BuildPostRenderInputParams = Parameters<
  typeof buildPostRenderInputMapper
>[0]
export type BuildPostRenderInputResult = ReturnType<
  typeof buildPostRenderInputMapper
>

export function buildPostRenderInput(
  params: BuildPostRenderInputParams
): BuildPostRenderInputResult {
  return buildPostRenderInputMapper(params)
}
