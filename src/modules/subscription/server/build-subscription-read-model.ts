import { resolveSubscriptionState } from "@/modules/subscription/lib/resolve-subscription-state"
import type { SubscriptionStatus } from "@/modules/subscription/server/subscription-status"

export type SubscriptionReadModelState =
  | "active"
  | "ending"
  | "expired"
  | "inactive"

export type SubscriptionReadModelDisplayStatus =
  | "active"
  | "canceled"
  | "expired"
  | "inactive"

export type SubscriptionIdentityRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export type SubscriptionIdentity = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export type SubscriptionReadModel = {
  id: string
  userId: string
  creatorId: string
  status: SubscriptionStatus
  hasAccess: boolean
  state: SubscriptionReadModelState
  isCancelScheduled: boolean
  endsAt: string | null
  currentPeriodStartAt: string | null
  currentPeriodEndAt: string | null
  canceledAt: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}

export type SubscriptionReadModelRow = {
  id: string
  user_id: string
  creator_id: string
  status: SubscriptionStatus
  current_period_start?: string | null
  current_period_end?: string | null
  canceled_at?: string | null
  cancel_at_period_end?: boolean | null
  created_at: string
  updated_at: string
}

export function buildSubscriptionReadModel(
  row: SubscriptionReadModelRow,
  now?: Date
): SubscriptionReadModel {
  const resolved = resolveSubscriptionState({
    status: row.status,
    currentPeriodEndAt: row.current_period_end ?? null,
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
    canceledAt: row.canceled_at ?? null,
    now,
  })

  return {
    id: row.id,
    userId: row.user_id,
    creatorId: row.creator_id,
    status: row.status,
    hasAccess: resolved.hasAccess,
    state: resolved.displayState,
    isCancelScheduled: resolved.isCancelScheduled,
    endsAt: resolved.endsAt,
    currentPeriodStartAt: row.current_period_start ?? null,
    currentPeriodEndAt: row.current_period_end ?? null,
    canceledAt: row.canceled_at ?? null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function buildSubscriptionIdentity(
  row: SubscriptionIdentityRow
): SubscriptionIdentity {
  const username = typeof row.username === "string" ? row.username.trim() : ""
  const displayNameSource =
    typeof row.display_name === "string" ? row.display_name.trim() : ""

  return {
    id: row.id,
    username,
    displayName: displayNameSource || username || "Creator",
    avatarUrl: row.avatar_url,
  }
}

export function toSubscriptionDisplayStatus(
  state: SubscriptionReadModelState
): SubscriptionReadModelDisplayStatus {
  if (state === "ending") {
    return "canceled"
  }

  return state
}

export function findLatestSubscriptionReadModel(
  rows: SubscriptionReadModelRow[],
  now?: Date
): SubscriptionReadModel | null {
  const row = rows[0]

  if (!row) {
    return null
  }

  return buildSubscriptionReadModel(row, now)
}

export function findLatestAccessibleSubscriptionReadModel(
  rows: SubscriptionReadModelRow[],
  now?: Date
): SubscriptionReadModel | null {
  for (const row of rows) {
    const readModel = buildSubscriptionReadModel(row, now)

    if (readModel.hasAccess) {
      return readModel
    }
  }

  return null
}
