// src/modules/post/server/list-bookmarked-posts.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"

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

type BookmarkRow = {
  post_id: string
  created_at: string
  post: {
    id: string
    content: string | null
    created_at: string
    creator: {
      username: string
      display_name: string
    }
    media: {
      thumbnail_url: string | null
    }[] | null
  }
}

export async function listBookmarkedPosts({
  userId,
}: ListBookmarkedPostsParams): Promise<BookmarkedPost[]> {
  const { data, error } = await supabaseAdmin
    .from("bookmarks")
    .select(
      `
      post_id,
      created_at,
      post:posts(
        id,
        content,
        created_at,
        creator:creators(
          username,
          display_name
        ),
        media:media(
          thumbnail_url
        )
      )
    `
    )
    .eq("user_id", userId)

  if (error) {
    throw error
  }

  if (!data) {
    return []
  }

  return (data as unknown as BookmarkRow[]).map((row) => {
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