import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type CanonicalAdultVerificationRow = {
  is_adult_verified: boolean | null
  adult_verification_method: "self_reported" | "pass" | null
  aggregate_metadata: Record<string, unknown> | null
}

export async function readCanonicalAdultVerificationRow(
  profileId: string
): Promise<CanonicalAdultVerificationRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("is_adult_verified, adult_verification_method, aggregate_metadata")
    .eq("profile_id", profileId)
    .maybeSingle<CanonicalAdultVerificationRow>()

  if (error) throw error

  return data
}
