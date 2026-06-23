import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  createClient,
  createSupabaseServerClient,
} from "@/infrastructure/supabase/server"
import type {
  CreatorDashboardSubscriptionStateRow,
  CreatorSubscriberRow,
  CreatorSubscriptionWithProfileRow,
  FindLatestByUserAndCreatorInput,
  FindOwnedSubscriptionForUnsubscribeInput,
  ListCreatorSubscriberRowsInput,
  SubscriptionCountResult,
  SubscriptionCreatorIdRow,
  SubscriptionOwnershipRow,
  SubscriptionReadModelRow,
  SubscriptionRow,
  SubscriptionWithCreatorRow,
} from "./subscription-read-repository-types"

export type {
  CreatorDashboardSubscriptionStateRow,
  SubscriptionCreatorIdRow,
  SubscriptionReadModelRow,
  SubscriptionRow,
} from "./subscription-read-repository-types"

export async function findLatestByUserAndCreator({
  userId,
  creatorId,
}: FindLatestByUserAndCreatorInput): Promise<SubscriptionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select(
      "id, user_id, creator_id, status, provider, provider_subscription_id, cancel_at_period_end, current_period_start, current_period_end, canceled_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .returns<SubscriptionRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findLatestAccessibleByUserAndCreator({
  userId,
  creatorId,
}: FindLatestByUserAndCreatorInput): Promise<SubscriptionRow[]> {
  return findLatestByUserAndCreator({
    userId,
    creatorId,
  })
}

export async function countSubscriptionsByCreatorId(
  creatorId: string
): Promise<SubscriptionCountResult> {
  const supabase = await createSupabaseServerClient()

  const { count, error } = await supabase
    .from("canonical_subscription_state")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId)

  return { count, error }
}

export async function countActiveSubscriptionsByCreatorId(
  creatorId: string
): Promise<SubscriptionCountResult> {
  const supabase = await createSupabaseServerClient()

  const { count, error } = await supabase
    .from("canonical_subscription_state")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .eq("status", "active")

  return { count, error }
}

export async function countSubscriptions(): Promise<SubscriptionCountResult> {
  const { count, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select("*", { count: "exact", head: true })

  return { count, error }
}

export async function countActiveSubscriptions(): Promise<SubscriptionCountResult> {
  const { count, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  return { count, error }
}

export async function listCreatorDashboardSubscriptionStateRows(
  creatorId: string
): Promise<CreatorDashboardSubscriptionStateRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("canonical_subscription_state")
    .select("status, current_period_end, cancel_at_period_end, canceled_at")
    .eq("creator_id", creatorId)
    .returns<CreatorDashboardSubscriptionStateRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listActiveSubscriptionCreatorIdsByUserId(
  userId: string
): Promise<SubscriptionCreatorIdRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select("creator_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .returns<SubscriptionCreatorIdRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listSubscriptionReadModelRowsByUserId(
  userId: string
): Promise<SubscriptionReadModelRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select(
      "id, user_id, creator_id, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .returns<SubscriptionReadModelRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

// ✅ wave-013 추가 (여기에 붙이면 됨)
export async function findLatestViewerSubscriptionByUserAndCreator({
  userId,
  creatorId,
}: FindLatestByUserAndCreatorInput): Promise<SubscriptionReadModelRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select(
      "id, user_id, creator_id, current_period_start, current_period_end, cancel_at_period_end, status, canceled_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<SubscriptionReadModelRow[]>()

  if (error) {
    throw error
  }

  return data?.[0] ?? null
}

export async function findSubscriptionWithCreatorById(
  subscriptionId: string
): Promise<SubscriptionWithCreatorRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select(
      `
      id,
      user_id,
      creator_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      canceled_at,
      created_at,
      updated_at,
      creator:creators(
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq("id", subscriptionId)
    .maybeSingle<SubscriptionWithCreatorRow>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function findOwnedSubscriptionForUnsubscribe({
  subscriptionId,
  userId,
}: FindOwnedSubscriptionForUnsubscribeInput): Promise<SubscriptionOwnershipRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("canonical_subscription_state")
    .select("id, user_id, creator_id")
    .eq("id", subscriptionId)
    .eq("user_id", userId)
    .single<SubscriptionOwnershipRow>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function listSubscriptionsWithCreatorByUserId(
  userId: string
): Promise<SubscriptionWithCreatorRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select(
      `
        id,
        user_id,
        creator_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        canceled_at,
        created_at,
        updated_at,
        creator:creators(
          id,
          username,
          display_name,
          avatar_url
        )
      `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<SubscriptionWithCreatorRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listCreatorSubscriberRows({
  creatorId,
  limit,
  cursor,
}: ListCreatorSubscriberRowsInput): Promise<CreatorSubscriberRow[]> {
  let query = supabaseAdmin
    .from("canonical_subscription_state")
    .select(
      `
    id,
    user_id,
    created_at,
    status,
    current_period_end,
    cancel_at_period_end,
    canceled_at,
    profiles:user_id (
      username,
      display_name,
      avatar_url
    )
  `
    )
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(limit + 20)

  if (cursor) {
    query = query.lt("created_at", cursor)
  }

  const { data, error } = await query.returns<CreatorSubscriberRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listSubscriptionsWithProfilesByCreatorId(
  creatorId: string
): Promise<CreatorSubscriptionWithProfileRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("canonical_subscription_state")
    .select(
      `
        id,
        status,
        created_at,
        user_id,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
    )
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as CreatorSubscriptionWithProfileRow[]
}
