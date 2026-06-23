import { writeCanonicalPayoutTerminalProvenanceNoThrow } from "./canonical-payout-terminal-provenance-repository"
import { isWave010PayoutTerminalProvenanceEnabled } from "./feature-flags"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type PayoutTerminalProvenanceTargetState = "paid" | "failed"

export type PayoutTerminalProvenanceInput = Readonly<{
  payoutId: string
  payoutRequestId?: string | null
  creatorId: string
  targetState: PayoutTerminalProvenanceTargetState
  previousPayoutStatus: string
  amount?: number | null
  currency?: string | null
  terminalAt: string
  linkedEarningIds: readonly string[]
  failureReason?: string | null
  runtimeSurface?: string
  executionSurface?: string
  terminalEventMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  parityMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type PayoutTerminalProvenanceValidationInput = Readonly<{
  payoutId: string
  payoutTerminalOrderingDriftDetected?: boolean
  replaySafePayoutGapDetected?: boolean
  payoutParityMismatchDetected?: boolean
  earningPaidOutLinkageMismatchDetected?: boolean
  payoutLineageDivergenceDetected?: boolean
  replayOwnedPayoutExecutionDetected?: boolean
  shadowPayoutExecutionDetected?: boolean
  reconciliationOwnedPayoutRepairDetected?: boolean
  payoutAuthorityContaminationDetected?: boolean
  payoutExecutionTransferDetected?: boolean
}>

export type PayoutTerminalProvenanceValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  payoutRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  payoutExecutionTransferAllowed: false
  shadowPayoutExecutionAllowed: false
  replayOwnedExecutionAllowed: false
  reconciliationRepairAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function positiveAmount(value: number | null | undefined): boolean {
  return value == null || (Number.isInteger(value) && value > 0)
}

function createPayoutTerminalKeys(input: PayoutTerminalProvenanceInput) {
  const payout = stableKeyPart(input.payoutId)
  const targetState = stableKeyPart(input.targetState)

  return {
    payoutTerminalEventKey: [
      "payout_terminal_event",
      targetState,
      payout,
    ].join(":"),
    payoutTerminalOrderingKey: [
      "payout_terminal_ordering",
      targetState,
      payout,
      20,
    ].join(":"),
    payoutParityKey: ["payout_terminal_parity", targetState, payout].join(":"),
    payoutReconstructionKey: [
      "payout_terminal_reconstruction",
      targetState,
      payout,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  payoutObserved: boolean
  payoutRequestObserved: boolean
  terminalTimestampObserved: boolean
  runtimeExecutionObserved: boolean
  earningLinkageObserved: boolean
  paidOutLinkageObserved: boolean
  amountObserved: boolean
}): string {
  if (
    input.payoutObserved &&
    input.terminalTimestampObserved &&
    input.runtimeExecutionObserved &&
    input.earningLinkageObserved &&
    input.paidOutLinkageObserved &&
    input.amountObserved
  ) {
    return "payout_terminal_runtime_complete"
  }

  if (
    input.payoutObserved &&
    input.terminalTimestampObserved &&
    input.runtimeExecutionObserved
  ) {
    return "payout_terminal_runtime_partial"
  }

  return "payout_terminal_runtime_incomplete"
}

function createLineage(input: PayoutTerminalProvenanceInput) {
  const payout = stableKeyPart(input.payoutId)

  return input.linkedEarningIds.map((earningId) => ({
    payoutTerminalLineageKey: [
      "payout_terminal_lineage",
      input.targetState === "paid"
        ? "payout_paid_to_earning_paid_out"
        : "payout_failed_to_earning_released",
      payout,
      stableKeyPart(earningId),
    ].join(":"),
    lineageKind:
      input.targetState === "paid"
        ? "payout_paid_to_earning_paid_out"
        : "payout_failed_to_earning_released",
    sourceTable: "payouts",
    sourceRowId: input.payoutId,
    targetTable: "earnings",
    targetRowId: earningId,
    earningId,
    lineageMetadata: {
      payoutExecutionServiceAuthoritative: true,
      targetState: input.targetState,
    },
  }))
}

export async function synchronizePayoutTerminalProvenanceNoThrow(
  input: PayoutTerminalProvenanceInput
): Promise<void> {
  if (!isWave010PayoutTerminalProvenanceEnabled()) return

  try {
    const keys = createPayoutTerminalKeys(input)
    const runtimeSurface = input.runtimeSurface ?? "payout_execution_service"
    const executionSurface = input.executionSurface ?? "mark_payout_as_paid"
    const payoutObserved = observed(input.payoutId)
    const payoutRequestObserved = observed(input.payoutRequestId)
    const terminalTimestampObserved = observed(input.terminalAt)
    const runtimeExecutionObserved =
      runtimeSurface === "payout_execution_service" ||
      executionSurface === "mark_payout_as_paid"
    const earningLinkageObserved = input.linkedEarningIds.length > 0
    const paidOutLinkageObserved =
      input.targetState === "paid" && earningLinkageObserved
    const amountObserved = positiveAmount(input.amount)
    const confidence = reconstructionConfidence({
      payoutObserved,
      payoutRequestObserved,
      terminalTimestampObserved,
      runtimeExecutionObserved,
      earningLinkageObserved,
      paidOutLinkageObserved,
      amountObserved,
    })
    const expectedEarningStatus =
      input.targetState === "paid" ? "paid_out" : "available"

    await writeCanonicalPayoutTerminalProvenanceNoThrow({
      ...keys,
      payoutId: input.payoutId,
      payoutRequestId: input.payoutRequestId ?? null,
      creatorId: input.creatorId,
      terminalEventKind:
        input.targetState === "paid" ? "payout_paid" : "payout_failed",
      terminalStatus: "observed",
      previousPayoutStatus: input.previousPayoutStatus,
      nextPayoutStatus: input.targetState,
      amount: input.amount ?? null,
      currency: input.currency ?? "KRW",
      runtimeSurface,
      executionSurface,
      terminalAt: input.terminalAt,
      terminalSequence: 20,
      orderingTimestamp: input.terminalAt || new Date().toISOString(),
      orderingSource: "runtime_payout_terminal",
      replayTimestampSource:
        input.targetState === "paid" ? "payouts.paid_at" : "payouts.created_at",
      orderingConfidence: confidence,
      parityStatus: "observed",
      parityConfidence: confidence,
      linkedEarningCount: input.linkedEarningIds.length,
      expectedTerminalStatus: input.targetState,
      observedTerminalStatus: input.targetState,
      expectedEarningStatus,
      earningLinkageObserved,
      earningPaidOutLinkageObserved: paidOutLinkageObserved,
      reconstructionStatus: "observed",
      reconstructionConfidence: confidence,
      payoutObserved,
      payoutRequestObserved,
      terminalTimestampObserved,
      paidOutLinkageObserved,
      runtimeExecutionObserved,
      lineage: createLineage(input),
      terminalEventMetadata: {
        ...(input.terminalEventMetadata ?? {}),
        payoutTerminalRuntimeAuthorityPreserved: true,
        failureReason: input.failureReason ?? null,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        replaySafePayoutTerminalOrderingMeasurable: true,
        terminalSequence: 20,
      },
      parityMetadata: {
        ...(input.parityMetadata ?? {}),
        payoutParityObservabilityEstablished: true,
        earningPaidOutLinkageVisibilityEstablished: true,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        replayOwnedPayoutExecutionAllowed: false,
        shadowPayoutExecutionAllowed: false,
        reconciliationOwnedPayoutRepairAllowed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface,
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payout.traceability.terminal_provenance.failed_open",
      message: "Payout terminal provenance failed open",
      error,
    })
  }
}

export function validatePayoutTerminalProvenanceReadiness(
  input: PayoutTerminalProvenanceValidationInput
): PayoutTerminalProvenanceValidation {
  const blockers = [
    input.payoutTerminalOrderingDriftDetected
      ? "payout_terminal_ordering_drift_detected"
      : null,
    input.replaySafePayoutGapDetected
      ? "replay_safe_payout_gap_detected"
      : null,
    input.payoutParityMismatchDetected
      ? "payout_parity_mismatch_detected"
      : null,
    input.earningPaidOutLinkageMismatchDetected
      ? "earning_paid_out_linkage_mismatch_detected"
      : null,
    input.payoutLineageDivergenceDetected
      ? "payout_lineage_divergence_detected"
      : null,
    input.replayOwnedPayoutExecutionDetected
      ? "replay_owned_payout_execution_detected"
      : null,
    input.shadowPayoutExecutionDetected
      ? "shadow_payout_execution_detected"
      : null,
    input.reconciliationOwnedPayoutRepairDetected
      ? "reconciliation_owned_payout_repair_detected"
      : null,
    input.payoutAuthorityContaminationDetected
      ? "payout_authority_contamination_detected"
      : null,
    input.payoutExecutionTransferDetected
      ? "payout_execution_transfer_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    payoutRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    payoutExecutionTransferAllowed: false,
    shadowPayoutExecutionAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
