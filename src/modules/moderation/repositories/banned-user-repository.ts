import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type CanonicalBannedProfileRow = {
  profile_id: string
  profile_lifecycle_state: string | null
  aggregate_metadata: Record<string, unknown> | null
  updated_at: string | null
}

export async function listCanonicalBannedProfileRows(): Promise<
  CanonicalBannedProfileRow[]
> {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, profile_lifecycle_state, aggregate_metadata, updated_at")
    .eq("profile_lifecycle_state", "banned")
    .order("updated_at", { ascending: false })
    .returns<CanonicalBannedProfileRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}
