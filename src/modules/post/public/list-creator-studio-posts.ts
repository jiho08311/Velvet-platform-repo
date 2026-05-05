import {
  listCreatorStudioPosts as listCreatorStudioPostsInternal,
  type CreatorStudioPost,
} from "@/modules/post/server/list-creator-studio-posts"

export type { CreatorStudioPost }

export function listCreatorStudioPosts(
  params: Parameters<typeof listCreatorStudioPostsInternal>[0]
): ReturnType<typeof listCreatorStudioPostsInternal> {
  return listCreatorStudioPostsInternal(params)
}
