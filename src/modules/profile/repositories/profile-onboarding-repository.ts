import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type OnboardingProfileIdRow = {
  profile_id: string
}

export async function readOnboardingProfileIdById(profileId: string) {
  return supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id")
    .eq("profile_id", profileId)
    .maybeSingle<OnboardingProfileIdRow>()
}

export async function readDuplicateOnboardingUsernameProfileId({
  profileId,
  username,
}: {
  profileId: string
  username: string
}) {
  return supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id")
    .ilike("username", username)
    .neq("profile_id", profileId)
    .maybeSingle<OnboardingProfileIdRow>()
}

export async function updateOnboardingProfileUsername({
  profileId,
  username,
}: {
  profileId: string
  username: string
}) {
  const now = new Date().toISOString()

  return supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: profileId,
        username,
        profile_lifecycle_state: "active",
        lifecycle_state: "active",
        identity_visibility_state: "visible",
        candidate_sync_state: "authoritative",
        promotion_readiness_state: "promoted",
        promotion_readiness_updated_at: now,
        authority_mode: "canonical_authoritative",
        enforcement_mode: "enforced",
        runtime_authoritative: false,
        serving_authoritative: true,
        candidate_authoritative: false,
        rollback_safe: false,
        fail_open: false,
        correlation_keys: {
          profileId,
        },
        aggregate_metadata: {
          mutation: "canonical_profiles.username",
          sourceSurface: "profile.onboarding",
          sourceSymbol: "updateOnboardingProfileUsername",
        },
        observed_at: now,
        updated_at: now,
      },
      { onConflict: "profile_id" }
    )
}
