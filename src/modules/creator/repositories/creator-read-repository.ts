// src/modules/creator/repositories/creator-read-repository.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type {
  CanonicalCreatorReadRow,
  CanonicalProfileReadRow,
  CreatorByUserIdRow,
  CreatorListRow,
  CreatorProfileByUserIdRow,
  CreatorServingStatus,
  CreatorVisibilityState,
} from "./creator-read-repository-types"

export type {
  CreatorByIdRow,
  CreatorByUserIdRow,
  CreatorByUsernameRow,
  CreatorProfileByUserIdRow,
  CreatorServingStatus,
  CreatorVisibilityState,
} from "./creator-read-repository-types"

function creatorSelect() {
  return "id, creator_id, user_id, profile_id, username, display_name, status, creator_lifecycle_state, creator_visibility_state, aggregate_metadata, created_at, updated_at"
}

function profileSelect() {
  return "profile_id, username, display_name, profile_lifecycle_state, identity_visibility_state, aggregate_metadata"
}

function numberMetadata(
  metadata: Record<string, unknown> | null,
  key: string,
  fallback: number
): number {
  const value = metadata?.[key]
  return typeof value === "number" ? value : fallback
}

function stringMetadata(
  metadata: Record<string, unknown> | null,
  key: string
): string | null {
  const value = metadata?.[key]
  return typeof value === "string" ? value : null
}

function creatorStatus(row: CanonicalCreatorReadRow): CreatorServingStatus {
  const status = row.creator_lifecycle_state ?? row.status ?? "pending"
  if (
    status === "pending" ||
    status === "active" ||
    status === "suspended" ||
    status === "banned" ||
    status === "inactive"
  ) {
    return status
  }

  return "pending"
}

function creatorVisibility(row: CanonicalCreatorReadRow): CreatorVisibilityState {
  return row.creator_visibility_state === "public_candidate"
    ? "public_candidate"
    : "not_public"
}

function toCreatorByUserIdRow(row: CanonicalCreatorReadRow): CreatorByUserIdRow {
  const metadata = row.aggregate_metadata ?? {}

  return {
    id: row.creator_id ?? row.id,
    user_id: row.user_id ?? row.profile_id ?? "",
    username: row.username,
    status: creatorStatus(row),
    creator_visibility_state: creatorVisibility(row),
    subscription_price: numberMetadata(metadata, "subscriptionPrice", 0),
    subscription_currency: stringMetadata(metadata, "subscriptionCurrency") ?? "KRW",
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function toCreatorListRow(row: CanonicalCreatorReadRow): CreatorListRow {
  const base = toCreatorByUserIdRow(row)

  return {
    ...base,
    subscription_price: base.subscription_price ?? 0,
    subscription_currency: base.subscription_currency ?? "KRW",
  }
}

async function readCanonicalCreatorBy(
  column: "creator_id" | "user_id" | "username",
  value: string
) {
  return supabaseAdmin
    .from("canonical_creators")
    .select(creatorSelect())
    .eq(column, value)
    .maybeSingle<CanonicalCreatorReadRow>()
}

export async function readCreatorRowByUserId(userId: string) {
  const { data, error } = await readCanonicalCreatorBy("user_id", userId)

  return {
    data: data ? toCreatorByUserIdRow(data) : null,
    error,
  }
}

export async function readCreatorRowById(creatorId: string) {
  const { data, error } = await readCanonicalCreatorBy("creator_id", creatorId)
  const row = data ? toCreatorByUserIdRow(data) : null

  return {
    data: row
      ? {
          id: row.id,
          user_id: row.user_id,
          username: row.username,
          subscription_price: row.subscription_price,
          subscription_currency: row.subscription_currency,
          status: row.status,
          creator_visibility_state: row.creator_visibility_state,
          created_at: row.created_at,
        }
      : null,
    error,
  }
}

export async function readCreatorRowByUsername(username: string) {
  const { data, error } = await supabaseAdmin
    .from("canonical_creators")
    .select(creatorSelect())
    .ilike("username", username)
    .maybeSingle<CanonicalCreatorReadRow>()

  const row = data ? toCreatorListRow(data) : null

  return {
    data: row
      ? {
          id: row.id,
          user_id: row.user_id,
          status: row.status,
          creator_visibility_state: row.creator_visibility_state,
          subscription_price: row.subscription_price,
          subscription_currency: row.subscription_currency,
          created_at: row.created_at,
          updated_at: row.updated_at,
          username: row.username ?? "",
        }
      : null,
    error,
  }
}

export async function readActiveCreatorRows(limit: number) {
  const { data, error } = await supabaseAdmin
    .from("canonical_creators")
    .select(creatorSelect())
    .eq("creator_visibility_state", "public_candidate")
    .eq("serving_authoritative", true)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<CanonicalCreatorReadRow[]>()

  return {
    data: (data ?? []).map(toCreatorListRow),
    error,
  }
}

export async function readPublicCreatorRowsByUserIds({
  userIds,
}: {
  userIds: string[]
  sourceSurface: string
}) {
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean)

  if (uniqueUserIds.length === 0) {
    return {
      data: [] satisfies CreatorListRow[],
      error: null,
    }
  }

  const { data, error } = await supabaseAdmin
    .from("canonical_creators")
    .select(creatorSelect())
    .in("user_id", uniqueUserIds)
    .eq("creator_visibility_state", "public_candidate")
    .eq("serving_authoritative", true)
    .returns<CanonicalCreatorReadRow[]>()

  return {
    data: (data ?? []).map(toCreatorListRow),
    error,
  }
}

function toCreatorProfileByUserIdRow(
  row: CanonicalProfileReadRow
): CreatorProfileByUserIdRow {
  const metadata = row.aggregate_metadata ?? {}
  const lifecycle = row.profile_lifecycle_state ?? "active"

  return {
    id: row.profile_id ?? "",
    username: row.username,
    display_name: row.display_name,
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

export async function readBasicCreatorProfileRowByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select(profileSelect())
    .eq("profile_id", userId)
    .maybeSingle<CanonicalProfileReadRow>()

  return {
    data: data ? toCreatorProfileByUserIdRow(data) : null,
    error,
  }
}

export async function readPublicCreatorProfileRowByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select(profileSelect())
    .eq("profile_id", userId)
    .maybeSingle<CanonicalProfileReadRow>()

  return {
    data: data ? (toCreatorProfileByUserIdRow(data) as Required<CreatorProfileByUserIdRow>) : null,
    error,
  }
}

export async function readPublicCreatorProfileRowsByUserIds(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))

  if (uniqueUserIds.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select(profileSelect())
    .in("profile_id", uniqueUserIds)
    .returns<CanonicalProfileReadRow[]>()

  return {
    data: (data ?? []).map(toCreatorProfileByUserIdRow),
    error,
  }
}
