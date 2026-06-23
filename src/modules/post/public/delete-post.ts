
import { deletePost as deletePostInternal } from "@/modules/post/runtime/delete-post"

export const PUBLIC_CONTRACT = true

export type DeletePostInput = Parameters<typeof deletePostInternal>[0]

export function deletePost(
  params: DeletePostInput,
): ReturnType<typeof deletePostInternal> {
  return deletePostInternal(params)
}
