// src/modules/identity/repositories/account-lifecycle-repository.ts
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type AccountLifecycleContext = {
  actorType: "user" | "admin" | "system"
  reason: string
  sourceSurface: string
  sourceSymbol: string
  occurredAt: string
}

export async function transitionProfileToDeletePending(input: {
  profileId: string
  context: AccountLifecycleContext
}) {
  const now = input.context.occurredAt

  return supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: input.profileId,
        lifecycle_state: "delete_pending",
        profile_lifecycle_state: "delete_pending",
        identity_visibility_state: "not_visible",
        deleted_at: null,
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
          profileId: input.profileId,
        },
        aggregate_metadata: {
          mutation:
            "canonical_profiles.profile_lifecycle_state,canonical_profiles.identity_visibility_state",
          lifecycleReason: input.context.reason,
          sourceSurface: input.context.sourceSurface,
          sourceSymbol: input.context.sourceSymbol,
        },
        observed_at: now,
        updated_at: now,
      },
      { onConflict: "profile_id" },
    )
}

export async function transitionProfileToActive(input: {
  profileId: string
  context: AccountLifecycleContext
}) {
  const now = input.context.occurredAt

  return supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: input.profileId,
        lifecycle_state: "active",
        profile_lifecycle_state: "active",
        identity_visibility_state: "visible",
        deleted_at: null,
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
          profileId: input.profileId,
        },
        aggregate_metadata: {
          mutation:
            "canonical_profiles.profile_lifecycle_state,canonical_profiles.identity_visibility_state",
          lifecycleReason: input.context.reason,
          sourceSurface: input.context.sourceSurface,
          sourceSymbol: input.context.sourceSymbol,
        },
        observed_at: now,
        updated_at: now,
      },
      { onConflict: "profile_id" },
    )
}

export async function transitionProfileToDeactivated(input: {
  profileId: string
  context: AccountLifecycleContext
}) {
  const now = input.context.occurredAt

  return supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: input.profileId,
        lifecycle_state: "deactivated",
        profile_lifecycle_state: "deactivated",
        identity_visibility_state: "not_visible",
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
          profileId: input.profileId,
        },
        aggregate_metadata: {
          mutation:
            "canonical_profiles.profile_lifecycle_state,canonical_profiles.identity_visibility_state",
          lifecycleReason: input.context.reason,
          sourceSurface: input.context.sourceSurface,
          sourceSymbol: input.context.sourceSymbol,
        },
        observed_at: now,
        updated_at: now,
      },
      { onConflict: "profile_id" },
    )
}

export async function transitionProfileToDeleted(input: {
  profileId: string
  deletedAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_profiles")
    .update({
      lifecycle_state: "deleted",
      profile_lifecycle_state: "deleted",
      identity_visibility_state: "not_visible",
      updated_at: input.deletedAt,
    })
    .eq("profile_id", input.profileId)

  if (error) {
    throw error
  }
}

export async function transitionCreatorsForAccountDeletion(input: {
  profileId: string
  context: AccountLifecycleContext
}) {
  const now = input.context.occurredAt

  return supabaseAdmin
    .from("canonical_creators")
    .update({
      status: "suspended",
      creator_lifecycle_state: "suspended",
      creator_visibility_state: "not_public",
      creator_moderation_state: "not_evaluated",
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
      aggregate_metadata: {
        mutation:
          "canonical_creators.status,canonical_creators.creator_lifecycle_state,canonical_creators.creator_visibility_state",
        lifecycleReason: input.context.reason,
        sourceSurface: input.context.sourceSurface,
        sourceSymbol: input.context.sourceSymbol,
      },
      updated_at: now,
    })
    .eq("user_id", input.profileId)
}

export async function transitionCreatorsForAccountReactivation(input: {
  profileId: string
  context: AccountLifecycleContext
}) {
  const now = input.context.occurredAt

  return supabaseAdmin
    .from("canonical_creators")
    .update({
      status: "active",
      creator_lifecycle_state: "active",
      creator_visibility_state: "public_candidate",
      creator_moderation_state: "not_evaluated",
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
      aggregate_metadata: {
        mutation:
          "canonical_creators.status,canonical_creators.creator_lifecycle_state,canonical_creators.creator_visibility_state",
        lifecycleReason: input.context.reason,
        sourceSurface: input.context.sourceSurface,
        sourceSymbol: input.context.sourceSymbol,
      },
      updated_at: now,
    })
    .eq("user_id", input.profileId)
}
