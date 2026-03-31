import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function updatePostStatus({
  postId,
  status,
}: {
  postId: string
  status: "draft" | "published" | "archived"
}) {
  const { error } = await supabaseAdmin
    .from("posts")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)

  if (error) {
    throw error
  }
}