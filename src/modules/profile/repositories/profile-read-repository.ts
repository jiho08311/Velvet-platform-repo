import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ProfileByUserIdRow = {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  birth_date: string | null
  is_adult_verified: boolean | null
  adult_verified_at: string | null
  adult_verification_method: "self_reported" | "pass" | null
  created_at: string
}

export type PublicProfileByUsernameRow = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  is_deactivated: boolean
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean
}

export type ProfileIdByUsernameRow = {
  id: string
}

export type AdultVerificationStatusRow = {
  is_adult_verified: boolean | null
  adult_verification_method: "self_reported" | "pass" | null
}

type CanonicalProfileReadRow = {
  id: string
  profile_id: string | null
  username: string | null
  display_name: string | null
  lifecycle_state: string | null
  profile_lifecycle_state: string | null
  identity_visibility_state: string | null
  aggregate_metadata: Record<string, unknown> | null
  created_at: string
}

function stringMetadata(
  metadata: Record<string, unknown> | null,
  key: string
): string | null {
  const value = metadata?.[key]
  return typeof value === "string" ? value : null
}

function booleanMetadata(
  metadata: Record<string, unknown> | null,
  key: string
): boolean | null {
  const value = metadata?.[key]
  return typeof value === "boolean" ? value : null
}

function canonicalLifecycle(row: CanonicalProfileReadRow): string {
  return row.profile_lifecycle_state ?? row.lifecycle_state ?? "active"
}

function toProfileByUserIdRow(row: CanonicalProfileReadRow): ProfileByUserIdRow {
  const metadata = row.aggregate_metadata ?? {}

  return {
    id: row.profile_id ?? row.id,
    email: stringMetadata(metadata, "email") ?? "",
    username: row.username ?? "",
    display_name: row.display_name ?? row.username ?? "",
    avatar_url: stringMetadata(metadata, "avatarUrl"),
    bio: stringMetadata(metadata, "bio"),
    birth_date: stringMetadata(metadata, "birthDate"),
    is_adult_verified: booleanMetadata(metadata, "isAdultVerified"),
    adult_verified_at: stringMetadata(metadata, "adultVerifiedAt"),
    adult_verification_method:
      stringMetadata(metadata, "adultVerificationMethod") as
        | "self_reported"
        | "pass"
        | null,
    created_at: row.created_at,
  }
}

function toPublicProfileByUsernameRow(
  row: CanonicalProfileReadRow
): PublicProfileByUsernameRow {
  const metadata = row.aggregate_metadata ?? {}
  const lifecycle = canonicalLifecycle(row)

  return {
    id: row.profile_id ?? row.id,
    username: row.username ?? "",
    display_name: row.display_name ?? row.username ?? "",
    avatar_url: stringMetadata(metadata, "avatarUrl"),
    bio: stringMetadata(metadata, "bio"),
    is_deactivated: lifecycle === "deactivated",
    is_delete_pending: lifecycle === "delete_pending",
    deleted_at:
      lifecycle === "delete_pending" ? stringMetadata(metadata, "deletedAt") : null,
    is_banned:
      lifecycle === "banned" || row.identity_visibility_state === "not_visible",
  }
}

function canonicalProfileSelect() {
  return "id, profile_id, username, display_name, lifecycle_state, profile_lifecycle_state, identity_visibility_state, aggregate_metadata, created_at"
}

export async function searchPublicProfileRowsByIdentityQuery({
  query,
  limit,
  cursor,
}: {
  query: string
  limit: number
  cursor?: string | null
}) {
  let profilesQuery = supabaseAdmin
    .from("canonical_profiles")
    .select(canonicalProfileSelect())
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .eq("serving_authoritative", true)
    .order("username", { ascending: true })
    .limit(limit)

  if (cursor) {
    profilesQuery = profilesQuery.gt("username", cursor)
  }

  const { data, error } = await profilesQuery.returns<CanonicalProfileReadRow[]>()

  return {
    data: (data ?? []).map(toPublicProfileByUsernameRow),
    error,
  }
}

export async function readProfileRowByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select(canonicalProfileSelect())
    .eq("profile_id", userId)
    .maybeSingle<CanonicalProfileReadRow>()

  return {
    data: data ? toProfileByUserIdRow(data) : null,
    error,
  }
}

export async function readPublicProfileRowByUsername(username: string) {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select(canonicalProfileSelect())
    .ilike("username", username.trim().toLowerCase())
    .eq("serving_authoritative", true)
    .maybeSingle<CanonicalProfileReadRow>()

  return {
    data: data ? toPublicProfileByUsernameRow(data) : null,
    error,
  }
}

export async function readProfileIdRowByUsername(username: string) {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id")
    .ilike("username", username.trim().toLowerCase())
    .eq("serving_authoritative", true)
    .limit(1)
    .maybeSingle<{ profile_id: string | null }>()

  return {
    data: data?.profile_id ? { id: data.profile_id } : null,
    error,
  }
}

export async function readAdultVerificationRowByProfileId(profileId: string) {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("aggregate_metadata")
    .eq("profile_id", profileId)
    .maybeSingle<{ aggregate_metadata: Record<string, unknown> | null }>()

  const metadata = data?.aggregate_metadata ?? null

  return {
    data: data
      ? {
          is_adult_verified: booleanMetadata(metadata, "isAdultVerified"),
          adult_verification_method:
            stringMetadata(metadata, "adultVerificationMethod") as
              | "self_reported"
              | "pass"
              | null,
        }
      : null,
    error,
  }
}
