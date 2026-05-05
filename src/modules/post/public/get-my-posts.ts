import {
  getMyPosts as getMyPostsInternal,
  type GetMyPostsInput,
  type GetMyPostsResult,
  type MyPostListItem,
} from "@/modules/post/server/get-my-posts"

export type { GetMyPostsInput, GetMyPostsResult, MyPostListItem }

export function getMyPosts(
  input: GetMyPostsInput
): ReturnType<typeof getMyPostsInternal> {
  return getMyPostsInternal(input)
}
