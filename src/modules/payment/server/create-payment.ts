import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type PaymentType = "subscription" | "tip" | "ppv_message" | "ppv_post"
type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded"
type PaymentProvider = "toss" | "mock"
type PaymentTargetType = "post" | "message" | null

type CreatePaymentInput = {
  userId: string
  creatorId?: string
  subscriptionId?: string
  type: PaymentType
  status?: PaymentStatus
  amountCents: number
  currency?: string
  provider?: PaymentProvider
  providerReferenceId?: string
  targetType?: PaymentTargetType
  targetId?: string
}

type PaymentRow = {
  id: string
  user_id: string
  creator_id: string | null
  subscription_id: string | null
  type: PaymentType
  status: PaymentStatus
  amount_cents: number
  currency: string
  provider: PaymentProvider
  provider_reference_id: string | null
  target_type: PaymentTargetType
  target_id: string | null
  created_at: string
  updated_at: string
}

export default async function createPayment({
  userId,
  creatorId,
  subscriptionId,
  type,
  status = "pending",
  amountCents,
  currency = "usd",
  provider = "mock",
  providerReferenceId,
  targetType = null,
  targetId,
}: CreatePaymentInput): Promise<{
  id: string
  userId: string
  creatorId?: string
  subscriptionId?: string
  type: PaymentType
  status: PaymentStatus
  amountCents: number
  currency: string
  provider: PaymentProvider
  providerReferenceId?: string
  targetType: PaymentTargetType
  targetId?: string
  createdAt: string
  updatedAt: string
}> {
  if (providerReferenceId) {
    const { data: existingPayment, error: existingPaymentError } =
      await supabaseAdmin
        .from("payments")
        .select(
          "id, user_id, creator_id, subscription_id, type, status, amount_cents, currency, provider, provider_reference_id, target_type, target_id, created_at, updated_at"
        )
        .eq("provider_reference_id", providerReferenceId)
        .maybeSingle<PaymentRow>()

    if (existingPaymentError) {
      throw existingPaymentError
    }

    if (existingPayment) {
      return {
        id: existingPayment.id,
        userId: existingPayment.user_id,
        creatorId: existingPayment.creator_id ?? undefined,
        subscriptionId: existingPayment.subscription_id ?? undefined,
        type: existingPayment.type,
        status: existingPayment.status,
        amountCents: existingPayment.amount_cents,
        currency: existingPayment.currency,
        provider: existingPayment.provider,
        providerReferenceId: existingPayment.provider_reference_id ?? undefined,
        targetType: existingPayment.target_type,
        targetId: existingPayment.target_id ?? undefined,
        createdAt: existingPayment.created_at,
        updatedAt: existingPayment.updated_at,
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: userId,
      creator_id: creatorId ?? null,
      subscription_id: subscriptionId ?? null,
      type,
      status,
      amount_cents: amountCents,
      currency,
      provider,
      provider_reference_id: providerReferenceId ?? null,
      target_type: targetType,
      target_id: targetId ?? null,
    })
    .select(
      "id, user_id, creator_id, subscription_id, type, status, amount_cents, currency, provider, provider_reference_id, target_type, target_id, created_at, updated_at"
    )
    .single<PaymentRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    creatorId: data.creator_id ?? undefined,
    subscriptionId: data.subscription_id ?? undefined,
    type: data.type,
    status: data.status,
    amountCents: data.amount_cents,
    currency: data.currency,
    provider: data.provider,
    providerReferenceId: data.provider_reference_id ?? undefined,
    targetType: data.target_type,
    targetId: data.target_id ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}