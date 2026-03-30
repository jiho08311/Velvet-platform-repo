import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createEarning } from "@/modules/payout/server/create-earning"
import { markEarningAsAvailable } from "@/modules/payout/server/mark-earning-as-available"
import { upsertSubscription } from "@/modules/subscription/server/upsert-subscription"
import { createNotification } from "@/modules/notification/server/create-notification"

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
    type === "ppv_message" ||
    type === "tip"
  )
}

function addOneMonth(isoString: string): string {
  const date = new Date(isoString)
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}

async function processSettlement(payment: {
  id: string
  creator_id: string | null
  type: PaymentType
}) {
  if (!isSettlablePaymentType(payment.type)) return

  try {
    const earning = await createEarning({
      paymentId: payment.id,
    })

    if (earning) {
      await markEarningAsAvailable({
        earningId: earning.id,
      })
    }
  } catch (error) {
    console.error("earning settlement failed:", error)
  }
}

export async function confirmPayment({
  paymentId,
}: ConfirmPaymentInput): Promise<ConfirmedPayment | null> {
  const id = paymentId.trim()
  if (!id) return null

  const { data: existingPayment, error: existingPaymentError } =
    await supabaseAdmin
      .from("payments")
      .select("id, user_id, creator_id, type, status, provider, confirmed_at")
      .eq("id", id)
      .maybeSingle<PaymentRow>()

  if (existingPaymentError) throw existingPaymentError
  if (!existingPayment) return null

  // 🔥 이미 성공된 결제
  if (existingPayment.status === "succeeded") {
    if (existingPayment.type === "subscription" && existingPayment.creator_id) {
      const currentPeriodStart =
        existingPayment.confirmed_at ?? new Date().toISOString()

      await upsertSubscription({
        userId: existingPayment.user_id,
        creatorId: existingPayment.creator_id,
        status: "active",
        provider: existingPayment.provider,
        providerSubscriptionId: existingPayment.id,
        currentPeriodStart,
        currentPeriodEnd: addOneMonth(currentPeriodStart),
        cancelAtPeriodEnd: false,
      })
    }

    await processSettlement({
      id: existingPayment.id,
      creator_id: existingPayment.creator_id,
      type: existingPayment.type,
    })

    // 🔥 PPV MESSAGE unlock (추가)
    if (existingPayment.type === "ppv_message") {
      await supabaseAdmin
        .from("payments")
        .update({
          target_type: "message",
        })
        .eq("id", existingPayment.id)
    }

    // ✅ notification 유지
    try {
      await createNotification({
        userId: existingPayment.user_id,
        type: "payment_succeeded",
        title: "Payment successful",
        body: "Your payment was completed successfully.",
        data: { paymentId: existingPayment.id },
      })

      if (
        existingPayment.type === "ppv_message" &&
        existingPayment.creator_id
      ) {
        const { data: creator } = await supabaseAdmin
          .from("creators")
          .select("user_id")
          .eq("id", existingPayment.creator_id)
          .maybeSingle()

        if (creator?.user_id) {
          await createNotification({
            userId: creator.user_id,
            type: "ppv_message_purchased",
            title: "PPV purchased",
            body: "A user purchased your PPV message.",
            data: { paymentId: existingPayment.id },
          })
        }
      }

      if (existingPayment.type === "ppv_post" && existingPayment.creator_id) {
        const { data: creator } = await supabaseAdmin
          .from("creators")
          .select("user_id")
          .eq("id", existingPayment.creator_id)
          .maybeSingle()

        if (creator?.user_id) {
          await createNotification({
            userId: creator.user_id,
            type: "ppv_post_purchased",
            title: "Post purchased",
            body: "A user purchased your paid post.",
            data: { paymentId: existingPayment.id },
          })
        }
      }
    } catch (e) {
      console.error("notification error:", e)
    }

    return {
      id: existingPayment.id,
      status: "succeeded",
      provider: existingPayment.provider,
      confirmedAt:
        existingPayment.confirmed_at ?? new Date().toISOString(),
    }
  }

  // 🔥 신규 결제 confirm
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
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  if (data.type === "subscription" && data.creator_id) {
    const currentPeriodStart = data.confirmed_at ?? confirmedAt

    await upsertSubscription({
      userId: data.user_id,
      creatorId: data.creator_id,
      status: "active",
      provider: data.provider,
      providerSubscriptionId: data.id,
      currentPeriodStart,
      currentPeriodEnd: addOneMonth(currentPeriodStart),
      cancelAtPeriodEnd: false,
    })
  }

  await processSettlement({
    id: data.id,
    creator_id: data.creator_id,
    type: data.type,
  })

  // 🔥 PPV MESSAGE unlock (추가)
  if (data.type === "ppv_message") {
    await supabaseAdmin
      .from("payments")
      .update({
        target_type: "message",
      })
      .eq("id", data.id)
  }

  // ✅ notification 유지
  try {
    await createNotification({
      userId: data.user_id,
      type: "payment_succeeded",
      title: "Payment successful",
      body: "Your payment was completed successfully.",
      data: { paymentId: data.id },
    })

    if (data.type === "ppv_message" && data.creator_id) {
      const { data: creator } = await supabaseAdmin
        .from("creators")
        .select("user_id")
        .eq("id", data.creator_id)
        .maybeSingle()

      if (creator?.user_id) {
        await createNotification({
          userId: creator.user_id,
          type: "ppv_message_purchased",
          title: "PPV purchased",
          body: "A user purchased your PPV message.",
          data: { paymentId: data.id },
        })
      }
    }

    if (data.type === "ppv_post" && data.creator_id) {
      const { data: creator } = await supabaseAdmin
        .from("creators")
        .select("user_id")
        .eq("id", data.creator_id)
        .maybeSingle()

      if (creator?.user_id) {
        await createNotification({
          userId: creator.user_id,
          type: "ppv_post_purchased",
          title: "Post purchased",
          body: "A user purchased your paid post.",
          data: { paymentId: data.id },
        })
      }
    }
  } catch (e) {
    console.error("notification error:", e)
  }

  return {
    id: data.id,
    status: "succeeded",
    provider: data.provider,
    confirmedAt: data.confirmed_at ?? confirmedAt,
  }
}