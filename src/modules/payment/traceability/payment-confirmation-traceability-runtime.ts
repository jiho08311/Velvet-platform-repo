import type {
  PaymentProvider,
  PaymentTargetType,
  PaymentType,
} from "@/modules/payment/types"

import { isWave010PaymentTraceabilityEnabled } from "./feature-flags"
import { writeCanonicalPaymentTraceabilityNoThrow } from "./canonical-payment-traceability-repository"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type PaymentConfirmationTraceabilityInput = Readonly<{
  paymentId: string
  userId: string
  creatorId?: string | null
  type: PaymentType
  amount: number
  currency: string
  provider: PaymentProvider
  providerReferenceId?: string | null
  providerOrderId?: string | null
  providerStatus?: string | null
  targetType: PaymentTargetType
  targetId?: string | null
  confirmedAt: string
  sourceOperation?: string
  sourceVersion?: string
  replayTimestampSource?: string
  correlationMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type PaymentConfirmationTraceabilityValidationInput = Readonly<{
  paymentId: string
  providerReferenceId?: string | null
  confirmedAt?: string | null
  replayOwnedPaymentMutationDetected?: boolean
  reconciliationOwnedRepairDetected?: boolean
  projectionOwnedPaymentAuthorityDetected?: boolean
  providerReplayExecutionDetected?: boolean
  lineageMissing?: boolean
  providerCorrelationMissing?: boolean
  replayOrderingGapDetected?: boolean
}>

export type PaymentConfirmationTraceabilityValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  replayMutationAllowed: false
  reconciliationRepairAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function createTraceabilityKeys(input: PaymentConfirmationTraceabilityInput) {
  const providerReference = stableKeyPart(input.providerReferenceId)
  const order = stableKeyPart(input.providerOrderId)

  return {
    paymentEventKey: `payment_event:${input.paymentId}:confirmed`,
    providerCorrelationKey: [
      "provider_correlation",
      input.provider,
      providerReference,
      order,
      input.paymentId,
    ].join(":"),
    confirmationLineageKey: `confirmation_lineage:${input.paymentId}:confirmed`,
    paymentOrderingKey: [
      "payment_ordering",
      input.paymentId,
      stableKeyPart(input.confirmedAt),
    ].join(":"),
  }
}

export async function synchronizePaymentConfirmationTraceabilityNoThrow(
  input: PaymentConfirmationTraceabilityInput
): Promise<void> {
  if (!isWave010PaymentTraceabilityEnabled()) return

  try {
    const keys = createTraceabilityKeys(input)

    await writeCanonicalPaymentTraceabilityNoThrow({
      ...keys,
      paymentId: input.paymentId,
      userId: input.userId,
      creatorId: input.creatorId,
      paymentType: input.type,
      paymentStatus: "succeeded",
      amount: input.amount,
      currency: input.currency,
      provider: input.provider,
      providerReferenceId: input.providerReferenceId,
      providerOrderId: input.providerOrderId,
      providerStatus: input.providerStatus ?? "succeeded",
      targetType: input.targetType,
      targetId: input.targetId,
      confirmedAt: input.confirmedAt,
      sourceOperation:
        input.sourceOperation ?? "confirmPaymentService",
      sourceVersion: input.sourceVersion ?? "wave_010_fel_br_010",
      replayTimestampSource:
        input.replayTimestampSource ?? "payments.confirmed_at",
      correlationMetadata: {
        ...(input.correlationMetadata ?? {}),
        paymentRuntimeAuthorityPreserved: true,
        providerConfirmationAuthorityPreserved: true,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface: "payment_confirmation_service",
        writeSurface: "payment_write_repository",
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payment.traceability.confirmation.failed_open",
      message: "Payment confirmation traceability failed open",
      error,
    })
  }
}

export function validatePaymentConfirmationTraceabilityReadiness(
  input: PaymentConfirmationTraceabilityValidationInput
): PaymentConfirmationTraceabilityValidation {
  const blockers = [
    input.replayOwnedPaymentMutationDetected
      ? "replay_owned_payment_mutation_detected"
      : null,
    input.reconciliationOwnedRepairDetected
      ? "reconciliation_owned_payment_repair_detected"
      : null,
    input.projectionOwnedPaymentAuthorityDetected
      ? "projection_owned_payment_authority_detected"
      : null,
    input.providerReplayExecutionDetected
      ? "provider_replay_execution_detected"
      : null,
    input.lineageMissing ? "payment_lineage_missing" : null,
    input.providerCorrelationMissing
      ? "provider_correlation_missing"
      : null,
    input.replayOrderingGapDetected
      ? "payment_replay_ordering_gap_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    replayMutationAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
