import { countVisibleContentPosts } from "@/modules/post/repositories/post-analytics-repository"

export const PUBLIC_CONTRACT = true

export async function countAllVisibleContentPosts(): ReturnType<
  typeof countVisibleContentPosts
> {
  return countVisibleContentPosts()
}

export async function countCreatorVisibleContentPosts(
  creatorId: string,
): ReturnType<typeof countVisibleContentPosts> {
  return countVisibleContentPosts({ creatorId })
}
