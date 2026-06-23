import createPayment from "@/modules/payment/public/create-payment"
import { hasPurchasedPost } from "@/modules/payment/public/has-purchased-post"
import { getPaymentProvider } from "@/modules/payment/providers/payment-provider-factory"
import type { PaymentProviderName } from "@/modules/payment/providers/payment-provider"
import { assertValidMessagePrice } from "@/modules/message/public/validate-message-price"
import { getActiveSubscription } from "@/modules/subscription/public/get-active-subscription"
import { assertValidSubscriptionPrice } from "@/modules/subscription/public/subscription-price"

type PaymentType = "subscription" | "tip" | "ppv_message" | "ppv_post"
type PaymentTargetType = "post" | "message" | null

export type CreatePaymentCheckoutInput = {
  userId: string
  creatorId?: string
  type: PaymentType
  amount: number
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

export async function createPaymentCheckoutService({
  userId,
  creatorId,
  type,
  amount,
  currency = "KRW",
  provider = "mock",
  providerReferenceId,
  targetType = null,
  targetId,
  orderId,
  orderName: _orderName,
  customerEmail,
  successUrl,
  failUrl,
}: CreatePaymentCheckoutInput) {
  let resolvedamount = amount

  if (type === "subscription") {
    resolvedamount = assertValidSubscriptionPrice(amount)

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

  if (type === "ppv_message") {
    resolvedamount = assertValidMessagePrice(amount)
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
    type,
    status: "pending",
    amount: resolvedamount,
    currency,
    provider,
    providerReferenceId,
    targetType,
    targetId,
  })

  const paymentProvider = getPaymentProvider(provider)

  const successUrlWithPaymentId = successUrl.includes("?")
    ? `${successUrl}&paymentId=${payment.id}`
    : `${successUrl}?paymentId=${payment.id}`

  const safeOrderName = "크리에이터 멤버십"

  const checkout = await paymentProvider.createCheckout({
    paymentId: payment.id,
    orderId,
    orderName: safeOrderName,
    amount: resolvedamount,
    customerEmail,
    successUrl: successUrlWithPaymentId,
    failUrl,
  })

  return {
    payment,
    checkout,
  }
}
