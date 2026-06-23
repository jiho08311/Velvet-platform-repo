import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ContentPublicCardRow = {
  post_id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: string
  status: string
  price: number | null
  published_at: string | null
  created_at: string
  updated_at: string | null
  visibility_status: string | null
  moderation_status: string | null
  feed_visibility_state: string | null
  is_feed_visible: boolean
  is_public_visible: boolean
  media_preview: unknown[]
  media_count: number
  block_preview: unknown[]
  block_count: number
  render_text_seed: string | null
  source_hash: string | null
  projection_version: number
  computed_at: string
}

export async function upsertContentPublicCard(
  row: Omit<ContentPublicCardRow, "computed_at">
) {
  return supabaseAdmin
    .from("content_public_cards")
    .upsert(
      {
        ...row,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "post_id" }
    )
    .select("*")
    .single<ContentPublicCardRow>()
}

export async function listContentPublicCardsByPostIds(
  postIds: string[]
): Promise<ContentPublicCardRow[]> {
  if (postIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("content_public_cards")
    .select("*")
    .in("post_id", postIds)
    .returns<ContentPublicCardRow[]>()

  if (error) throw error

  return data ?? []
}
