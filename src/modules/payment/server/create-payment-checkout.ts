import createPayment from "./create-payment"
import { hasPurchasedPost } from "./has-purchased-post"
import { getPaymentProvider } from "./payment-provider-factory"
import type { PaymentProviderName } from "./payment-provider"
import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"
import { assertValidSubscriptionPrice } from "@/modules/subscription/lib/subscription-price"
import { assertValidMessagePrice } from "@/modules/message/lib/message-price"

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
  currency = "KRW",
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
  let resolvedAmountCents = amountCents

  // 🔥 subscription
  if (type === "subscription") {
    resolvedAmountCents = assertValidSubscriptionPrice(amountCents)

    if (!creatorId) {
      throw new Error("CREATOR_ID_REQUIRED")
    }

    const activeSubscription = await getActiveSubscription({
      userId,
      creatorId,
    })

    if (activeSubscription) {
      throw new Error("SUBSCRIPTION_ALREADY_ACTIVE")
    }
  }

  // 🔥 ppv_message 가격 강제
  if (type === "ppv_message") {
    resolvedAmountCents = assertValidMessagePrice(amountCents)
  }

  // 🔥 ppv_post 중복 구매 방지 (기존 유지)
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
    amountCents: resolvedAmountCents,
    currency,
    provider,
    providerReferenceId,
    targetType,
    targetId,
  })

  const paymentProvider = getPaymentProvider(provider)

  // 🔥 핵심 추가: successUrl에 paymentId 포함
  const successUrlWithPaymentId = successUrl.includes("?")
    ? `${successUrl}&paymentId=${payment.id}`
    : `${successUrl}?paymentId=${payment.id}`

  const checkout = await paymentProvider.createCheckout({
    paymentId: payment.id,
    orderId,
    orderName,
    amountCents: resolvedAmountCents,
    customerEmail,
    successUrl: successUrlWithPaymentId,
    failUrl,
  })

  return {
    payment,
    checkout,
  }
}