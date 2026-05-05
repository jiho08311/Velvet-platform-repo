import { findBookmarkedPostRowsByUserId } from "@/modules/post/repositories/post-bookmark-repository"

type ListBookmarkedPostsParams = {
  userId: string
}

export type BookmarkedPost = {
  id: string
  contentPreview: string
  createdAt: string
  creator: {
    username: string
    displayName: string
  }
  mediaThumbnailUrl: string | null
}

export async function listBookmarkedPosts({
  userId,
}: ListBookmarkedPostsParams): Promise<BookmarkedPost[]> {
  const rows = await findBookmarkedPostRowsByUserId(userId)

  return rows.map((row) => {
    const post = row.post

    return {
      id: post.id,
      contentPreview: post.content?.slice(0, 160) ?? "",
      createdAt: post.created_at,
      creator: {
        username: post.creator.username,
        displayName: post.creator.display_name,
      },
      mediaThumbnailUrl: post.media?.[0]?.thumbnail_url ?? null,
    }
  })
}