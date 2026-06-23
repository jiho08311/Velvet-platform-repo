import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function countVisibleContentPosts(input?: {
  creatorId?: string
}): Promise<number> {
  let query = supabaseAdmin
    .from("canonical_posts")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)

  if (input?.creatorId) {
    query = query.eq("creator_id", input.creatorId)
  }

  const { count, error } = await query

  if (error) {
    throw error
  }

  return count ?? 0
}
