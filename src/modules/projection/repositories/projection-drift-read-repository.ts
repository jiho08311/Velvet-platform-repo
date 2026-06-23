import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CountQuery = PromiseLike<{
  count: number | null
  error: unknown
}> & {
  eq(column: string, value: unknown): CountQuery
  is(column: string, value: unknown): CountQuery
  not(column: string, operator: string, value: unknown): CountQuery
}

type QueryFilter = (query: CountQuery) => CountQuery

export async function countProjectionTableRows(
  table: string,
  filter?: QueryFilter
): Promise<number> {
let query = (supabaseAdmin as any)
  .from(table)
  .select("*", { count: "exact", head: true }) as CountQuery

  if (filter) query = filter(query)

  const { count, error } = await query

  if (error) throw error

  return count ?? 0
}

export async function countMissingCreatorPublicCards(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("creators")
    .select("id")
    .limit(10000)

  if (error) throw error

  const creatorIds = (data ?? []).map((row) => row.id)

  if (creatorIds.length === 0) {
    return 0
  }

  const { data: cards, error: cardsError } = await supabaseAdmin
    .from("creator_public_cards")
    .select("creator_id")
    .in("creator_id", creatorIds)

  if (cardsError) throw cardsError

  const cardIds = new Set((cards ?? []).map((row) => row.creator_id))

  return creatorIds.filter((id) => !cardIds.has(id)).length
}

export async function countMissingContentPublicCards(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("canonical_feed_items")
    .select("post_id")
    .eq("projection_surface", "home_feed")
    .eq("is_feed_visible", true)
    .limit(10000)

  if (error) throw error

  const postIds = (data ?? []).map((row) => row.post_id)

  if (postIds.length === 0) {
    return 0
  }

  const { data: cards, error: cardsError } = await supabaseAdmin
    .from("content_public_cards")
    .select("post_id")
    .in("post_id", postIds)

  if (cardsError) throw cardsError

  const cardIds = new Set((cards ?? []).map((row) => row.post_id))

  return postIds.filter((id) => !cardIds.has(id)).length
}
