import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ActiveIdentityBlockReason =
  | "profile_not_found"
  | "account_deleted"
  | "account_requires_reactivation"

export type OnboardingReadinessBlockReason =
  | "profile_not_found"
  | "username_required"

export type CanonicalProfileStatusRow = {
  profile_lifecycle_state: string | null
  identity_visibility_state: string | null
  username: string | null
}

export type ProfileIdentityReadModel = {
  id: string
  username: string | null
  is_deactivated?: boolean | null
  is_delete_pending?: boolean | null
  delete_scheduled_for?: string | null
  deleted_at?: string | null
}

function normalizeLifecycle(value: string | null | undefined) {
  if (
    value === "active" ||
    value === "deactivated" ||
    value === "delete_pending" ||
    value === "banned" ||
    value === "deleted"
  ) {
    return value
  }

  return null
}

export async function readCanonicalProfileStatus(userId: string) {
  return supabaseAdmin
    .from("canonical_profiles")
    .select("profile_lifecycle_state, identity_visibility_state, username")
    .eq("profile_id", userId)
    .maybeSingle<CanonicalProfileStatusRow>()
}

export function resolveActiveIdentityState(input: {
  canonical?: CanonicalProfileStatusRow | null
}):
  | { ok: true }
  | { ok: false; reason: ActiveIdentityBlockReason } {
  const lifecycle = normalizeLifecycle(input.canonical?.profile_lifecycle_state)

  if (!input.canonical) {
    return { ok: false, reason: "profile_not_found" }
  }

  if (lifecycle === "deleted") {
    return { ok: false, reason: "account_deleted" }
  }

  if (lifecycle === "delete_pending") {
    return { ok: false, reason: "account_requires_reactivation" }
  }

  if (lifecycle === "deactivated" || lifecycle === "banned") {
    return { ok: false, reason: "account_requires_reactivation" }
  }

  if (lifecycle === "active") {
    return { ok: true }
  }

  return { ok: false, reason: "profile_not_found" }
}

export function resolveOnboardingReadiness(input: {
  canonical?: CanonicalProfileStatusRow | null
}):
  | { ok: true }
  | { ok: false; reason: OnboardingReadinessBlockReason } {
  if (!input.canonical) {
    return { ok: false, reason: "profile_not_found" }
  }

  if (!input.canonical.username) {
    return { ok: false, reason: "username_required" }
  }

  return { ok: true }
}

export async function readCanonicalProfileIdentityByUserId(userId: string) {
  return supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, username, profile_lifecycle_state")
    .eq("profile_id", userId)
    .maybeSingle<{
      profile_id: string
      username: string | null
      profile_lifecycle_state: string | null
    }>()
}

export async function readCanonicalProfileIdentityByUsername(username: string) {
  return supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, username, profile_lifecycle_state")
    .ilike("username", username)
    .maybeSingle<{
      profile_id: string
      username: string | null
      profile_lifecycle_state: string | null
    }>()
}