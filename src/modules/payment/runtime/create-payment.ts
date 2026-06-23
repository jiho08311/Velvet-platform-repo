import {
  findPaymentByProviderReferenceId,
  type PaymentCreationRow,
} from "@/modules/payment/repositories/payment-read-repository"
import { insertPayment } from "@/modules/payment/repositories/payment-write-repository"
import type {
  PaymentProvider,
  PaymentStatus,
  PaymentTargetType,
  PaymentType,
} from "@/modules/payment/types"

type CreatePaymentInput = {
  userId: string
  creatorId?: string
  type: PaymentType
  status?: PaymentStatus
  amount: number
  currency?: string
  provider?: PaymentProvider
  providerReferenceId?: string
  targetType?: PaymentTargetType
  targetId?: string
}

function mapPaymentRow(row: PaymentCreationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    creatorId: row.creator_id ?? undefined,
    type: row.type,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    provider: row.provider,
    providerReferenceId: row.provider_reference_id ?? undefined,
    targetType: row.target_type,
    targetId: row.target_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default async function createPayment({
  userId,
  creatorId,
  type,
  status = "pending",
  amount,
  currency = "KRW",
  provider = "mock",
  providerReferenceId,
  targetType = null,
  targetId,
}: CreatePaymentInput) {
  if (providerReferenceId) {
    const existingPayment =
      await findPaymentByProviderReferenceId(providerReferenceId)

    if (existingPayment) {
      return mapPaymentRow(existingPayment)
    }
  }

  const payment = await insertPayment({
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
  })

  return mapPaymentRow(payment)
}
