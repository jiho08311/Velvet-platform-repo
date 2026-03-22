import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function deleteMedia(mediaId: string): Promise<void> {
  const id = mediaId.trim()

  if (!id) {
    throw new Error("mediaId is required")
  }

  const { error } = await supabaseAdmin
    .from("media")
    .delete()
    .eq("id", id)

  if (error) {
    throw error
  }
}