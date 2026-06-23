import type { PaymentType } from "@/modules/payment/types"

import { isWave010PaymentSideEffectLineageEnabled } from "./feature-flags"
import { writeCanonicalSideEffectReconstructionNoThrow } from "./canonical-side-effect-reconstruction-repository"
import type { PaymentFanoutSideEffectKind } from "./payment-fanout-traceability-runtime"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type PaymentSideEffectLineageInput = Readonly<{
  paymentId: string
  paymentType: PaymentType
  confirmedAt: string
  sideEffectKind: PaymentFanoutSideEffectKind
  fanoutSequence: number
  runtimeSurface: string
  sideEffectStatus: "observed" | "skipped" | "failed"
  sideEffectTable?: string | null
  sideEffectRowId?: string | null
  occurredAt?: string
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type PaymentSideEffectLineageValidationInput = Readonly<{
  paymentId: string
  sideEffectOrderingDriftDetected?: boolean
  replaySafeFanoutGapDetected?: boolean
  missingSideEffectLineage?: boolean
  orphanedEarningLinkageDetected?: boolean
  replayOwnedSideEffectExecutionDetected?: boolean
  sideEffectAuthorityContaminationDetected?: boolean
  entitlementAuthorityPromotionDetected?: boolean
}>

export type PaymentSideEffectLineageValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  replayOwnedExecutionAllowed: false
  reconciliationRepairAllowed: false
  entitlementAuthorityPromotionAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function createSideEffectLineageKeys(input: PaymentSideEffectLineageInput) {
  const status = stableKeyPart(input.sideEffectStatus)

  return {
    paymentEventKey: `payment_event:${input.paymentId}:confirmed`,
    fanoutEventKey: [
      "payment_fanout_event",
      input.paymentId,
      input.fanoutSequence,
      input.sideEffectKind,
      status,
    ].join(":"),
    sideEffectLineageKey: [
      "payment_side_effect_lineage",
      input.paymentId,
      input.sideEffectKind,
      status,
    ].join(":"),
    fanoutOrderingKey: [
      "payment_fanout_ordering",
      input.paymentId,
      input.fanoutSequence,
      input.sideEffectKind,
    ].join(":"),
    sideEffectReconstructionKey: [
      "payment_side_effect_reconstruction",
      input.paymentId,
      input.fanoutSequence,
      input.sideEffectKind,
      status,
    ].join(":"),
  }
}

function reconstructionConfidence(
  input: PaymentSideEffectLineageInput
): string {
  if (input.sideEffectStatus === "failed") {
    return "side_effect_runtime_failed_reconstructable"
  }

  if (input.sideEffectStatus === "skipped") {
    return "side_effect_runtime_skipped_reconstructable"
  }

  if (input.sideEffectRowId) {
    return "side_effect_runtime_reconstructable_complete"
  }

  return "side_effect_runtime_reconstructable_partial"
}

export async function synchronizePaymentSideEffectLineageNoThrow(
  input: PaymentSideEffectLineageInput
): Promise<void> {
  if (!isWave010PaymentSideEffectLineageEnabled()) return

  try {
    const keys = createSideEffectLineageKeys(input)
    const occurredAt = input.occurredAt ?? new Date().toISOString()
    const sideEffectRowObserved = input.sideEffectRowId != null
    const replaySafeReconstructable =
      input.sideEffectStatus !== "observed" || sideEffectRowObserved

    await writeCanonicalSideEffectReconstructionNoThrow({
      ...keys,
      paymentId: input.paymentId,
      sideEffectKind: input.sideEffectKind,
      runtimeSurface: input.runtimeSurface,
      sideEffectTable: input.sideEffectTable,
      sideEffectRowId: input.sideEffectRowId,
      fanoutSequence: input.fanoutSequence,
      reconstructionStatus: input.sideEffectStatus,
      reconstructionConfidence: reconstructionConfidence(input),
      lineageObserved: true,
      fanoutEventObserved: true,
      orderingObserved: true,
      sideEffectRowObserved,
      replaySafeReconstructable,
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        paymentType: input.paymentType,
        confirmedAt: input.confirmedAt,
        sideEffectStatus: input.sideEffectStatus,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        paymentType: input.paymentType,
        confirmedAt: input.confirmedAt,
        fanoutSequence: input.fanoutSequence,
        occurredAt,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        paymentType: input.paymentType,
        confirmedAt: input.confirmedAt,
        paymentRuntimeReplayed: false,
        sideEffectRuntimeReplayed: false,
        replaySideEffectExecuted: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface: input.runtimeSurface,
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payment.traceability.side_effect_lineage.failed_open",
      message: "Payment side-effect lineage failed open",
      error,
    })
  }
}

export function validatePaymentSideEffectLineageReadiness(
  input: PaymentSideEffectLineageValidationInput
): PaymentSideEffectLineageValidation {
  const blockers = [
    input.sideEffectOrderingDriftDetected
      ? "side_effect_ordering_drift_detected"
      : null,
    input.replaySafeFanoutGapDetected
      ? "replay_safe_fanout_gap_detected"
      : null,
    input.missingSideEffectLineage
      ? "side_effect_lineage_missing"
      : null,
    input.orphanedEarningLinkageDetected
      ? "orphaned_earning_linkage_detected"
      : null,
    input.replayOwnedSideEffectExecutionDetected
      ? "replay_owned_side_effect_execution_detected"
      : null,
    input.sideEffectAuthorityContaminationDetected
      ? "side_effect_authority_contamination_detected"
      : null,
    input.entitlementAuthorityPromotionDetected
      ? "entitlement_authority_promotion_detected"
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
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
    entitlementAuthorityPromotionAllowed: false,
  }
}
