import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createClient } from "@/infrastructure/supabase/server"

type SubscriptionStatus = "incomplete" | "active" | "canceled" | "expired"
type SubscriptionProvider = "toss" | "mock"

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

type SubscriptionIdentityRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export type SubscriptionRow = SubscriptionReadModelRow & {
  provider: SubscriptionProvider
  provider_subscription_id: string | null
  cancel_at_period_end: boolean
}

type FindLatestByUserAndCreatorInput = {
  userId: string
  creatorId: string
}

type SubscriptionWithCreatorRow = SubscriptionReadModelRow & {
  creator: SubscriptionIdentityRow | SubscriptionIdentityRow[] | null
}

type CreatorSubscriberRow = {
  id: string
  user_id: string
  created_at: string
  status: "incomplete" | "active" | "canceled" | "expired"
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  canceled_at: string | null
  profiles: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
}

type ListCreatorSubscriberRowsInput = {
  creatorId: string
  limit: number
  cursor?: string | null
}

type CreatorSubscriptionWithProfileRow = {
  id: string
  status: "incomplete" | "active" | "canceled" | "expired"
  created_at: string
  user_id: string
  profiles:
    | {
        id: string
        username: string | null
        display_name: string | null
        avatar_url: string | null
      }
    | {
        id: string
        username: string | null
        display_name: string | null
        avatar_url: string | null
      }[]
    | null
}

export async function findLatestByUserAndCreator({
  userId,
  creatorId,
}: FindLatestByUserAndCreatorInput): Promise<SubscriptionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
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

// ✅ wave-013 추가 (여기에 붙이면 됨)
export async function findLatestViewerSubscriptionByUserAndCreator({
  userId,
  creatorId,
}: FindLatestByUserAndCreatorInput): Promise<SubscriptionReadModelRow | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
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
    .from("subscriptions")
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

export async function listSubscriptionsWithCreatorByUserId(
  userId: string
): Promise<SubscriptionWithCreatorRow[]> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
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
    .from("subscriptions")
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
    .from("subscriptions")
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
