import type {
  PaymentProvider,
  PaymentTargetType,
  PaymentType,
} from "@/modules/payment/types"

import { isWave010PaymentReconstructionEnabled } from "./feature-flags"
import { writeCanonicalPaymentReconstructionNoThrow } from "./canonical-payment-reconstruction-repository"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type PaymentEventReconstructionInput = Readonly<{
  paymentId: string
  type: PaymentType
  provider: PaymentProvider
  providerReferenceId?: string | null
  providerOrderId?: string | null
  providerStatus?: string | null
  targetType: PaymentTargetType
  targetId?: string | null
  confirmedAt: string
  reconstructionMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type PaymentEventReconstructionValidationInput = Readonly<{
  paymentId: string
  paymentLineageMissing?: boolean
  providerCorrelationMissing?: boolean
  paymentReconstructionIncomplete?: boolean
  paymentOrderingGapDetected?: boolean
  replayOwnedPaymentMutationDetected?: boolean
  ledgerAuthorityContaminationDetected?: boolean
  paymentAuthorityContaminationDetected?: boolean
  reconciliationOwnedRepairDetected?: boolean
}>

export type PaymentEventReconstructionValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  providerAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  ledgerAuthoritative: false
  replayMutationAllowed: false
  reconciliationRepairAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function reconstructionConfidence(input: {
  providerReferenceObserved: boolean
  providerOrderObserved: boolean
  providerStatusObserved: boolean
  confirmationTimestampObserved: boolean
}): string {
  if (
    input.providerReferenceObserved &&
    input.providerOrderObserved &&
    input.providerStatusObserved &&
    input.confirmationTimestampObserved
  ) {
    return "payment_runtime_reconstructable_complete"
  }

  if (input.providerReferenceObserved && input.confirmationTimestampObserved) {
    return "payment_runtime_reconstructable_partial"
  }

  return "payment_runtime_reconstructable_incomplete"
}

function createPaymentReconstructionKeys(input: PaymentEventReconstructionInput) {
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
    paymentOrderingKey: [
      "payment_ordering",
      input.paymentId,
      stableKeyPart(input.confirmedAt),
    ].join(":"),
    providerReconstructionKey: [
      "provider_reconstruction",
      input.provider,
      providerReference,
      input.paymentId,
    ].join(":"),
    paymentReconstructionKey: [
      "payment_reconstruction",
      input.paymentId,
      stableKeyPart(input.confirmedAt),
    ].join(":"),
  }
}

export async function synchronizePaymentEventReconstructionNoThrow(
  input: PaymentEventReconstructionInput
): Promise<void> {
  if (!isWave010PaymentReconstructionEnabled()) return

  try {
    const keys = createPaymentReconstructionKeys(input)
    const providerReferenceObserved = observed(input.providerReferenceId)
    const providerOrderObserved = observed(input.providerOrderId)
    const providerStatusObserved = observed(input.providerStatus)
    const confirmationTimestampObserved = observed(input.confirmedAt)
    const confidence = reconstructionConfidence({
      providerReferenceObserved,
      providerOrderObserved,
      providerStatusObserved,
      confirmationTimestampObserved,
    })

    await writeCanonicalPaymentReconstructionNoThrow({
      ...keys,
      paymentId: input.paymentId,
      reconstructionStatus: "observed",
      reconstructionConfidence: confidence,
      paymentEventObserved: true,
      providerCorrelationObserved: true,
      paymentOrderingObserved: true,
      providerReconstructionObserved: true,
      replaySafeOrderingObserved: true,
      providerReferenceObserved,
      providerOrderObserved,
      confirmationTimestampObserved,
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        paymentType: input.type,
        providerStatus: input.providerStatus,
        targetType: input.targetType,
        targetId: input.targetId,
        paymentRuntimeReplayed: false,
        providerExecutionReplayed: false,
      },
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        paymentEventKey: keys.paymentEventKey,
        providerCorrelationKey: keys.providerCorrelationKey,
        paymentOrderingKey: keys.paymentOrderingKey,
        providerReconstructionKey: keys.providerReconstructionKey,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface: "payment_confirmation_service",
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payment.traceability.event_reconstruction.failed_open",
      message: "Payment event reconstruction failed open",
      error,
    })
  }
}

export function validatePaymentEventReconstructionReadiness(
  input: PaymentEventReconstructionValidationInput
): PaymentEventReconstructionValidation {
  const blockers = [
    input.paymentLineageMissing ? "payment_lineage_missing" : null,
    input.providerCorrelationMissing
      ? "provider_correlation_missing"
      : null,
    input.paymentReconstructionIncomplete
      ? "payment_reconstruction_incomplete"
      : null,
    input.paymentOrderingGapDetected
      ? "payment_replay_ordering_gap_detected"
      : null,
    input.replayOwnedPaymentMutationDetected
      ? "replay_owned_payment_mutation_detected"
      : null,
    input.ledgerAuthorityContaminationDetected
      ? "ledger_authority_contamination_detected"
      : null,
    input.paymentAuthorityContaminationDetected
      ? "payment_authority_contamination_detected"
      : null,
    input.reconciliationOwnedRepairDetected
      ? "reconciliation_owned_payment_repair_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    providerAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    ledgerAuthoritative: false,
    replayMutationAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
