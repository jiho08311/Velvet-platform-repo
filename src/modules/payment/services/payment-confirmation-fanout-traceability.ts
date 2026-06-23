import type { PaymentFanoutResult } from "@/modules/payment/contracts/payment-confirmation-contract"
import type { PaymentConfirmRow } from "@/modules/payment/repositories/payment-read-repository"
import type { ConfirmedPaymentRow } from "@/modules/payment/repositories/payment-write-repository"
import {
  synchronizePaymentFanoutTraceabilityNoThrow,
  synchronizePaymentSideEffectLineageNoThrow,
} from "@/modules/payment/traceability"

type PaymentFanoutRuntimeRow = PaymentConfirmRow | ConfirmedPaymentRow

type PaymentFanoutSideEffectKind =
  | "subscription_activation"
  | "settlement_earning_creation"
  | "ppv_target_normalization"
  | "notification_fanout"

export async function synchronizePaymentFanoutTraceability(
  payment: PaymentFanoutRuntimeRow,
  input: {
    sideEffectKind: PaymentFanoutSideEffectKind
    fanoutSequence: number
    runtimeSurface: string
    expectedForPayment: boolean
    result: PaymentFanoutResult
  }
) {
  await synchronizePaymentFanoutTraceabilityNoThrow({
    paymentId: payment.id,
    paymentType: payment.type,
    confirmedAt: payment.confirmed_at ?? new Date().toISOString(),
    sideEffectKind: input.sideEffectKind,
    fanoutSequence: input.fanoutSequence,
    runtimeSurface: input.runtimeSurface,
    fanoutStatus: input.result.fanoutStatus,
    sideEffectStatus: input.result.sideEffectStatus,
    expectedForPayment: input.expectedForPayment,
    sideEffectTable: input.result.sideEffectTable,
    sideEffectRowId: input.result.sideEffectRowId,
    orderingSource: `payment_confirmation_service.${input.sideEffectKind}`,
    replayTimestampSource: "payment_fanout_runtime_observed_at",
    lineageMetadata: input.result.metadata,
    eventMetadata: {
      expectedForPayment: input.expectedForPayment,
    },
    provenanceMetadata: {
      paymentRuntimeAuthorityPreserved: true,
      subscriptionRuntimeAuthorityPreserved: true,
      earningRuntimeAuthorityPreserved: true,
      notificationRuntimeAuthorityPreserved: true,
    },
  })
}

export async function synchronizePaymentSideEffectLineage(
  payment: PaymentFanoutRuntimeRow,
  input: {
    sideEffectKind: PaymentFanoutSideEffectKind
    fanoutSequence: number
    runtimeSurface: string
    result: PaymentFanoutResult
  }
) {
  await synchronizePaymentSideEffectLineageNoThrow({
    paymentId: payment.id,
    paymentType: payment.type,
    confirmedAt: payment.confirmed_at ?? new Date().toISOString(),
    sideEffectKind: input.sideEffectKind,
    fanoutSequence: input.fanoutSequence,
    runtimeSurface: input.runtimeSurface,
    sideEffectStatus: input.result.sideEffectStatus,
    sideEffectTable: input.result.sideEffectTable,
    sideEffectRowId: input.result.sideEffectRowId,
    lineageMetadata: input.result.metadata,
    orderingMetadata: {
      orderingSource: `payment_confirmation_service.${input.sideEffectKind}`,
      replayTimestampSource: "payment_fanout_runtime_observed_at",
    },
    reconstructionMetadata: {
      fanoutStatus: input.result.fanoutStatus,
    },
    provenanceMetadata: {
      paymentRuntimeAuthorityPreserved: true,
      subscriptionRuntimeAuthorityPreserved: true,
      earningRuntimeAuthorityPreserved: true,
      notificationRuntimeAuthorityPreserved: true,
    },
  })
}
