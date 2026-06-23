import { writeCanonicalPayoutApprovalProvenanceNoThrow } from "./canonical-payout-approval-provenance-repository"
import { isWave010PayoutApprovalProvenanceEnabled } from "./feature-flags"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type PayoutApprovalProvenanceInput = Readonly<{
  payoutRequestId: string
  payoutId: string
  creatorId: string
  amount: number
  currency: string
  payoutRequestStatus: string
  payoutStatus: string
  approvedAt: string
  payoutCreatedAt: string
  earningIds: readonly string[]
  attachedAmount: number
  runtimeSurface?: string
  privilegedExecutionSurface?: string
  approvalMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  privilegedExecutionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type PayoutApprovalProvenanceValidationInput = Readonly<{
  payoutRequestId: string
  missingPayoutApprovalLineageDetected?: boolean
  payoutApprovalOrderingDriftDetected?: boolean
  replaySafePayoutReconstructionGapDetected?: boolean
  payoutParityDivergenceDetected?: boolean
  privilegedExecutionMismatchDetected?: boolean
  replayOwnedPayoutMutationDetected?: boolean
  reconciliationOwnedPayoutRepairDetected?: boolean
  payoutAuthorityContaminationDetected?: boolean
  privilegedExecutionReplacementDetected?: boolean
  payoutExecutionTransferDetected?: boolean
}>

export type PayoutApprovalProvenanceValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  payoutRuntimeAuthoritative: true
  privilegedExecutionRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  payoutExecutionTransferAllowed: false
  privilegedExecutionReplacementAllowed: false
  replayOwnedExecutionAllowed: false
  reconciliationRepairAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function positiveAmount(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

function createPayoutApprovalKeys(input: PayoutApprovalProvenanceInput) {
  const payoutRequest = stableKeyPart(input.payoutRequestId)
  const payout = stableKeyPart(input.payoutId)

  return {
    payoutApprovalKey: [
      "payout_approval",
      payoutRequest,
      payout,
      stableKeyPart(input.payoutRequestStatus),
    ].join(":"),
    payoutApprovalOrderingKey: [
      "payout_approval_ordering",
      payoutRequest,
      payout,
      10,
    ].join(":"),
    payoutApprovalReconstructionKey: [
      "payout_approval_reconstruction",
      payoutRequest,
      payout,
    ].join(":"),
    privilegedExecutionKey: [
      "payout_privileged_execution",
      "approve_payout_request_and_create_payout",
      payoutRequest,
      payout,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  payoutRequestObserved: boolean
  payoutObserved: boolean
  earningAttachmentObserved: boolean
  approvalTimestampObserved: boolean
  privilegedExecutionObserved: boolean
  amountMatches: boolean
}): string {
  if (
    input.payoutRequestObserved &&
    input.payoutObserved &&
    input.earningAttachmentObserved &&
    input.approvalTimestampObserved &&
    input.privilegedExecutionObserved &&
    input.amountMatches
  ) {
    return "payout_approval_runtime_complete"
  }

  if (
    input.payoutRequestObserved &&
    input.payoutObserved &&
    input.privilegedExecutionObserved
  ) {
    return "payout_approval_runtime_partial"
  }

  return "payout_approval_runtime_incomplete"
}

export async function synchronizePayoutApprovalProvenanceNoThrow(
  input: PayoutApprovalProvenanceInput
): Promise<void> {
  if (!isWave010PayoutApprovalProvenanceEnabled()) return

  try {
    const keys = createPayoutApprovalKeys(input)
    const runtimeSurface = input.runtimeSurface ?? "payout_request_service"
    const privilegedExecutionSurface =
      input.privilegedExecutionSurface ??
      "approve_payout_request_and_create_payout"
    const payoutRequestObserved = observed(input.payoutRequestId)
    const payoutObserved = observed(input.payoutId)
    const earningAttachmentObserved = input.earningIds.length > 0
    const approvalTimestampObserved = observed(input.approvedAt)
    const privilegedExecutionObserved =
      privilegedExecutionSurface === "approve_payout_request_and_create_payout"
    const amountMatches =
      positiveAmount(input.amount) && input.attachedAmount === input.amount
    const confidence = reconstructionConfidence({
      payoutRequestObserved,
      payoutObserved,
      earningAttachmentObserved,
      approvalTimestampObserved,
      privilegedExecutionObserved,
      amountMatches,
    })
    const orderingTimestamp =
      input.approvedAt || input.payoutCreatedAt || new Date().toISOString()

    await writeCanonicalPayoutApprovalProvenanceNoThrow({
      ...keys,
      payoutRequestId: input.payoutRequestId,
      payoutId: input.payoutId,
      creatorId: input.creatorId,
      amount: input.amount,
      currency: input.currency,
      payoutRequestStatus: input.payoutRequestStatus,
      payoutStatus: input.payoutStatus,
      approvedAt: input.approvedAt,
      runtimeSurface,
      privilegedExecutionSurface,
      approvalStatus: "observed",
      approvalSequence: 10,
      orderingTimestamp,
      orderingSource: "runtime_payout_approval",
      replayTimestampSource: "payout_requests.approved_at",
      orderingConfidence: confidence,
      reconstructionStatus: "observed",
      reconstructionConfidence: confidence,
      payoutRequestObserved,
      payoutObserved,
      earningAttachmentObserved,
      approvalTimestampObserved,
      privilegedExecutionObserved,
      lineage: [
        {
          payoutApprovalLineageKey: [
            "payout_approval_lineage",
            "payout_request_to_payout",
            stableKeyPart(input.payoutRequestId),
            stableKeyPart(input.payoutId),
          ].join(":"),
          lineageKind: "payout_request_approved_to_payout",
          sourceTable: "payout_requests",
          sourceRowId: input.payoutRequestId,
          targetTable: "payouts",
          targetRowId: input.payoutId,
          lineageMetadata: {
            payoutRequestServiceAuthoritative: true,
          },
        },
        ...input.earningIds.map((earningId) => ({
          payoutApprovalLineageKey: [
            "payout_approval_lineage",
            "earning_attached_to_payout",
            stableKeyPart(earningId),
            stableKeyPart(input.payoutId),
          ].join(":"),
          lineageKind: "earning_attached_to_payout",
          sourceTable: "earnings",
          sourceRowId: earningId,
          targetTable: "payouts",
          targetRowId: input.payoutId,
          earningId,
          lineageMetadata: {
            payoutApprovalRuntimeObserved: true,
          },
        })),
      ],
      approvalMetadata: {
        ...(input.approvalMetadata ?? {}),
        payoutApprovalRuntimeAuthorityPreserved: true,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        replaySafePayoutApprovalOrderingMeasurable: true,
        approvalSequence: 10,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        amountMatches,
        attachedAmount: input.attachedAmount,
        replayOwnedPayoutMutationAllowed: false,
        reconciliationOwnedPayoutRepairAllowed: false,
      },
      privilegedExecutionMetadata: {
        ...(input.privilegedExecutionMetadata ?? {}),
        securityDefinerPayoutApprovalAuthoritative: true,
        privilegedExecutionReplacementAllowed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface,
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payout.traceability.approval_provenance.failed_open",
      message: "Payout approval provenance failed open",
      error,
    })
  }
}

export function validatePayoutApprovalProvenanceReadiness(
  input: PayoutApprovalProvenanceValidationInput
): PayoutApprovalProvenanceValidation {
  const blockers = [
    input.missingPayoutApprovalLineageDetected
      ? "missing_payout_approval_lineage_detected"
      : null,
    input.payoutApprovalOrderingDriftDetected
      ? "payout_approval_ordering_drift_detected"
      : null,
    input.replaySafePayoutReconstructionGapDetected
      ? "replay_safe_payout_reconstruction_gap_detected"
      : null,
    input.payoutParityDivergenceDetected
      ? "payout_parity_divergence_detected"
      : null,
    input.privilegedExecutionMismatchDetected
      ? "privileged_execution_mismatch_detected"
      : null,
    input.replayOwnedPayoutMutationDetected
      ? "replay_owned_payout_mutation_detected"
      : null,
    input.reconciliationOwnedPayoutRepairDetected
      ? "reconciliation_owned_payout_repair_detected"
      : null,
    input.payoutAuthorityContaminationDetected
      ? "payout_authority_contamination_detected"
      : null,
    input.privilegedExecutionReplacementDetected
      ? "privileged_execution_replacement_detected"
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
    privilegedExecutionRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    payoutExecutionTransferAllowed: false,
    privilegedExecutionReplacementAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
