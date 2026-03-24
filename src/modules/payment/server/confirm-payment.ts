import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createEarning } from "@/modules/payout/server/create-earning"
import { markEarningAsAvailable } from "@/modules/payout/server/mark-earning-as-available"
import { upsertSubscription } from "@/modules/subscription/server/upsert-subscription"

import { getPaymentProvider } from "./payment-provider-factory"

type PaymentProvider = "toss" | "mock"
type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded"
type PaymentType = "subscription" | "tip" | "ppv_message" | "ppv_post"

export type ConfirmedPayment = {
  id: string
  status: "succeeded"
  provider: PaymentProvider
  confirmedAt: string
}

type PaymentRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: PaymentType
  status: PaymentStatus
  provider: PaymentProvider
  confirmed_at: string | null
}

type ConfirmPaymentInput = {
  paymentId: string
}

function isSettlablePaymentType(type: PaymentType): boolean {
  return (
    type === "subscription" ||
    type === "ppv_post" ||
    type === "ppv_message"
  )
}

export async function confirmPayment({
  paymentId,
}: ConfirmPaymentInput): Promise<ConfirmedPayment | null> {
  const id = paymentId.trim()

  if (!id) {
    return null
  }

  const { data: existingPayment, error: existingPaymentError } =
    await supabaseAdmin
      .from("payments")
      .select("id, user_id, creator_id, type, status, provider, confirmed_at")
      .eq("id", id)
      .maybeSingle<PaymentRow>()

  if (existingPaymentError) {
    throw existingPaymentError
  }

  if (!existingPayment) {
    return null
  }

  if (existingPayment.status === "succeeded") {
    if (
      existingPayment.type === "subscription" &&
      existingPayment.creator_id
    ) {
      await upsertSubscription({
        userId: existingPayment.user_id,
        creatorId: existingPayment.creator_id,
        status: "active",
        provider: existingPayment.provider,
        providerSubscriptionId: existingPayment.id,
        currentPeriodStart:
          existingPayment.confirmed_at ?? new Date().toISOString(),
        cancelAtPeriodEnd: false,
      })
    }

    if (isSettlablePaymentType(existingPayment.type)) {
      const earning = await createEarning({
        paymentId: existingPayment.id,
      })

      if (earning) {
        await markEarningAsAvailable({
          earningId: earning.id,
        })
      }
    }

    return {
      id: existingPayment.id,
      status: "succeeded",
      provider: existingPayment.provider,
      confirmedAt: existingPayment.confirmed_at ?? new Date().toISOString(),
    }
  }

  const provider = getPaymentProvider(existingPayment.provider)

  const providerResult = await provider.confirmPayment({
    paymentId: existingPayment.id,
    providerReferenceId: existingPayment.id,
  })

  if (providerResult.status !== "succeeded") {
    throw new Error("PAYMENT_NOT_CONFIRMED")
  }

  const confirmedAt = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from("payments")
    .update({
      status: "succeeded",
      confirmed_at: confirmedAt,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, user_id, creator_id, type, provider, confirmed_at")
    .maybeSingle<{
      id: string
      user_id: string
      creator_id: string | null
      type: PaymentType
      provider: PaymentProvider
      confirmed_at: string | null
    }>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  if (data.type === "subscription" && data.creator_id) {
    await upsertSubscription({
      userId: data.user_id,
      creatorId: data.creator_id,
      status: "active",
      provider: data.provider,
      providerSubscriptionId: data.id,
      currentPeriodStart: data.confirmed_at ?? confirmedAt,
      cancelAtPeriodEnd: false,
    })
  }

  if (isSettlablePaymentType(data.type)) {
    const earning = await createEarning({
      paymentId: data.id,
    })

    if (earning) {
      await markEarningAsAvailable({
        earningId: earning.id,
      })
    }
  }

  return {
    id: data.id,
    status: "succeeded",
    provider: data.provider,
    confirmedAt: data.confirmed_at ?? confirmedAt,
  }
}