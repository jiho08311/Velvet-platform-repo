import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type ExploreCreator = {
  id: string
  username: string
  displayName: string | null
}

type CreatorRow = {
  id: string
  username: string
  display_name: string | null
}

export async function getExploreCreators(
  limit = 20
): Promise<ExploreCreator[]> {
  const supabase = await createSupabaseServerClient()

  const safeLimit = Math.max(1, Math.min(limit, 50))

  const { data, error } = await supabase
    .from("creators")
    .select("id, username, display_name")
    .limit(safeLimit)

  if (error) {
    throw error
  }

  return (data ?? []).map((creator: CreatorRow) => ({
    id: creator.id,
    username: creator.username,
    displayName: creator.display_name,
  }))
}