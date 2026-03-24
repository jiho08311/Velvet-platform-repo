import { createClient } from "@/infrastructure/supabase/server"

export async function listMedia(creatorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("media")
    .select("id, post_id, type, status, storage_path, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to load media")
  }

  return data ?? []
}