import { createPostAuthoringMedia as createPostAuthoringMediaServer } from "@/modules/media/runtime/create-media"
import type { Media, MediaStatus } from "@/modules/media/types"
import type { CreatePostAuthoringMediaRowInput } from "@/modules/post/types"

export const PUBLIC_CONTRACT = true

export type CreatePostAuthoringMediaInput = {
  postId: string
  ownerUserId: string
  media: CreatePostAuthoringMediaRowInput
  status?: MediaStatus
  useInitialModerationState?: boolean
}

export async function createPostAuthoringMedia(
  input: CreatePostAuthoringMediaInput
): Promise<Media> {
  return createPostAuthoringMediaServer(input)
}
