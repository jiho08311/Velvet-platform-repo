import createPayment from "./create-payment"
import { hasPurchasedPost } from "./has-purchased-post"
import { getPaymentProvider } from "./payment-provider-factory"
import type { PaymentProviderName } from "./payment-provider"
import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"

type PaymentType = "subscription" | "tip" | "ppv_message" | "ppv_post"
type PaymentTargetType = "post" | "message" | null

type CreatePaymentCheckoutInput = {
  userId: string
  creatorId?: string
  subscriptionId?: string
  type: PaymentType
  amountCents: number
  currency?: string
  provider?: PaymentProviderName
  providerReferenceId?: string
  targetType?: PaymentTargetType
  targetId?: string
  orderId: string
  orderName: string
  customerEmail?: string
  successUrl: string
  failUrl: string
}

export async function createPaymentCheckout({
  userId,
  creatorId,
  subscriptionId,
  type,
  amountCents,
  currency = "usd",
  provider = "mock",
  providerReferenceId,
  targetType = null,
  targetId,
  orderId,
  orderName,
  customerEmail,
  successUrl,
  failUrl,
}: CreatePaymentCheckoutInput) {
  if (type === "subscription" && creatorId) {
    const activeSubscription = await getActiveSubscription({
      userId,
      creatorId,
    })

    if (activeSubscription) {
      throw new Error("SUBSCRIPTION_ALREADY_ACTIVE")
    }
  }

  if (type === "ppv_post" && targetType === "post" && targetId) {
    const alreadyPurchased = await hasPurchasedPost({
      userId,
      postId: targetId,
    })

    if (alreadyPurchased) {
      throw new Error("POST_ALREADY_PURCHASED")
    }
  }

  const payment = await createPayment({
    userId,
    creatorId,
    subscriptionId,
    type,
    status: "pending",
    amountCents,
    currency,
    provider,
    providerReferenceId,
    targetType,
    targetId,
  })

  const paymentProvider = getPaymentProvider(provider)

const checkout = await paymentProvider.createCheckout({
  paymentId: payment.id,
  orderId,
  orderName,
  amountCents,
  customerEmail,
  successUrl,
  failUrl,
})

  return {
    payment,
    checkout,
  }
}