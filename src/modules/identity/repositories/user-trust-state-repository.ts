import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type UserTrustState =
  | "NORMAL"
  | "WARNED"
  | "RESTRICTED"
  | "SUSPENDED"
  | "BANNED"

function toProfileLifecycleState(trustState: UserTrustState) {
  if (trustState === "SUSPENDED" || trustState === "BANNED") {
    return "banned"
  }

  return "active"
}

function toIdentityVisibilityState(trustState: UserTrustState) {
  if (trustState === "SUSPENDED" || trustState === "BANNED") {
    return "not_visible"
  }

  if (trustState === "RESTRICTED") {
    return "limited"
  }

  return "visible"
}

export async function applyUserTrustState(input: {
  userId: string
  trustState: UserTrustState
  reason: string
  occurredAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: input.userId,
        lifecycle_state: toProfileLifecycleState(input.trustState),
        profile_lifecycle_state: toProfileLifecycleState(input.trustState),
        identity_visibility_state: toIdentityVisibilityState(input.trustState),
        candidate_sync_state: "authoritative",
        promotion_readiness_state: "promoted",
        promotion_readiness_updated_at: input.occurredAt,
        authority_mode: "canonical_authoritative",
        enforcement_mode: "enforced",
        runtime_authoritative: true,
        serving_authoritative: true,
        candidate_authoritative: false,
        rollback_safe: false,
        fail_open: false,
        correlation_keys: {
          profileId: input.userId,
        },
        aggregate_metadata: {
          trustState: input.trustState,
          reason: input.reason,
          sourceSurface: "identity.user_trust_state",
          sourceSymbol: "applyUserTrustState",
        },
        observed_at: input.occurredAt,
        updated_at: input.occurredAt,
      },
      { onConflict: "profile_id" }
    )

  if (error) {
    throw error
  }
}