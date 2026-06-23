import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type CreatorPublicCardSearchRow = {
  creator_id: string
  user_id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  creator_lifecycle_state: string | null
  creator_visibility_state: string | null
  profile_lifecycle_state: string | null
  identity_visibility_state: string | null
  is_public_visible: boolean | null
}

const SELECT_CREATOR_PUBLIC_CARD = `
  creator_id,
  user_id,
  username,
  display_name,
  avatar_url,
  bio,
  creator_lifecycle_state,
  creator_visibility_state,
  profile_lifecycle_state,
  identity_visibility_state,
  is_public_visible
`

export async function listPublicCreatorCards(input: {
  limit: number
}): Promise<CreatorPublicCardSearchRow[]> {
  const { data, error } = await supabaseAdmin
    .from("creator_public_cards")
    .select(SELECT_CREATOR_PUBLIC_CARD)
    .eq("is_public_visible", true)
    .limit(input.limit)
    .returns<CreatorPublicCardSearchRow[]>()

  if (error) throw error

  return data ?? []
}

export async function searchPublicCreatorCards(input: {
  query: string
  limit: number
}): Promise<CreatorPublicCardSearchRow[]> {
  const trimmed = input.query.trim()

  if (!trimmed) return []

  const { data, error } = await supabaseAdmin
    .from("creator_public_cards")
    .select(SELECT_CREATOR_PUBLIC_CARD)
    .eq("is_public_visible", true)
    .or(
      [
        `username.ilike.%${trimmed}%`,
        `display_name.ilike.%${trimmed}%`,
        `bio.ilike.%${trimmed}%`,
      ].join(",")
    )
    .limit(input.limit)
    .returns<CreatorPublicCardSearchRow[]>()

  if (error) throw error

  return data ?? []
}

export async function findPublicCreatorCardsByCreatorIds(
  creatorIds: string[]
): Promise<CreatorPublicCardSearchRow[]> {
  if (creatorIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("creator_public_cards")
    .select(SELECT_CREATOR_PUBLIC_CARD)
    .eq("is_public_visible", true)
    .in("creator_id", creatorIds)
    .returns<CreatorPublicCardSearchRow[]>()

  if (error) throw error

  return data ?? []
}

export async function listRecommendedCreatorCards(input: {
  excludeCreatorIds?: string[]
  excludeUserId?: string
  limit: number
}): Promise<CreatorPublicCardSearchRow[]> {
  let query = supabaseAdmin
    .from("creator_public_cards")
    .select(SELECT_CREATOR_PUBLIC_CARD)
    .eq("is_public_visible", true)
    .limit(input.limit)

  if (input.excludeUserId) {
    query = query.neq("user_id", input.excludeUserId)
  }

  const { data, error } = await query.returns<CreatorPublicCardSearchRow[]>()

  if (error) throw error

  const excludedCreatorIds = new Set(input.excludeCreatorIds ?? [])

  return (data ?? []).filter((row) => !excludedCreatorIds.has(row.creator_id))
}