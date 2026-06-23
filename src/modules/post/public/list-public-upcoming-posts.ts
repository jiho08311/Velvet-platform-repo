import {
  listPublicUpcomingPosts as listPublicUpcomingPostsInternal,
} from "@/modules/post/runtime/list-public-upcoming-posts"

export const PUBLIC_CONTRACT = true

export type ListPublicUpcomingPostsInput = Parameters<
  typeof listPublicUpcomingPostsInternal
>[0]

export type PublicUpcomingPostItem = Awaited<
  ReturnType<typeof listPublicUpcomingPostsInternal>
>[number]

export async function listPublicUpcomingPosts(
  limit?: ListPublicUpcomingPostsInput
): Promise<PublicUpcomingPostItem[]> {
  return listPublicUpcomingPostsInternal(limit)
}
