import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import type { PayoutExecutionRow } from "@/modules/payout/mappers/build-payout-execution-read-model"
import { InfrastructureError } from "@/shared/errors"

export async function listPayoutRowsByCreatorId(
  creatorId: string
): Promise<PayoutExecutionRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_payout_state")
    .select("id, amount, currency, status, created_at, paid_at, failure_reason")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .returns<PayoutExecutionRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function listRecentPayoutRowsByCreatorId(
  creatorId: string,
  limit: number
): Promise<PayoutExecutionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .select("id, amount, currency, status, paid_at, failure_reason, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<PayoutExecutionRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export type PayoutTerminalRow = {
  id: string
  creator_id: string
  payout_request_id: string | null
  amount: number
  currency: string
  status: "pending" | "processing" | "paid" | "failed"
  paid_at: string | null
  failure_reason: string | null
}

export async function findPayoutTerminalRowOrThrow(
  payoutId: string
): Promise<PayoutTerminalRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .select(
      "id, creator_id, payout_request_id, amount, currency, status, paid_at, failure_reason"
    )
    .eq("id", payoutId)
    .single<PayoutTerminalRow>()

  if (error) {
    throw new InfrastructureError("PAYOUT_LOOKUP_FAILED", {
      cause: error,
      metadata: {
        payoutId,
      },
    })
  }

  if (!data) {
    throw new InfrastructureError("PAYOUT_NOT_FOUND", {
      metadata: {
        payoutId,
      },
    })
  }

  return data
}

export type CronPayoutToRunRow = {
  id: string
}

export async function listCronPayoutRowsToRun(): Promise<CronPayoutToRunRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .select("id")
    .in("status", ["pending", "failed"])
    .limit(20)
    .returns<CronPayoutToRunRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export type PayoutIdByRequestIdRow = {
  id: string
}

export async function findPayoutIdByRequestIdOrThrow(
  payoutRequestId: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .select("id")
    .eq("payout_request_id", payoutRequestId)
    .single<PayoutIdByRequestIdRow>()

  if (error) {
    throw new InfrastructureError("PAYOUT_ID_BY_REQUEST_LOOKUP_FAILED", {
      cause: error,
      metadata: {
        payoutRequestId,
      },
    })
  }

  if (!data) {
    throw new InfrastructureError("PAYOUT_ID_BY_REQUEST_NOT_FOUND", {
      metadata: {
        payoutRequestId,
      },
    })
  }

  return data.id
}

export type PayoutRowByRequestId = PayoutExecutionRow & {
  payout_request_id: string | null
}

export type PendingPayoutShadowRow = {
  id: string
  creator_id: string
  amount: number
  currency: string
  status: "pending"
  payout_request_id: string
  created_at: string
}

export type PayoutParityRowByRequestId = {
  id: string
  amount: number
  status: "pending" | "processing" | "paid" | "failed"
  payout_request_id: string | null
}

export async function findPayoutParityRowByRequestId(
  payoutRequestId: string
): Promise<PayoutParityRowByRequestId | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .select("id, amount, status, payout_request_id")
    .eq("payout_request_id", payoutRequestId)
    .maybeSingle<PayoutParityRowByRequestId>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function findPendingPayoutShadowRowByRequestIdOrThrow(
  payoutRequestId: string
): Promise<PendingPayoutShadowRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .select("id, creator_id, amount, currency, status, payout_request_id, created_at")
    .eq("payout_request_id", payoutRequestId)
    .single<PendingPayoutShadowRow>()

  if (error) {
    throw new InfrastructureError("PENDING_PAYOUT_SHADOW_LOOKUP_FAILED", {
      cause: error,
      metadata: {
        payoutRequestId,
      },
    })
  }

  if (!data || data.status !== "pending" || !data.payout_request_id) {
    throw new InfrastructureError("PENDING_PAYOUT_SHADOW_ROW_NOT_FOUND", {
      metadata: {
        payoutRequestId,
      },
    })
  }

  return data
}

export async function listPayoutRowsByRequestIds(
  payoutRequestIds: string[]
): Promise<PayoutRowByRequestId[]> {
  if (payoutRequestIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .select("id, payout_request_id, status, paid_at, failure_reason")
    .in("payout_request_id", payoutRequestIds)
    .returns<PayoutRowByRequestId[]>()

  if (error) {
    throw error
  }

  return data ?? []
}