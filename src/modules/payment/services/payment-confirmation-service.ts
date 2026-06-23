import {
  synchronizePaymentConfirmationTraceabilityNoThrow,
  synchronizePaymentEventReconstructionNoThrow,
  synchronizeProviderCorrelationTraceabilityNoThrow,
} from "@/modules/payment/traceability"
import type {
  ConfirmedPayment,
} from "@/modules/payment/contracts/payment-confirmation-contract"
import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"

import {
  executePaymentConfirmation,
} from "@/modules/payment/runtime/execute-payment-confirmation"

import {
  type PaymentConfirmRow,
} from "@/modules/payment/repositories/payment-read-repository"

import {
  type ConfirmedPaymentRow,
} from "@/modules/payment/repositories/payment-write-repository"

import { runPostConfirmationSideEffects } from "./payment-confirmation-fanout-service"

export type { ConfirmedPayment } from "@/modules/payment/contracts/payment-confirmation-contract"
type ConfirmPaymentInput = {
  paymentId: string
  paymentKey?: string
  orderId?: string
  amount?: number
}

async function synchronizePaymentConfirmationTraceability(
  payment: PaymentConfirmRow | ConfirmedPaymentRow,
  input: {
    confirmedAt: string
    providerReferenceId?: string | null
    providerOrderId?: string | null
    providerStatus?: string | null
    sourceOperation?: string
  }
) {
  await synchronizePaymentConfirmationTraceabilityNoThrow({
    paymentId: payment.id,
    userId: payment.user_id,
    creatorId: payment.creator_id,
    type: payment.type,
    amount: payment.amount,
    currency: payment.currency,
    provider: payment.provider,
    providerReferenceId:
      input.providerReferenceId ?? payment.provider_reference_id,
    providerOrderId: input.providerOrderId,
    providerStatus: input.providerStatus,
    targetType: payment.target_type,
    targetId: payment.target_id,
    confirmedAt: input.confirmedAt,
    sourceOperation: input.sourceOperation ?? "confirmPaymentService",
    sourceVersion: "wave_010_fel_br_010",
    replayTimestampSource: "payments.confirmed_at",
  })
}

async function synchronizeProviderCorrelationTraceability(
  payment: PaymentConfirmRow | ConfirmedPaymentRow,
  input: {
    confirmedAt: string
    providerReferenceId?: string | null
    providerOrderId?: string | null
    providerStatus?: string | null
  }
) {
  await synchronizeProviderCorrelationTraceabilityNoThrow({
    paymentId: payment.id,
    type: payment.type,
    provider: payment.provider,
    providerReferenceId:
      input.providerReferenceId ?? payment.provider_reference_id,
    providerOrderId: input.providerOrderId,
    providerStatus: input.providerStatus,
    targetType: payment.target_type,
    targetId: payment.target_id,
    confirmedAt: input.confirmedAt,
    runtimeSurface: "payment_confirmation_service",
    orderingSource: "payment_confirmation_service.provider_confirmation",
    replayTimestampSource: "payments.confirmed_at",
    provenanceMetadata: {
      paymentRuntimeAuthorityPreserved: true,
      providerConfirmationAuthorityPreserved: true,
    },
  })
}

async function synchronizePaymentEventReconstruction(
  payment: PaymentConfirmRow | ConfirmedPaymentRow,
  input: {
    confirmedAt: string
    providerReferenceId?: string | null
    providerOrderId?: string | null
    providerStatus?: string | null
  }
) {
  await synchronizePaymentEventReconstructionNoThrow({
    paymentId: payment.id,
    type: payment.type,
    provider: payment.provider,
    providerReferenceId:
      input.providerReferenceId ?? payment.provider_reference_id,
    providerOrderId: input.providerOrderId,
    providerStatus: input.providerStatus,
    targetType: payment.target_type,
    targetId: payment.target_id,
    confirmedAt: input.confirmedAt,
    provenanceMetadata: {
      paymentRuntimeAuthorityPreserved: true,
      providerConfirmationAuthorityPreserved: true,
      ledgerAuthorityPreserved: true,
    },
  })
}

function toConfirmedPayment(
  payment: PaymentConfirmRow | ConfirmedPaymentRow,
  fallbackConfirmedAt: string
): ConfirmedPayment {
  return {
    id: payment.id,
    status: "succeeded",
    provider: payment.provider,
    confirmedAt: payment.confirmed_at ?? fallbackConfirmedAt,
  }
}

export async function confirmPaymentService({
  paymentId,
  paymentKey,
  orderId,
  amount,
}: ConfirmPaymentInput): Promise<ConfirmedPayment | null> {
  const execution = await executePaymentConfirmation({
    paymentId,
    paymentKey,
    orderId,
    amount,
  })

  if (!execution) return null

  const {
    payment,
    confirmedAt,
    providerReferenceId,
    providerOrderId,
    providerStatus,
    duplicateDetected,
  } = execution

  await synchronizePaymentConfirmationTraceability(payment, {
    confirmedAt,
    providerReferenceId,
    providerOrderId,
    providerStatus,
    sourceOperation: duplicateDetected
      ? "confirmPaymentService.existingSucceeded"
      : "confirmPaymentService",
  })
  await synchronizeProviderCorrelationTraceability(payment, {
    confirmedAt,
    providerReferenceId,
    providerOrderId,
    providerStatus,
  })
  await synchronizePaymentEventReconstruction(payment, {
    confirmedAt,
    providerReferenceId,
    providerOrderId,
    providerStatus,
  })

  if (!duplicateDetected) {

    await createAuditLog({
      actorId: payment.user_id,
      action: "payment_confirmed",
      targetType: "payment",
      targetId: payment.id,
      metadata: {
        userId: payment.user_id,
        creatorId: payment.creator_id,
        type: payment.type,
        provider: payment.provider,
        confirmedAt,
      },
    })
  }

  await runPostConfirmationSideEffects(payment)

  return toConfirmedPayment(payment, confirmedAt)
}
