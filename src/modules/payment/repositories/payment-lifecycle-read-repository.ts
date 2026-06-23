import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { InfrastructureError } from "@/shared/errors"

import type {
  ListPaymentRowsForReplayInput,
  PaymentAccessVerificationRow,
  PaymentConfirmRow,
  PaymentConfirmationTargetRow,
  PaymentFailureRow,
  PaymentForEarningRow,
  PaymentParityRow,
  PaymentRefundRow,
} from "./payment-read-repository-types"

export async function findPaymentForConfirmById(
  paymentId: string
): Promise<PaymentConfirmRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select(
      "id, user_id, creator_id, type, status, amount, currency, provider, provider_reference_id, target_type, target_id, confirmed_at"
    )
    .eq("id", paymentId)
    .maybeSingle<PaymentConfirmRow>()

  if (error) throw error

  return data
}

export async function findPaymentForRefundById(
  paymentId: string
): Promise<PaymentRefundRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select(
      "id, status, user_id, creator_id, type, amount, currency, provider, target_type, target_id"
    )
    .eq("id", paymentId)
    .maybeSingle<PaymentRefundRow>()

  if (error) throw error

  return data
}

export async function findPaymentForFailureById(
  paymentId: string
): Promise<PaymentFailureRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select(
      "id, status, user_id, creator_id, type, amount, currency, provider, target_type, target_id"
    )
    .eq("id", paymentId)
    .maybeSingle<PaymentFailureRow>()

  if (error) throw error

  return data
}

export async function findPaymentConfirmationTargetById(
  paymentId: string
): Promise<PaymentConfirmationTargetRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("id, user_id, type, target_type, target_id, provider")
    .eq("id", paymentId)
    .maybeSingle<PaymentConfirmationTargetRow>()

  if (error) {
    throw new InfrastructureError(
      "PAYMENT_CONFIRMATION_TARGET_LOOKUP_FAILED",
      {
        cause: error,
        metadata: {
          paymentId,
        },
      }
    )
  }

  return data
}

export async function findPaymentForEarningById(
  paymentId: string
): Promise<PaymentForEarningRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("id, creator_id, type, status, currency, amount, confirmed_at")
    .eq("id", paymentId)
    .maybeSingle<PaymentForEarningRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findPaymentForParityById(
  paymentId: string
): Promise<PaymentParityRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select(
      "id, user_id, creator_id, type, status, amount, currency, provider, target_type, target_id, created_at, updated_at, confirmed_at"
    )
    .eq("id", paymentId)
    .maybeSingle<PaymentParityRow>()

  if (error) {
    throw error
  }

  return data
}

export async function listPaymentRowsForReplay({
  windowStart,
  windowEnd,
  limit,
}: ListPaymentRowsForReplayInput): Promise<PaymentParityRow[]> {
  let query = supabaseAdmin
    .from("canonical_payment_state")
    .select(
      "id, user_id, creator_id, type, status, amount, currency, provider, target_type, target_id, created_at, updated_at, confirmed_at"
    )
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(limit)

  if (windowStart) {
    query = query.gte("created_at", windowStart)
  }

  if (windowEnd) {
    query = query.lte("created_at", windowEnd)
  }

  const { data, error } = await query.returns<PaymentParityRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findPaymentAccessVerificationById(
  paymentId: string
): Promise<PaymentAccessVerificationRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("id, user_id, creator_id, type, status, target_type, target_id")
    .eq("id", paymentId)
    .maybeSingle<PaymentAccessVerificationRow>()

  if (error) {
    throw error
  }

  return data
}
