import { createClient } from "@/infrastructure/supabase/server"

export async function countCreatorDashboardPosts(
  creatorId: string
): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from("canonical_posts")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .is("deleted_at", null)

  if (error) {
    throw error
  }

  return count ?? 0
}
