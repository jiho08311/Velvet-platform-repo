import { synchronizeFinancialTimelineNoThrow } from "@/shared/observability/financial-timeline"
import { writeCanonicalPayoutEventTopologyNoThrow } from "./canonical-payout-event-topology-repository"
import { isWave010CanonicalPayoutEventTopologyEnabled } from "./feature-flags"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type PayoutEventTopologyLifecycleStage = "approval" | "terminal"

export type PayoutEventTopologyInput = Readonly<{
  payoutRequestId?: string | null
  payoutId?: string | null
  creatorId: string
  eventKind: "payout_approved" | "payout_paid" | "payout_failed"
  lifecycleStage: PayoutEventTopologyLifecycleStage
  previousPayoutStatus?: string | null
  nextPayoutStatus: string
  amount?: number | null
  currency?: string | null
  occurredAt: string
  runtimeSurface: string
  authoritySurface: string
  sourceTable: string
  sourceRowId?: string | null
  targetTable?: string | null
  targetRowId?: string | null
  payoutApprovalKey?: string | null
  payoutTerminalEventKey?: string | null
  payoutApprovalOrderingKey?: string | null
  payoutTerminalOrderingKey?: string | null
  privilegedExecutionKey?: string | null
  serviceRoleExecutionKey?: string | null
  orderingSource?: string
  replayTimestampSource?: string
  eventMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type PayoutEventTopologyValidationInput = Readonly<{
  payoutId?: string | null
  payoutLineageDivergenceDetected?: boolean
  payoutOrderingDriftDetected?: boolean
  replaySafePayoutGapDetected?: boolean
  payoutLifecycleMismatchDetected?: boolean
  missingPayoutLineageDetected?: boolean
  payoutReconstructionInstabilityDetected?: boolean
  replayOwnedPayoutMutationDetected?: boolean
  payoutAuthorityContaminationDetected?: boolean
  reconciliationOwnedPayoutRepairDetected?: boolean
}>

export type PayoutEventTopologyValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  payoutRuntimeAuthoritative: true
  payoutTerminalExecutionAuthoritative: true
  payoutApprovalExecutionAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  payoutExecutionTransferAllowed: false
  runtimePayoutReplacementAllowed: false
  replayOwnedExecutionAllowed: false
  reconciliationRepairAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function lifecycleSequence(input: PayoutEventTopologyInput): number {
  if (input.eventKind === "payout_approved") return 10
  if (input.eventKind === "payout_paid") return 20
  return 30
}

function createPayoutEventTopologyKeys(input: PayoutEventTopologyInput) {
  const payoutRequest = stableKeyPart(input.payoutRequestId)
  const payout = stableKeyPart(input.payoutId)
  const sequence = lifecycleSequence(input)

  return {
    payoutEventKey: [
      "payout_event",
      input.eventKind,
      payoutRequest,
      payout,
    ].join(":"),
    payoutOrderingKey: [
      "payout_ordering",
      sequence,
      input.eventKind,
      payoutRequest,
      payout,
    ].join(":"),
    payoutProvenanceKey: [
      "payout_provenance",
      input.eventKind,
      payoutRequest,
      payout,
    ].join(":"),
    payoutReconstructionKey: observed(input.payoutId)
      ? ["payout_reconstruction", input.eventKind, payout].join(":")
      : null,
  }
}

function reconstructionConfidence(input: {
  payoutObserved: boolean
  payoutRequestObserved: boolean
  approvalObserved: boolean
  terminalObserved: boolean
  replaySafeOrderingObserved: boolean
}): string {
  if (
    input.payoutObserved &&
    input.payoutRequestObserved &&
    input.replaySafeOrderingObserved &&
    (input.approvalObserved || input.terminalObserved)
  ) {
    return "payout_lifecycle_runtime_reconstructable_complete"
  }

  if (input.payoutObserved && input.replaySafeOrderingObserved) {
    return "payout_lifecycle_runtime_reconstructable_partial"
  }

  return "payout_lifecycle_runtime_reconstructable_incomplete"
}

export async function synchronizePayoutEventTopologyNoThrow(
  input: PayoutEventTopologyInput
): Promise<void> {
  if (!isWave010CanonicalPayoutEventTopologyEnabled()) return

  try {
    const keys = createPayoutEventTopologyKeys(input)
    const sequence = lifecycleSequence(input)
    const payoutObserved = observed(input.payoutId)
    const payoutRequestObserved = observed(input.payoutRequestId)
    const payoutApprovalObserved = observed(input.payoutApprovalKey)
    const payoutTerminalEventObserved = observed(input.payoutTerminalEventKey)
    const replaySafeOrderingObserved = observed(input.occurredAt)
    const confidence = reconstructionConfidence({
      payoutObserved,
      payoutRequestObserved,
      approvalObserved: payoutApprovalObserved,
      terminalObserved: payoutTerminalEventObserved,
      replaySafeOrderingObserved,
    })

    await writeCanonicalPayoutEventTopologyNoThrow({
      ...keys,
      payoutApprovalKey: input.payoutApprovalKey ?? null,
      payoutTerminalEventKey: input.payoutTerminalEventKey ?? null,
      payoutApprovalOrderingKey: input.payoutApprovalOrderingKey ?? null,
      payoutTerminalOrderingKey: input.payoutTerminalOrderingKey ?? null,
      privilegedExecutionKey: input.privilegedExecutionKey ?? null,
      serviceRoleExecutionKey: input.serviceRoleExecutionKey ?? null,
      payoutRequestId: input.payoutRequestId ?? null,
      payoutId: input.payoutId ?? null,
      creatorId: input.creatorId,
      eventKind: input.eventKind,
      lifecycleStage: input.lifecycleStage,
      lifecycleSequence: sequence,
      previousPayoutStatus: input.previousPayoutStatus ?? null,
      nextPayoutStatus: input.nextPayoutStatus,
      amount: input.amount ?? null,
      currency: input.currency ?? "KRW",
      runtimeSurface: input.runtimeSurface,
      authoritySurface: input.authoritySurface,
      sourceTable: input.sourceTable,
      sourceRowId: input.sourceRowId ?? null,
      targetTable: input.targetTable ?? null,
      targetRowId: input.targetRowId ?? null,
      orderingTimestamp: input.occurredAt || new Date().toISOString(),
      orderingSource: input.orderingSource ?? "runtime_payout_lifecycle",
      replayTimestampSource:
        input.replayTimestampSource ??
        (input.lifecycleStage === "approval"
          ? "payout_requests.approved_at"
          : "payouts.paid_at"),
      orderingConfidence: confidence,
      provenanceSource: "runtime_payout_lifecycle",
      provenanceStatus: "observed",
      reconstructionConfidence: confidence,
      payoutApprovalObserved,
      payoutTerminalEventObserved,
      replaySafeOrderingObserved,
      lifecycleReconstructionObserved: confidence !==
        "payout_lifecycle_runtime_reconstructable_incomplete",
      eventMetadata: {
        ...(input.eventMetadata ?? {}),
        canonicalPayoutEventTopologyObserved: true,
        payoutRuntimeAuthorityPreserved: true,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        lifecycleSequence: sequence,
        replaySafePayoutOrderingIntroduced: true,
      },
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        payoutLifecycleNormalizationIntroduced: true,
        runtimePayoutReplacementAllowed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        advisoryOnly: true,
        synchronizedCandidateOnly: true,
      },
    })
    await synchronizeFinancialTimelineNoThrow({
      timelineSurface: "financial.timeline.payout",
      timelineKey: keys.payoutEventKey,
      runtimeSurface: input.runtimeSurface,
      sourceAggregate: "payout",
      targetAggregate:
        input.lifecycleStage === "approval" ? "payout_terminal" : null,
      sourceTable: input.sourceTable,
      sourceRowId: input.sourceRowId ?? null,
      payoutRequestId: input.payoutRequestId ?? null,
      payoutId: input.payoutId ?? null,
      lifecycleStage: input.eventKind,
      lifecycleSequence: sequence,
      orderingTimestamp: input.occurredAt || new Date().toISOString(),
      orderingSource: input.orderingSource ?? "runtime_payout_lifecycle",
      replayTimestampSource:
        input.replayTimestampSource ??
        (input.lifecycleStage === "approval"
          ? "payout_requests.approved_at"
          : "payouts.paid_at"),
      lineageObserved: payoutObserved || payoutRequestObserved,
      timelineMetadata: {
        payoutEventKey: keys.payoutEventKey,
        payoutOrderingKey: keys.payoutOrderingKey,
      },
      reconstructionMetadata: {
        payoutReconstructionConfidence: confidence,
      },
      provenanceMetadata: {
        sourceBrief: "Wave-010-FEL-BR-036",
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payout.traceability.event_topology.failed_open",
      message: "Payout event topology failed open",
      error,
    })
  }
}

export function validatePayoutEventTopologyReadiness(
  input: PayoutEventTopologyValidationInput
): PayoutEventTopologyValidation {
  const blockers = [
    input.payoutLineageDivergenceDetected
      ? "payout_lineage_divergence_detected"
      : null,
    input.payoutOrderingDriftDetected
      ? "payout_ordering_drift_detected"
      : null,
    input.replaySafePayoutGapDetected
      ? "replay_safe_payout_gap_detected"
      : null,
    input.payoutLifecycleMismatchDetected
      ? "payout_lifecycle_mismatch_detected"
      : null,
    input.missingPayoutLineageDetected
      ? "missing_payout_lineage_detected"
      : null,
    input.payoutReconstructionInstabilityDetected
      ? "payout_reconstruction_instability_detected"
      : null,
    input.replayOwnedPayoutMutationDetected
      ? "replay_owned_payout_mutation_detected"
      : null,
    input.payoutAuthorityContaminationDetected
      ? "payout_authority_contamination_detected"
      : null,
    input.reconciliationOwnedPayoutRepairDetected
      ? "reconciliation_owned_payout_repair_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    payoutRuntimeAuthoritative: true,
    payoutTerminalExecutionAuthoritative: true,
    payoutApprovalExecutionAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    payoutExecutionTransferAllowed: false,
    runtimePayoutReplacementAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
