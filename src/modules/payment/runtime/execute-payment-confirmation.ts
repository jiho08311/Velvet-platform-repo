import { isSuccessfulPaymentStatus } from "@/modules/payment/policies/payment-status-policy"
import {
  findPaymentForConfirmById,
  type PaymentConfirmRow,
} from "@/modules/payment/repositories/payment-read-repository"
import {
  confirmPaymentWithOutbox,
  type ConfirmedPaymentWithOutboxRow,
} from "@/modules/payment/repositories/payment-write-repository"
import { getPaymentProvider } from "@/modules/payment/providers/payment-provider-factory"
import { InfrastructureError } from "@/shared/errors"

type ExecutePaymentConfirmationInput = {
  paymentId: string
  paymentKey?: string
  orderId?: string
  amount?: number
}

export type ExecutePaymentConfirmationResult = {
  payment: PaymentConfirmRow | ConfirmedPaymentWithOutboxRow
  confirmedAt: string
  providerReferenceId?: string | null
  providerOrderId?: string | null
  providerStatus: "succeeded"
  duplicateDetected: boolean
  eventId?: string | null
  outboxId?: string | null
}

export async function executePaymentConfirmation({
  paymentId,
  paymentKey,
  orderId,
  amount,
}: ExecutePaymentConfirmationInput): Promise<ExecutePaymentConfirmationResult> {
  const id = paymentId.trim()

  if (!id) {
    throw new InfrastructureError("PAYMENT_ID_REQUIRED")
  }

  const existingPayment = await findPaymentForConfirmById(id)

  if (!existingPayment) {
    throw new InfrastructureError("PAYMENT_NOT_FOUND_FOR_CONFIRMATION", {
      metadata: {
        paymentId: id,
      },
    })
  }

  if (isSuccessfulPaymentStatus(existingPayment.status)) {
    return {
      payment: existingPayment,
      confirmedAt: existingPayment.confirmed_at ?? new Date().toISOString(),
      providerReferenceId: paymentKey ?? existingPayment.provider_reference_id,
      providerOrderId: orderId,
      providerStatus: "succeeded",
      duplicateDetected: true,
      eventId: null,
      outboxId: null,
    }
  }

  const provider = getPaymentProvider(existingPayment.provider)

  const providerResult = await provider.confirmPayment({
    paymentId: existingPayment.id,
    providerReferenceId: paymentKey,
    orderId,
    amount,
  })

  if (providerResult.status !== "succeeded") {
    throw new InfrastructureError("PAYMENT_NOT_CONFIRMED", {
      metadata: {
        paymentId: id,
        providerStatus: providerResult.status,
      },
    })
  }

  const confirmedAt = new Date().toISOString()

  const payment = await confirmPaymentWithOutbox({
    paymentId: id,
    confirmedAt,
    providerReferenceId: providerResult.providerReferenceId ?? paymentKey ?? null,
    providerOrderId: orderId ?? null,
    requestId: orderId ?? paymentKey ?? id,
  })

  if (!payment) {
    throw new InfrastructureError("PAYMENT_CONFIRMATION_WRITE_FAILED", {
      metadata: {
        paymentId: id,
      },
    })
  }

  return {
    payment,
    confirmedAt: payment.confirmed_at ?? confirmedAt,
    providerReferenceId:
      providerResult.providerReferenceId ??
      paymentKey ??
      payment.provider_reference_id,
    providerOrderId: orderId,
    providerStatus: providerResult.status,
    duplicateDetected: payment.duplicate_detected,
    eventId: payment.event_id,
    outboxId: payment.outbox_id,
  }
}