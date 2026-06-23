import type {
  PaymentProvider,
  PaymentTargetType,
  PaymentType,
} from "@/modules/payment/types"

import { isWave010ProviderCorrelationTraceabilityEnabled } from "./feature-flags"
import { writeCanonicalProviderCorrelationTraceabilityNoThrow } from "./canonical-provider-correlation-traceability-repository"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type ProviderCorrelationTraceabilityInput = Readonly<{
  paymentId: string
  type: PaymentType
  provider: PaymentProvider
  providerReferenceId?: string | null
  providerOrderId?: string | null
  providerStatus?: string | null
  targetType: PaymentTargetType
  targetId?: string | null
  confirmedAt: string
  runtimeSurface?: string
  orderingSource?: string
  replayTimestampSource?: string
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type ProviderCorrelationTraceabilityValidationInput = Readonly<{
  paymentId: string
  providerCorrelationMissing?: boolean
  providerLineageMissing?: boolean
  providerOrderingGapDetected?: boolean
  providerCompletenessDriftDetected?: boolean
  providerLineageDivergenceDetected?: boolean
  providerReplayExecutionDetected?: boolean
  providerReplayMutationDetected?: boolean
  providerAuthorityContaminationDetected?: boolean
  reconciliationOwnedRepairDetected?: boolean
}>

export type ProviderCorrelationTraceabilityValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  providerAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  replayOwnedExecutionAllowed: false
  providerReplayMutationAllowed: false
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
    return "provider_runtime_complete"
  }

  if (input.providerReferenceObserved && input.confirmationTimestampObserved) {
    return "provider_runtime_partial"
  }

  return "provider_runtime_incomplete"
}

function createProviderCorrelationKeys(
  input: ProviderCorrelationTraceabilityInput
) {
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
    providerLineageKey: [
      "provider_lineage",
      input.provider,
      providerReference,
      order,
      input.paymentId,
    ].join(":"),
    providerOrderingKey: [
      "provider_ordering",
      input.provider,
      input.paymentId,
      stableKeyPart(input.confirmedAt),
    ].join(":"),
    providerReconstructionKey: [
      "provider_reconstruction",
      input.provider,
      providerReference,
      input.paymentId,
    ].join(":"),
  }
}

export async function synchronizeProviderCorrelationTraceabilityNoThrow(
  input: ProviderCorrelationTraceabilityInput
): Promise<void> {
  if (!isWave010ProviderCorrelationTraceabilityEnabled()) return

  try {
    const keys = createProviderCorrelationKeys(input)
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

    await writeCanonicalProviderCorrelationTraceabilityNoThrow({
      ...keys,
      paymentId: input.paymentId,
      provider: input.provider,
      providerReferenceId: input.providerReferenceId,
      providerOrderId: input.providerOrderId,
      providerStatus: input.providerStatus,
      runtimeSurface: input.runtimeSurface ?? "payment_confirmation_service",
      orderingTimestamp: input.confirmedAt,
      orderingSource:
        input.orderingSource ?? "payment_confirmation_service.provider_confirmed_at",
      replayTimestampSource:
        input.replayTimestampSource ?? "payments.confirmed_at",
      orderingConfidence: "observed_provider_confirmation",
      reconstructionStatus: "observed",
      reconstructionConfidence: confidence,
      providerReferenceObserved,
      providerOrderObserved,
      providerStatusObserved,
      confirmationTimestampObserved,
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        paymentType: input.type,
        targetType: input.targetType,
        targetId: input.targetId,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        paymentType: input.type,
        providerStatus: input.providerStatus,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        paymentType: input.type,
        providerCompletenessMeasurable: true,
        providerExecutionReplayed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface: input.runtimeSurface ?? "payment_confirmation_service",
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payment.traceability.provider_correlation.failed_open",
      message: "Provider correlation traceability failed open",
      error,
    })
  }
}

export function validateProviderCorrelationTraceabilityReadiness(
  input: ProviderCorrelationTraceabilityValidationInput
): ProviderCorrelationTraceabilityValidation {
  const blockers = [
    input.providerCorrelationMissing
      ? "provider_correlation_missing"
      : null,
    input.providerLineageMissing ? "provider_lineage_missing" : null,
    input.providerOrderingGapDetected
      ? "provider_replay_ordering_gap_detected"
      : null,
    input.providerCompletenessDriftDetected
      ? "provider_completeness_drift_detected"
      : null,
    input.providerLineageDivergenceDetected
      ? "provider_lineage_divergence_detected"
      : null,
    input.providerReplayExecutionDetected
      ? "provider_replay_execution_detected"
      : null,
    input.providerReplayMutationDetected
      ? "provider_replay_mutation_detected"
      : null,
    input.providerAuthorityContaminationDetected
      ? "provider_authority_contamination_detected"
      : null,
    input.reconciliationOwnedRepairDetected
      ? "provider_reconciliation_owned_repair_detected"
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
    replayOwnedExecutionAllowed: false,
    providerReplayMutationAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
