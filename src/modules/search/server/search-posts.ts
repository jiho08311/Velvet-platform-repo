import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type PostSearchResult = {
  id: string
  creatorId: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  createdAt: string
}

export type SearchPostsInput = {
  query: string
  limit?: number
}

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  created_at: string
}

export async function searchPosts(
  input: SearchPostsInput
): Promise<PostSearchResult[]> {
  const supabase = await createSupabaseServerClient()

  const query = input.query.trim()

  if (!query) {
    return []
  }

  const limit = Math.max(1, Math.min(input.limit ?? 10, 50))

  const { data, error } = await supabase
    .from("posts")
    .select("id, creator_id, title, content, visibility, created_at")
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .is("deleted_at", null)
    .eq("status", "published")
    .limit(limit)

  if (error) {
    throw error
  }

  return (data ?? []).map((row: PostRow) => ({
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    content: row.content,
    visibility: row.visibility,
    createdAt: row.created_at,
  }))
}