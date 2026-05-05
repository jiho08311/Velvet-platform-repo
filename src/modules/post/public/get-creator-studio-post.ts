import {
  getCreatorStudioPost as getCreatorStudioPostInternal,
  type CreatorStudioPostDetail,
} from "@/modules/post/server/get-creator-studio-post"

export type { CreatorStudioPostDetail }

export function getCreatorStudioPost(
  params: Parameters<typeof getCreatorStudioPostInternal>[0]
): ReturnType<typeof getCreatorStudioPostInternal> {
  return getCreatorStudioPostInternal(params)
}
