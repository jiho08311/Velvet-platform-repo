// src/modules/media/public/list-post-media.ts

import {
  listPostMediaRuntime,
} from "@/modules/media/runtime/list-post-media-runtime"

export const PUBLIC_CONTRACT = true

export type ListPostMediaInput = {
  postIds: string[]
  requireReadyAsset?: boolean
}

export type PostMediaItemContract = Awaited<
  ReturnType<typeof listPostMediaRuntime>
>[number]

export async function listPostMedia(
  input: ListPostMediaInput
): Promise<PostMediaItemContract[]> {
  return listPostMediaRuntime(input)
}
