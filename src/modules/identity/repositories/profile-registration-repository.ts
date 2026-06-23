import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type RegisteredProfileRow = {
  profile_id: string
  username: string | null
  display_name: string | null
  aggregate_metadata: Record<string, unknown> | null
  created_at: string
}

export async function upsertRegisteredProfile(input: {
  profileId: string
  email: string
  displayName: string
  username: string
  birthDate: string | null
  registeredAt: string
}): Promise<RegisteredProfileRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: input.profileId,
        username: input.username,
        display_name: input.displayName,
        birth_date: input.birthDate,
        is_adult_verified: false,
        adult_verified_at: null,
        adult_verification_method: null,
        lifecycle_state: "active",
        profile_lifecycle_state: "active",
        identity_visibility_state: "visible",
        candidate_sync_state: "authoritative",
        promotion_readiness_state: "promoted",
        promotion_readiness_updated_at: input.registeredAt,
        authority_mode: "canonical_authoritative",
        enforcement_mode: "enforced",
        runtime_authoritative: false,
        serving_authoritative: true,
        candidate_authoritative: false,
        rollback_safe: false,
        fail_open: false,
        correlation_keys: {
          profileId: input.profileId,
        },
        aggregate_metadata: {
          mutation: "canonical_profiles.registration",
          email: input.email,
          birthDate: input.birthDate,
          isAdultVerified: false,
          adultVerifiedAt: null,
          adultVerificationMethod: null,
          sourceSurface: "identity.registration",
          sourceSymbol: "executeProfileRegistration",
        },
        observed_at: input.registeredAt,
        updated_at: input.registeredAt,
      },
      { onConflict: "profile_id" },
    )
    .select("profile_id, username, display_name, aggregate_metadata, created_at")
    .single<RegisteredProfileRow>()

  if (error || !data?.profile_id) {
    throw error ?? new Error("PROFILE_REGISTRATION_FAILED")
  }

  return data
}
