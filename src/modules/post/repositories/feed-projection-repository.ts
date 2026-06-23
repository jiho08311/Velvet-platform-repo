// src/modules/post/repositories/feed-projection-repository.ts
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function readCanonicalFeedItem(input: {
  postId: string
  projectionSurface: string
}) {
  return supabaseAdmin
    .from("canonical_feed_items")
    .select("*")
    .eq("post_id", input.postId)
    .eq("projection_surface", input.projectionSurface)
    .maybeSingle()
}

export async function upsertCanonicalFeedItem(input: {
  row: Record<string, unknown>
}) {
  return supabaseAdmin
    .from("canonical_feed_items")
    .upsert(input.row, {
      onConflict: "post_id,projection_surface",
    })
}

export async function recordCanonicalFeedProjectionEvent(input: {
  row: Record<string, unknown>
}) {
  return supabaseAdmin
    .from("canonical_feed_projection_events")
    .insert(input.row)
}

export async function listCanonicalFeedItems(input: {
  projectionSurface: string
  limit: number
}) {
  return supabaseAdmin
    .from("canonical_feed_items")
    .select("*")
    .eq("projection_surface", input.projectionSurface)
    .eq("is_feed_visible", true)
    .order("published_at", { ascending: false })
    .limit(input.limit)
}