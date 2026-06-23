import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type CreatorPublicCardRow = {
  creator_id: string
  user_id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  legacy_creator_status: string | null
  creator_lifecycle_state: string | null
  creator_visibility_state: string | null
  profile_lifecycle_state: string | null
  identity_visibility_state: string | null
  is_public_visible: boolean
  source_hash: string | null
  projection_version: number
  computed_at: string
  updated_at: string
}

export async function upsertCreatorPublicCard(
  row: Omit<CreatorPublicCardRow, "computed_at" | "updated_at">
) {
  const now = new Date().toISOString()

  return supabaseAdmin
    .from("creator_public_cards")
    .upsert(
      {
        ...row,
        computed_at: now,
        updated_at: now,
      },
      { onConflict: "creator_id" }
    )
    .select("*")
    .single<CreatorPublicCardRow>()
}

export async function listCreatorPublicCardsByCreatorIds(
  creatorIds: string[]
): Promise<CreatorPublicCardRow[]> {
  if (creatorIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("creator_public_cards")
    .select("*")
    .in("creator_id", creatorIds)
    .returns<CreatorPublicCardRow[]>()

  if (error) throw error

  return data ?? []
}

export async function listVisibleCreatorPublicCards(input: {
  limit: number
}): Promise<CreatorPublicCardRow[]> {
  const { data, error } = await supabaseAdmin
    .from("creator_public_cards")
    .select("*")
    .eq("is_public_visible", true)
    .order("updated_at", { ascending: false })
    .limit(input.limit)
    .returns<CreatorPublicCardRow[]>()

  if (error) throw error

  return data ?? []
}

export async function searchVisibleCreatorPublicCards(input: {
  query: string
  limit: number
}): Promise<CreatorPublicCardRow[]> {
  const trimmed = input.query.trim()

  if (!trimmed) return []

  const { data, error } = await supabaseAdmin
    .from("creator_public_cards")
    .select("*")
    .eq("is_public_visible", true)
    .ilike("username", `%${trimmed}%`)
    .limit(input.limit)
    .returns<CreatorPublicCardRow[]>()

  if (error) throw error

  return data ?? []
}