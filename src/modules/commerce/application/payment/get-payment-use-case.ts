import { getCanonicalPaymentById } from "@/modules/commerce/internal/adapters/payment-adapter"
import type {
  GetPaymentInput,
  GetPaymentResult,
} from "@/modules/commerce/public/payment-contract"
import type {
  CommerceCurrency,
  PaymentProvider,
  PaymentPurpose,
  PaymentState,
  PaymentStatus,
  PaymentTarget,
} from "@/modules/commerce/public/types"

function toCommerceCurrency(currency: string): CommerceCurrency {
  if (currency !== "KRW") {
    throw new Error(`Unsupported commerce currency: ${currency}`)
  }

  return currency
}


function toPaymentPurpose(value: string): PaymentPurpose {
  if (value === "subscription" || value === "ppv_post" || value === "ppv_message" || value === "tip") {
    return value
  }

  if (value === "post") {
    return "ppv_post"
  }

  if (value === "message") {
    return "ppv_message"
  }

  throw new Error(`Unsupported payment purpose: ${value}`)
}

function toPaymentStatus(value: string): PaymentStatus {
  if (
    value === "pending" ||
    value === "succeeded" ||
    value === "failed" ||
    value === "refunded"
  ) {
    return value
  }

  throw new Error(`Unsupported payment status: ${value}`)
}

function toPaymentProvider(value: string | null): PaymentProvider {
  if (value === "toss" || value === "mock") {
    return value
  }

  throw new Error(`Unsupported payment provider: ${value}`)
}

function toPaymentTarget(payment: {
  target_type: "post" | "message" | null
  target_id: string | null
}): PaymentTarget {
  if (!payment.target_type || !payment.target_id) {
    return null
  }

  return {
    type: payment.target_type,
    id: payment.target_id,
  }
}

function toPaymentState(payment: Awaited<ReturnType<typeof getCanonicalPaymentById>>): PaymentState | null {
  if (!payment) {
    return null
  }

  return {
    paymentId: payment.id,
    payerUserId: payment.user_id,
    creatorId: payment.creator_id,
    purpose: toPaymentPurpose(payment.type),
    status: toPaymentStatus(payment.status),
    money: {
      amount: payment.amount,
      currency: toCommerceCurrency(payment.currency),
    },
    provider: toPaymentProvider(payment.provider),
    target: toPaymentTarget(payment),
    confirmedAt: payment.confirmed_at,
    failedAt: null,
    refundedAt: null,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at ?? payment.created_at,
  }
}

export async function getPaymentUseCase({
  paymentId,
}: GetPaymentInput): Promise<GetPaymentResult> {
  const payment = await getCanonicalPaymentById(paymentId)

  return {
    payment: toPaymentState(payment),
  }
}