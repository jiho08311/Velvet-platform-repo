import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createClient } from "@/infrastructure/supabase/server"

export type SubscriptionStatus = "incomplete" | "active" | "canceled" | "expired"
export type SubscriptionProvider = "toss" | "mock"

export type SubscriptionRow = {
  id: string
  user_id: string
  creator_id: string
  status: SubscriptionStatus
  provider: SubscriptionProvider
  provider_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  cancel_at_period_end: boolean | null
  created_at: string
  updated_at: string
}

export type SubscriptionCancelRow = {
  id: string
  user_id: string
  creator_id: string
  status: SubscriptionStatus
  current_period_end: string | null
  canceled_at: string | null
  cancel_at_period_end: boolean | null
}

type FindActiveSubscriptionForUpsertInput = {
  userId: string
  creatorId: string
}

type UpdateSubscriptionForUpsertInput = {
  id: string
  status: SubscriptionStatus
  provider: SubscriptionProvider
  providerSubscriptionId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  cancelAtPeriodEnd: boolean
  updatedAt: string
}

type InsertSubscriptionForUpsertInput = {
  userId: string
  creatorId: string
  status: SubscriptionStatus
  provider: SubscriptionProvider
  providerSubscriptionId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  cancelAtPeriodEnd: boolean
}

type CancelSubscriptionByUserAndCreatorInput = {
  userId: string
  creatorId: string
  canceledAt: string
  updatedAt: string
}

type UnsubscribeByIdInput = {
  subscriptionId: string
  canceledAt: string
  updatedAt: string
}

type ExpireActiveSubscriptionsByUserAndCreatorInput = {
  userId: string
  creatorId: string
  canceledAt: string
  updatedAt: string
}

type ExpireSubscriptionsByCreatorIdsInput = {
  creatorIds: string[]
  canceledAt: string
}

type ExpireSubscriptionsByUserIdInput = {
  userId: string
  canceledAt: string
}

const SUBSCRIPTION_WRITE_SELECT =
  "id, user_id, creator_id, status, provider, provider_subscription_id, current_period_start, current_period_end, canceled_at, cancel_at_period_end, created_at, updated_at"

const SUBSCRIPTION_CANCEL_SELECT =
  "id, user_id, creator_id, status, current_period_end, canceled_at, cancel_at_period_end"

export async function findActiveSubscriptionForUpsert({
  userId,
  creatorId,
}: FindActiveSubscriptionForUpsertInput): Promise<SubscriptionRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select(SUBSCRIPTION_WRITE_SELECT)
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>()

  if (error) {
    throw error
  }

  return data
}

export async function cancelSubscriptionByUserAndCreator({
  userId,
  creatorId,
  canceledAt,
  updatedAt,
}: CancelSubscriptionByUserAndCreatorInput): Promise<SubscriptionCancelRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .update({
      cancel_at_period_end: true,
      canceled_at: canceledAt,
      updated_at: updatedAt,
    })
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .select(SUBSCRIPTION_CANCEL_SELECT)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionCancelRow>()

  if (error) {
    throw error
  }

  return data
}

export async function unsubscribeById({
  subscriptionId,
  canceledAt,
  updatedAt,
}: UnsubscribeByIdInput): Promise<SubscriptionCancelRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("canonical_subscription_state")
    .update({
      cancel_at_period_end: true,
      canceled_at: canceledAt,
      updated_at: updatedAt,
    })
    .eq("id", subscriptionId)
    .select(SUBSCRIPTION_CANCEL_SELECT)
    .maybeSingle<SubscriptionCancelRow>()

  if (error) {
    throw new Error("Failed to unsubscribe")
  }

  return data
}

export async function updateSubscriptionForUpsert({
  id,
  status,
  provider,
  providerSubscriptionId,
  currentPeriodStart,
  currentPeriodEnd,
  canceledAt,
  cancelAtPeriodEnd,
  updatedAt,
}: UpdateSubscriptionForUpsertInput): Promise<SubscriptionRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .update({
      status,
      provider,
      provider_subscription_id: providerSubscriptionId,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      canceled_at: canceledAt,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: updatedAt,
    })
    .eq("id", id)
    .select(SUBSCRIPTION_WRITE_SELECT)
    .single<SubscriptionRow>()

  if (error) {
    throw error
  }

  return data
}

export async function insertSubscriptionForUpsert({
  userId,
  creatorId,
  status,
  provider,
  providerSubscriptionId,
  currentPeriodStart,
  currentPeriodEnd,
  canceledAt,
  cancelAtPeriodEnd,
}: InsertSubscriptionForUpsertInput): Promise<SubscriptionRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .insert({
      user_id: userId,
      creator_id: creatorId,
      status,
      provider,
      provider_subscription_id: providerSubscriptionId,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      canceled_at: canceledAt,
      cancel_at_period_end: cancelAtPeriodEnd,
    })
    .select(SUBSCRIPTION_WRITE_SELECT)
    .single<SubscriptionRow>()

  if (error) {
    throw error
  }

  return data
}
export async function expireActiveSubscriptionsByUserAndCreator({
  userId,
  creatorId,
  canceledAt,
  updatedAt,
}: ExpireActiveSubscriptionsByUserAndCreatorInput): Promise<SubscriptionCancelRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .update({
      status: "expired",
      cancel_at_period_end: false,
      canceled_at: canceledAt,
      updated_at: updatedAt,
    })
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .select(SUBSCRIPTION_CANCEL_SELECT)
    .returns<SubscriptionCancelRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}
export async function expireSubscriptionsByCreatorIds({
  creatorIds,
  canceledAt,
}: ExpireSubscriptionsByCreatorIdsInput): Promise<SubscriptionCancelRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .update({
      status: "expired",
      canceled_at: canceledAt,
    })
    .in("creator_id", creatorIds)
    .select(SUBSCRIPTION_CANCEL_SELECT)
    .returns<SubscriptionCancelRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}
export async function expireSubscriptionsByUserId({
  userId,
  canceledAt,
}: ExpireSubscriptionsByUserIdInput): Promise<SubscriptionCancelRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .update({
      status: "expired",
      canceled_at: canceledAt,
    })
    .eq("user_id", userId)
    .select(SUBSCRIPTION_CANCEL_SELECT)
    .returns<SubscriptionCancelRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}