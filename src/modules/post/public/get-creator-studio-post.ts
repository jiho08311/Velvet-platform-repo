import {
  getCreatorStudioPost as getCreatorStudioPostInternal,
} from "@/modules/post/runtime/get-creator-studio-post"

export const PUBLIC_CONTRACT = true

export type CreatorStudioPostDetail = NonNullable<
  Awaited<ReturnType<typeof getCreatorStudioPostInternal>>
>
export type GetCreatorStudioPostInput = Parameters<
  typeof getCreatorStudioPostInternal
>[0]

export function getCreatorStudioPost(
  params: GetCreatorStudioPostInput
): ReturnType<typeof getCreatorStudioPostInternal> {
  return getCreatorStudioPostInternal(params)
}
