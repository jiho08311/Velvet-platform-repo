
import { deletePost as deletePostInternal } from "@/modules/post/server/delete-post"

export function deletePost(
  params: Parameters<typeof deletePostInternal>[0],
): ReturnType<typeof deletePostInternal> {
  return deletePostInternal(params)
}