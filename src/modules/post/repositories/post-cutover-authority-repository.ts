// src/modules/post/repositories/post-cutover-authority-repository.ts
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function recordPostCutoverAuthorityPreservationEvent(input: {
  row: Record<string, unknown>
}) {
  return supabaseAdmin
    .from("canonical_post_cutover_authority_preservation_events")
    .insert(input.row)
}

export async function readLatestPostCutoverAuthorityState(input: {
  runtimeSurface: string
  authoritySurface?: string
}) {
  let query = supabaseAdmin
    .from("canonical_post_cutover_authority_preservation_events")
    .select("*")
    .eq("runtime_surface", input.runtimeSurface)
    .order("observed_at", { ascending: false })
    .limit(1)

  if (input.authoritySurface) {
    query = query.eq("authority_surface", input.authoritySurface)
  }

  return query.maybeSingle()
}

export async function canPromotePostCanonicalAuthority(input: {
  runtimeSurface: string
  authoritySurface?: string
}) {
  const { data, error } = await readLatestPostCutoverAuthorityState(input)

  if (error) {
    return {
      data: null,
      error,
    }
  }

  return {
    data: {
      promotionAllowed: Boolean(data?.promotion_allowed),
      rollbackSafe: Boolean(data?.rollback_safe),
      failOpen: Boolean(data?.fail_open),
      authorityMode: data?.authority_mode ?? null,
    },
    error: null,
  }
}