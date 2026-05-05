import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type BookmarkedPostRow = {
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

export async function findBookmarkedPostRowsByUserId(
  userId: string
): Promise<BookmarkedPostRow[]> {
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

  return (data ?? []) as unknown as BookmarkedPostRow[]
}