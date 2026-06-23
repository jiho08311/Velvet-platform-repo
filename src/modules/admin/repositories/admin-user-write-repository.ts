// src/modules/admin/repositories/admin-user-write-repository.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UpdateUserDeactivatedStateInput = {
  targetUserId: string
  deactivate: boolean
}

type UpdateUserBannedStateInput = {
  targetUserId: string
  ban: boolean
}

async function updateCanonicalProfileLifecycle({
  profileId,
  profileLifecycleState,
  identityVisibilityState,
  metadata,
}: {
  profileId: string
  profileLifecycleState: "active" | "deactivated" | "banned"
  identityVisibilityState: "visible" | "not_visible"
  metadata: Record<string, unknown>
}) {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: profileId,
        lifecycle_state: profileLifecycleState,
        profile_lifecycle_state: profileLifecycleState,
        identity_visibility_state: identityVisibilityState,
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
        aggregate_metadata: metadata,
        observed_at: now,
        updated_at: now,
      },
      { onConflict: "profile_id" }
    )

  if (error) {
    throw error
  }
}

export async function updateUserDeactivatedState({
  targetUserId,
  deactivate,
}: UpdateUserDeactivatedStateInput) {
  await updateCanonicalProfileLifecycle({
    profileId: targetUserId,
    profileLifecycleState: deactivate ? "deactivated" : "active",
    identityVisibilityState: deactivate ? "not_visible" : "visible",
    metadata: {
      deactivate,
      mutation: "canonical_profiles.profile_lifecycle_state",
      sourceSurface: "admin.profile.lifecycle",
      sourceSymbol: "updateUserDeactivatedState",
    },
  })
}

export async function updateUserBannedState({
  targetUserId,
  ban,
}: UpdateUserBannedStateInput) {
  await updateCanonicalProfileLifecycle({
    profileId: targetUserId,
    profileLifecycleState: ban ? "banned" : "active",
    identityVisibilityState: ban ? "not_visible" : "visible",
    metadata: {
      ban,
      mutation: "canonical_profiles.profile_lifecycle_state",
      sourceSurface: "admin.profile.lifecycle",
      sourceSymbol: "updateUserBannedState",
    },
  })
}
