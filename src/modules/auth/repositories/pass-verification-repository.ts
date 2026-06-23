import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { InfrastructureError } from "@/shared/errors"

export async function upsertPassAdultVerification(input: {
  requestId: string
  profileId: string
  verifiedAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: input.profileId,
        is_adult_verified: true,
        adult_verified_at: input.verifiedAt,
        adult_verification_method: "pass",
        candidate_sync_state: "authoritative",
        promotion_readiness_state: "promoted",
        promotion_readiness_updated_at: input.verifiedAt,
        authority_mode: "canonical_authoritative",
        enforcement_mode: "enforced",
        runtime_authoritative: false,
        serving_authoritative: true,
        candidate_authoritative: false,
        rollback_safe: false,
        fail_open: false,
        correlation_keys: {
          profileId: input.profileId,
          requestId: input.requestId,
        },
        aggregate_metadata: {
          mutation:
            "canonical_profiles.is_adult_verified,canonical_profiles.adult_verified_at,canonical_profiles.adult_verification_method",
          verificationMethod: "pass",
          sourceSurface: "profile.adult_verification",
          sourceSymbol: "completePassVerification",
        },
        observed_at: input.verifiedAt,
        updated_at: input.verifiedAt,
      },
      { onConflict: "profile_id" }
    )

  if (error) {
    throw new InfrastructureError("PASS_VERIFICATION_UPSERT_FAILED", {
      cause: error,
      metadata: {
        requestId: input.requestId,
        profileId: input.profileId,
      },
    })
  }
}
