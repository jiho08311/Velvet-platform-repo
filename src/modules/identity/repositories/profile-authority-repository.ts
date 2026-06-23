// src/modules/identity/repositories/profile-authority-repository.ts
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ProfileAuthorityWriteContext = {
  actorType: "user" | "admin" | "system" | "migration"
  reason: string
  sourceSurface: string
  sourceSymbol: string
  occurredAt: string
}

type CanonicalProfileRow = {
  id: string
  profile_id: string | null
  username: string | null
  display_name: string | null
  aggregate_metadata: Record<string, unknown> | null
  created_at: string
}

function mergeMetadata(
  existing: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>,
) {
  return {
    ...(existing ?? {}),
    ...patch,
  }
}

export async function readProfileAuthority(profileId: string) {
  return supabaseAdmin
    .from("canonical_profiles")
    .select("id, profile_id, username, display_name, aggregate_metadata, created_at")
    .eq("profile_id", profileId)
    .maybeSingle<CanonicalProfileRow>()
}

export async function recordIdentityVerification(input: {
  profileId: string
  birthDate: string
  isAdultVerified: boolean
  verificationMethod: "self_reported" | "pass"
  context: ProfileAuthorityWriteContext
}) {
  const now = input.context.occurredAt

  return supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: input.profileId,
        birth_date: input.birthDate,
        is_adult_verified: input.isAdultVerified,
        adult_verified_at: input.isAdultVerified ? now : null,
        adult_verification_method: input.verificationMethod,
        candidate_sync_state: "authoritative",
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
          mutation: "canonical_profiles.identity_verification",
          isAdultVerified: input.isAdultVerified,
          verificationMethod: input.verificationMethod,
          sourceSurface: input.context.sourceSurface,
          sourceSymbol: input.context.sourceSymbol,
          reason: input.context.reason,
        },
        observed_at: now,
        updated_at: now,
      },
      { onConflict: "profile_id" },
    )
}

export async function updateProfileDisplayIdentity(input: {
  profileId: string
  displayName: string
  bio: string
  avatarUrl?: string | null
  context: ProfileAuthorityWriteContext
}) {
  const { data: existing, error: existingError } =
    await readProfileAuthority(input.profileId)

  if (existingError) return { data: null, error: existingError }

  const now = input.context.occurredAt

  return supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: input.profileId,
        username: existing?.username ?? null,
        display_name: input.displayName,
        candidate_sync_state: "authoritative",
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
        aggregate_metadata: mergeMetadata(existing?.aggregate_metadata, {
          bio: input.bio,
          avatarUrl: input.avatarUrl ?? null,
          mutation: "canonical_profiles.display_identity",
          sourceSurface: input.context.sourceSurface,
          sourceSymbol: input.context.sourceSymbol,
          reason: input.context.reason,
        }),
        observed_at: now,
        updated_at: now,
      },
      { onConflict: "profile_id" },
    )
    .select("id, profile_id, username, display_name, aggregate_metadata, created_at")
    .single<CanonicalProfileRow>()
}

export async function claimProfileUsername(input: {
  profileId: string
  username: string
  context: ProfileAuthorityWriteContext
}) {
  const now = input.context.occurredAt

  return supabaseAdmin
    .from("canonical_profiles")
    .upsert(
      {
        profile_id: input.profileId,
        username: input.username,
        profile_lifecycle_state: "active",
        lifecycle_state: "active",
        identity_visibility_state: "visible",
        candidate_sync_state: "authoritative",
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
          mutation: "canonical_profiles.username",
          sourceSurface: input.context.sourceSurface,
          sourceSymbol: input.context.sourceSymbol,
          reason: input.context.reason,
        },
        observed_at: now,
        updated_at: now,
      },
      { onConflict: "profile_id" },
    )
}

export async function readDuplicateUsername(input: {
  profileId: string
  username: string
}) {
  return supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id")
    .ilike("username", input.username)
    .neq("profile_id", input.profileId)
    .maybeSingle<{ profile_id: string }>()
}