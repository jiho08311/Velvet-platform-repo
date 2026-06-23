import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type {
  PaymentProvider,
  PaymentStatus,
  PaymentTargetType,
  PaymentType,
} from "@/modules/payment/types"
import type { PaymentCreationRow } from "./payment-read-repository"

type InsertPaymentInput = {
  userId: string
  creatorId?: string
  type: PaymentType
  status: PaymentStatus
  amount: number
  currency: string
  provider: PaymentProvider
  providerReferenceId?: string
  targetType: PaymentTargetType
  targetId?: string
}

type InsertSucceededMockPpvPostPaymentInput = {
  userId: string
  creatorId: string
  postId: string
  amount: number
  currency: string
}

type MarkPaymentSucceededIfPendingInput = {
  paymentId: string
  confirmedAt: string
}

export type ConfirmedPaymentRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: PaymentType
  amount: number
  currency: string
  provider: PaymentProvider
  provider_reference_id: string | null
  target_type: PaymentTargetType
  target_id: string | null
  confirmed_at: string | null
}

type SetPaymentTargetTypeInput = {
  paymentId: string
  targetType: PaymentTargetType
}

type MarkPaymentFailedInput = {
  paymentId: string
  failedAt: string
}

type MarkPaymentRefundedIfSucceededInput = {
  paymentId: string
  refundedAt: string
}

export async function insertPayment({
  userId,
  creatorId,
  type,
  status,
  amount,
  currency,
  provider,
  providerReferenceId,
  targetType,
  targetId,
}: InsertPaymentInput): Promise<PaymentCreationRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .insert({
      user_id: userId,
      creator_id: creatorId ?? null,
      type,
      status,
      amount: amount,
      currency,
      provider,
      provider_reference_id: providerReferenceId ?? null,
      target_type: targetType,
      target_id: targetId ?? null,
    })
    .select(
      "id, user_id, creator_id, type, status, amount, currency, provider, provider_reference_id, target_type, target_id, created_at, updated_at"
    )
    .single<PaymentCreationRow>()

  if (error) {
    throw error
  }

  return data
}

export async function insertSucceededMockPpvPostPayment({
  userId,
  creatorId,
  postId,
  amount,
  currency,
}: InsertSucceededMockPpvPostPaymentInput) {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .insert({
      user_id: userId,
      creator_id: creatorId,
      type: "ppv_post",
      target_type: "post",
      target_id: postId,
      amount: amount,
      currency,
      status: "succeeded",
      provider: "mock",
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function markPaymentSucceededIfPending({
  paymentId,
  confirmedAt,
}: MarkPaymentSucceededIfPendingInput): Promise<ConfirmedPaymentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .update({
      status: "succeeded",
      confirmed_at: confirmedAt,
    })
    .eq("id", paymentId)
    .eq("status", "pending")
    .select(
      "id, user_id, creator_id, type, amount, currency, provider, provider_reference_id, target_type, target_id, confirmed_at"
    )
    .maybeSingle<ConfirmedPaymentRow>()

  if (error) {
    throw error
  }

  return data
}

export async function setPaymentTargetType({
  paymentId,
  targetType,
}: SetPaymentTargetTypeInput): Promise<void> {
  await supabaseAdmin
    .from("canonical_payment_state")
    .update({
      target_type: targetType,
    })
    .eq("id", paymentId)
}

export async function markPaymentFailed({
  paymentId,
  failedAt,
}: MarkPaymentFailedInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_payment_state")
    .update({
      status: "failed",
      updated_at: failedAt,
    })
    .eq("id", paymentId)

  if (error) {
    throw error
  }
}

export async function markPaymentRefundedIfSucceeded({
  paymentId,
  refundedAt,
}: MarkPaymentRefundedIfSucceededInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_payment_state")
    .update({
      status: "refunded",
      updated_at: refundedAt,
    })
    .eq("id", paymentId)
    .eq("status", "succeeded")

  if (error) {
    throw error
  }
}
type ConfirmPaymentWithOutboxInput = {
  paymentId: string
  confirmedAt: string
  providerReferenceId?: string | null
  providerOrderId?: string | null
  requestId?: string | null
}

export type ConfirmedPaymentWithOutboxRow = ConfirmedPaymentRow & {
  event_id: string | null
  outbox_id: string | null
  duplicate_detected: boolean
}

export async function confirmPaymentWithOutbox({
  paymentId,
  confirmedAt,
  providerReferenceId,
  providerOrderId,
  requestId,
}: ConfirmPaymentWithOutboxInput): Promise<ConfirmedPaymentWithOutboxRow | null> {
  const { data, error } = await supabaseAdmin
    .rpc("confirm_payment_with_outbox", {
      p_payment_id: paymentId,
      p_confirmed_at: confirmedAt,
      p_provider_reference_id: providerReferenceId ?? null,
      p_provider_order_id: providerOrderId ?? null,
      p_request_id: requestId ?? null,
    })
    .maybeSingle<ConfirmedPaymentWithOutboxRow>()

  if (error) {
    throw error
  }

  return data
}
