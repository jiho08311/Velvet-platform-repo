import { createClient } from "@/infrastructure/supabase/server"

export async function listMedia(ownerId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("media")
    .select("id, type, created_at, thumbnail_url, owner_id")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to load media")
  }

  return data ?? []
}