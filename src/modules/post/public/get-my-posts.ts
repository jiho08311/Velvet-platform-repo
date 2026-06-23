import {
  getMyPosts as getMyPostsInternal,
} from "@/modules/post/runtime/get-my-posts"

export const PUBLIC_CONTRACT = true

export type GetMyPostsInput = Parameters<typeof getMyPostsInternal>[0]
export type GetMyPostsResult = Awaited<ReturnType<typeof getMyPostsInternal>>
export type MyPostListItem = GetMyPostsResult["items"][number]

export function getMyPosts(
  input: GetMyPostsInput
): ReturnType<typeof getMyPostsInternal> {
  return getMyPostsInternal(input)
}
