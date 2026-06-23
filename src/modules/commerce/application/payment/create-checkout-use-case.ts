import { createCanonicalPaymentCheckout } from "@/modules/commerce/internal/adapters/payment-adapter"
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
} from "@/modules/commerce/public/payment-contract"
import type {
  CommerceCurrency,
  PaymentState,
  PaymentTarget,
} from "@/modules/commerce/public/types"

function toCommerceCurrency(currency: string): CommerceCurrency {
  if (currency !== "KRW") {
    throw new Error(`Unsupported commerce currency: ${currency}`)
  }

  return currency
}

function toPaymentTarget(payment: {
  targetType: "post" | "message" | null
  targetId?: string
}): PaymentTarget {
  if (!payment.targetType || !payment.targetId) {
    return null
  }

  return {
    type: payment.targetType,
    id: payment.targetId,
  }
}

function toPaymentState(payment: {
  id: string
  userId: string
  creatorId?: string
  type: PaymentState["purpose"]
  status: PaymentState["status"]
  amount: number
  currency: string
  provider: PaymentState["provider"]
  targetType: "post" | "message" | null
  targetId?: string
  createdAt: string
  updatedAt: string
}): PaymentState {
  return {
    paymentId: payment.id,
    payerUserId: payment.userId,
    creatorId: payment.creatorId ?? null,
    purpose: payment.type,
    status: payment.status,
    money: {
      amount: payment.amount,
      currency: toCommerceCurrency(payment.currency),
    },
    provider: payment.provider,
    target: toPaymentTarget(payment),
    confirmedAt: null,
    failedAt: null,
    refundedAt: null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  }
}

export async function createCheckoutUseCase(
  input: CreateCheckoutInput
): Promise<CreateCheckoutResult> {
  const result = await createCanonicalPaymentCheckout({
    userId: input.payerUserId,
    creatorId: input.creatorId ?? undefined,
    type: input.purpose,
    amount: input.money.amount,
    currency: input.money.currency,
    provider: input.provider,
    providerReferenceId: input.providerReferenceId,
    targetType: input.target?.type ?? null,
    targetId: input.target?.id,
    orderId: input.orderId,
    orderName: input.orderName,
    customerEmail: input.customerEmail,
    successUrl: input.successUrl,
    failUrl: input.failUrl,
  })

  return {
    payment: toPaymentState(result.payment),
    checkout: {
      provider: result.payment.provider,
      url: result.checkout.checkoutUrl ?? null,
      providerReferenceId: result.payment.providerReferenceId ?? null,
    },
  }
}