import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type DeletePostParams = {
  postId: string
  creatorId: string
}

export async function deletePost({
  postId,
  creatorId,
}: DeletePostParams): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const now = new Date().toISOString()

  const { error } = await supabase
    .from("posts")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", postId)
    .eq("creator_id", creatorId)
    .in("status", ["draft", "scheduled", "published", "archived"])
    .is("deleted_at", null)

  if (error) {
    throw error
  }
}