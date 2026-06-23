import type { EarningSourceType } from "@/modules/payout/types"

import { writeCanonicalEarningCreationProvenanceNoThrow } from "./canonical-earning-creation-provenance-repository"
import { isWave010EarningCreationProvenanceEnabled } from "./feature-flags"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type EarningCreationProvenanceInput = Readonly<{
  paymentId: string
  earningId: string
  creatorId: string
  sourceType: EarningSourceType
  earningStatus: string
  grossAmount: number
  feeRateBps: number
  feeAmount: number
  netAmount: number
  currency: string
  availableAt?: string | null
  earningCreatedAt?: string | null
  runtimeSurface?: string
  settlementStatus?: "observed" | "skipped" | "failed"
  settlementMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  earningMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type EarningCreationProvenanceValidationInput = Readonly<{
  paymentId: string
  earningLineageDriftDetected?: boolean
  orphanedEarningLineageDetected?: boolean
  replaySafeEarningReconstructionGapDetected?: boolean
  paymentToEarningLineageDivergenceDetected?: boolean
  payoutEligibilityMismatchDetected?: boolean
  settlementReplayRepairDetected?: boolean
  projectionOwnedBalanceDetected?: boolean
  settlementAuthorityContaminationDetected?: boolean
  immutableLedgerPromotionDetected?: boolean
}>

export type EarningCreationProvenanceValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  earningRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  immutableLedgerPromotionAllowed: false
  settlementReplayRepairAllowed: false
  payoutEligibilityReplacementAllowed: false
  replayOwnedExecutionAllowed: false
  reconciliationRepairAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function amountObserved(value: number): boolean {
  return Number.isInteger(value) && value >= 0
}

function reconstructionConfidence(input: {
  paymentObserved: boolean
  earningObserved: boolean
  amountObserved: boolean
  feeObserved: boolean
  availabilityObserved: boolean
  payoutEligibilityObserved: boolean
}): string {
  if (
    input.paymentObserved &&
    input.earningObserved &&
    input.amountObserved &&
    input.feeObserved &&
    input.availabilityObserved &&
    input.payoutEligibilityObserved
  ) {
    return "earning_runtime_complete"
  }

  if (input.paymentObserved && input.earningObserved && input.amountObserved) {
    return "earning_runtime_partial"
  }

  return "earning_runtime_incomplete"
}

function createEarningCreationKeys(input: EarningCreationProvenanceInput) {
  const payment = stableKeyPart(input.paymentId)
  const earning = stableKeyPart(input.earningId)

  return {
    paymentEventKey: `payment_event:${payment}:confirmed`,
    paymentFanoutEventKey: [
      "payment_fanout_event",
      payment,
      20,
      "settlement_earning_creation",
      stableKeyPart(input.settlementStatus ?? "observed"),
    ].join(":"),
    settlementEventKey: [
      "settlement_event",
      payment,
      earning,
      stableKeyPart(input.sourceType),
    ].join(":"),
    earningLineageKey: [
      "earning_lineage",
      "payment_to_earning",
      payment,
      earning,
    ].join(":"),
    earningProvenanceKey: [
      "earning_provenance",
      "creation",
      payment,
      earning,
    ].join(":"),
    earningReconstructionKey: [
      "earning_reconstruction",
      payment,
      earning,
    ].join(":"),
  }
}

export async function synchronizeEarningCreationProvenanceNoThrow(
  input: EarningCreationProvenanceInput
): Promise<void> {
  if (!isWave010EarningCreationProvenanceEnabled()) return

  try {
    const keys = createEarningCreationKeys(input)
    const runtimeSurface = input.runtimeSurface ?? "earning_creation_server"
    const paymentObserved = observed(input.paymentId)
    const earningObserved = observed(input.earningId)
    const grossObserved = amountObserved(input.grossAmount)
    const feeObserved =
      amountObserved(input.feeRateBps) && amountObserved(input.feeAmount)
    const netObserved = amountObserved(input.netAmount)
    const availabilityObserved = observed(input.availableAt)
    const payoutEligibilityObserved =
      input.earningStatus === "pending" && input.availableAt != null
    const confidence = reconstructionConfidence({
      paymentObserved,
      earningObserved,
      amountObserved: grossObserved && netObserved,
      feeObserved,
      availabilityObserved,
      payoutEligibilityObserved,
    })
    const settledAt =
      input.earningCreatedAt ?? input.availableAt ?? new Date().toISOString()

    await writeCanonicalEarningCreationProvenanceNoThrow({
      ...keys,
      paymentId: input.paymentId,
      earningId: input.earningId,
      creatorId: input.creatorId,
      sourceType: input.sourceType,
      earningStatus: input.earningStatus,
      grossAmount: input.grossAmount,
      feeRateBps: input.feeRateBps,
      feeAmount: input.feeAmount,
      netAmount: input.netAmount,
      currency: input.currency,
      availableAt: input.availableAt,
      earningCreatedAt: input.earningCreatedAt,
      settledAt,
      runtimeSurface,
      settlementStatus: input.settlementStatus ?? "observed",
      reconstructionStatus: "observed",
      reconstructionConfidence: confidence,
      paymentObserved,
      earningObserved,
      amountObserved: grossObserved && netObserved,
      feeObserved,
      availabilityObserved,
      payoutEligibilityObserved,
      settlementMetadata: {
        ...(input.settlementMetadata ?? {}),
        earningRuntimeAuthorityPreserved: true,
      },
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        paymentToEarningRuntimeObserved: true,
      },
      earningMetadata: {
        ...(input.earningMetadata ?? {}),
        payoutEligibilityReplacementAllowed: false,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        replaySafeEarningReconstructionMeasurable: true,
        settlementReplayRepairAllowed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface,
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payout.traceability.earning_creation_provenance.failed_open",
      message: "Earning creation provenance failed open",
      error,
    })
  }
}

export function validateEarningCreationProvenanceReadiness(
  input: EarningCreationProvenanceValidationInput
): EarningCreationProvenanceValidation {
  const blockers = [
    input.earningLineageDriftDetected
      ? "earning_lineage_drift_detected"
      : null,
    input.orphanedEarningLineageDetected
      ? "orphaned_earning_lineage_detected"
      : null,
    input.replaySafeEarningReconstructionGapDetected
      ? "replay_safe_earning_reconstruction_gap_detected"
      : null,
    input.paymentToEarningLineageDivergenceDetected
      ? "payment_to_earning_lineage_divergence_detected"
      : null,
    input.payoutEligibilityMismatchDetected
      ? "payout_eligibility_mismatch_detected"
      : null,
    input.settlementReplayRepairDetected
      ? "settlement_replay_repair_detected"
      : null,
    input.projectionOwnedBalanceDetected
      ? "projection_owned_balance_detected"
      : null,
    input.settlementAuthorityContaminationDetected
      ? "settlement_authority_contamination_detected"
      : null,
    input.immutableLedgerPromotionDetected
      ? "immutable_ledger_promotion_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    earningRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    immutableLedgerPromotionAllowed: false,
    settlementReplayRepairAllowed: false,
    payoutEligibilityReplacementAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
