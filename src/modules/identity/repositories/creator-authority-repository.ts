// src/modules/identity/repositories/creator-authority-repository.ts
import { randomUUID } from "crypto"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type CreatorAuthorityWriteContext = {
  actorType: "user" | "creator" | "admin" | "system" | "migration"
  reason: string
  sourceSurface: string
  sourceSymbol: string
  occurredAt: string
}

type CanonicalCreatorRow = {
  id: string
  creator_id: string | null
  user_id: string | null
  profile_id: string | null
  username: string | null
  display_name: string | null
  status: "pending" | "active" | "suspended"
  aggregate_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type CanonicalProfileRow = {
  profile_id: string | null
  username: string | null
  display_name: string | null
}

export async function readProfileForCreatorAuthority(profileId: string) {
  return supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, username, display_name")
    .eq("profile_id", profileId)
    .maybeSingle<CanonicalProfileRow>()
}

export async function readCreatorAuthorityByUserId(userId: string) {
  return supabaseAdmin
    .from("canonical_creators")
    .select(
      "id, creator_id, user_id, profile_id, username, display_name, status, aggregate_metadata, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle<CanonicalCreatorRow>()
}

export async function readCreatorAuthorityByCreatorId(creatorId: string) {
  return supabaseAdmin
    .from("canonical_creators")
    .select(
      "id, creator_id, user_id, profile_id, username, display_name, status, aggregate_metadata, created_at, updated_at",
    )
    .eq("creator_id", creatorId)
    .maybeSingle<CanonicalCreatorRow>()
}

export async function createCreatorAuthority(input: {
  profileId: string
  userId: string
  instagramUsername?: string | null
  subscriptionPrice?: number
  subscriptionCurrency?: string
  context: CreatorAuthorityWriteContext
}) {
  const creatorId = randomUUID()
  const now = input.context.occurredAt

  const { data: profile, error: profileError } =
    await readProfileForCreatorAuthority(input.profileId)

  if (profileError) return { data: null, error: profileError }
  if (!profile?.profile_id) {
    return { data: null, error: new Error("PROFILE_NOT_FOUND") }
  }

  const displayName = profile.display_name ?? profile.username

  return supabaseAdmin
    .from("canonical_creators")
    .upsert(
      {
        creator_id: creatorId,
        user_id: input.userId,
        profile_id: profile.profile_id,
        username: profile.username,
        display_name: displayName,
        status: "pending",
        operational_state: "active",
        creator_lifecycle_state: "pending",
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
        correlation_keys: {
          creatorId,
          profileId: profile.profile_id,
          userId: input.userId,
        },
        aggregate_metadata: {
          mutation: "canonical_creators.create",
          instagramUsername: input.instagramUsername ?? null,
          subscriptionPrice: input.subscriptionPrice ?? 0,
          subscriptionCurrency: input.subscriptionCurrency ?? "KRW",
          sourceSurface: input.context.sourceSurface,
          sourceSymbol: input.context.sourceSymbol,
          reason: input.context.reason,
        },
        observed_at: now,
        updated_at: now,
      },
      { onConflict: "creator_id" },
    )
    .select(
      "id, creator_id, user_id, profile_id, username, display_name, status, aggregate_metadata, created_at, updated_at",
    )
    .single<CanonicalCreatorRow>()
}

export async function updateCreatorConfiguration(input: {
  creatorId: string
  status?: "pending" | "active" | "suspended"
  subscriptionPrice?: number
  subscriptionCurrency?: string
  context: CreatorAuthorityWriteContext
}) {
  const { data: existing, error: existingError } =
    await readCreatorAuthorityByCreatorId(input.creatorId)

  if (existingError) return { data: null, error: existingError }
  if (!existing?.creator_id || !existing.user_id) {
    return { data: null, error: new Error("CREATOR_NOT_FOUND") }
  }

  const now = input.context.occurredAt
  const existingMetadata = existing.aggregate_metadata ?? {}

  const nextStatus = input.status ?? existing.status
  const nextSubscriptionPrice =
    input.subscriptionPrice ??
    (typeof existingMetadata.subscriptionPrice === "number"
      ? existingMetadata.subscriptionPrice
      : 0)

  const nextSubscriptionCurrency =
    input.subscriptionCurrency ??
    (typeof existingMetadata.subscriptionCurrency === "string"
      ? existingMetadata.subscriptionCurrency
      : "KRW")

  return supabaseAdmin
    .from("canonical_creators")
    .update({
      status: nextStatus,
      creator_lifecycle_state: nextStatus,
      creator_visibility_state:
        nextStatus === "active" ? "public_candidate" : "not_public",
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
        creatorId: input.creatorId,
        userId: existing.user_id,
      },
      aggregate_metadata: {
        ...existingMetadata,
        subscriptionPrice: nextSubscriptionPrice,
        subscriptionCurrency: nextSubscriptionCurrency,
        mutation: "canonical_creators.configuration_update",
        updatedFields: [
          ...(input.status !== undefined ? ["status"] : []),
          ...(input.subscriptionPrice !== undefined ? ["subscriptionPrice"] : []),
          ...(input.subscriptionCurrency !== undefined
            ? ["subscriptionCurrency"]
            : []),
        ],
        sourceSurface: input.context.sourceSurface,
        sourceSymbol: input.context.sourceSymbol,
        reason: input.context.reason,
      },
      updated_at: now,
    })
    .eq("creator_id", input.creatorId)
    .select(
      "id, creator_id, user_id, profile_id, username, display_name, status, aggregate_metadata, created_at, updated_at",
    )
    .single<CanonicalCreatorRow>()
}