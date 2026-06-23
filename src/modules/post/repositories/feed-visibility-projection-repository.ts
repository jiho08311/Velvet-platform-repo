// src/modules/post/repositories/feed-visibility-projection-repository.ts
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function readCanonicalFeedVisibilityProjection(input: {
  projectionSurface: string
}) {
  return supabaseAdmin
    .from("canonical_feed_visibility_projections")
    .select("*")
    .eq("projection_surface", input.projectionSurface)
    .maybeSingle()
}

export async function upsertCanonicalFeedVisibilityProjection(input: {
  row: Record<string, unknown>
}) {
  return supabaseAdmin
    .from("canonical_feed_visibility_projections")
    .upsert(input.row, {
      onConflict: "projection_surface",
    })
}

export async function recordCanonicalFeedVisibilityValidation(input: {
  projectionSurface: string
  visibleItemCount: number
  runtimeVisibilityValidated: boolean
  promotionAllowed: boolean
  rollbackSafe: boolean
}) {
  const now = new Date().toISOString()

  return upsertCanonicalFeedVisibilityProjection({
    row: {
      projection_surface: input.projectionSurface,
      visible_item_count: input.visibleItemCount,
      runtime_visibility_validated: input.runtimeVisibilityValidated,
      promotion_allowed: input.promotionAllowed,
      rollback_safe: input.rollbackSafe,
      observed_at: now,
    },
  })
}