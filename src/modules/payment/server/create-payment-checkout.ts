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
  type,
  amountCents,
  currency = "KRW",
  provider = "mock",
  providerReferenceId,
  targetType = null,
  targetId,
  orderId,
  orderName: _orderName, // ❗ 외부 값 무시
  customerEmail,
  successUrl,
  failUrl,
}: CreatePaymentCheckoutInput) {
  let resolvedAmountCents = amountCents

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

  if (type === "ppv_message") {
    resolvedAmountCents = assertValidMessagePrice(amountCents)
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
    amountCents: resolvedAmountCents,
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

  // 🔥 핵심: 무조건 통일
  const safeOrderName = "프리미엄 콘텐츠 이용권"

  const checkout = await paymentProvider.createCheckout({
    paymentId: payment.id,
    orderId,
    orderName: safeOrderName,
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