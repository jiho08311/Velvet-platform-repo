import {
  listCreatorStudioPosts as listCreatorStudioPostsInternal,
} from "@/modules/post/runtime/list-creator-studio-posts"

export const PUBLIC_CONTRACT = true

export type ListCreatorStudioPostsInput = Parameters<
  typeof listCreatorStudioPostsInternal
>[0]
export type CreatorStudioPost = Awaited<
  ReturnType<typeof listCreatorStudioPostsInternal>
>[number]

export function listCreatorStudioPosts(
  params: ListCreatorStudioPostsInput
): ReturnType<typeof listCreatorStudioPostsInternal> {
  return listCreatorStudioPostsInternal(params)
}
