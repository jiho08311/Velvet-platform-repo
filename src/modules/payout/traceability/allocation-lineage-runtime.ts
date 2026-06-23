import type { EarningSourceType } from "@/modules/payout/types"

import { writeCanonicalAllocationLineageNoThrow } from "./canonical-allocation-lineage-repository"
import { isWave010SettlementAllocationLineageEnabled } from "./feature-flags"
import { logger } from "@/shared/observability/structured-logger"

export {
  validateSettlementAllocationLineageReadiness,
  type SettlementAllocationLineageValidation,
  type SettlementAllocationLineageValidationInput,
} from "./settlement-allocation-lineage-readiness-policy"

type JsonRecord = Record<string, unknown>

export type SettlementAllocationStage =
  | "earning_created"
  | "payout_request_locked"

export type SettlementAllocationLineageInput = Readonly<{
  allocationStage: SettlementAllocationStage
  creatorId: string
  paymentId?: string | null
  earningId?: string | null
  earningIds?: readonly string[]
  payoutRequestId?: string | null
  payoutId?: string | null
  sourceType?: EarningSourceType | null
  runtimeSurface?: string
  allocationSource?: string
  allocationStatus?: "observed" | "skipped" | "failed"
  orderingTimestamp?: string | null
  orderingSource?: string
  replayTimestampSource?: string
  requestedAmount?: number | null
  requestableAmount?: number | null
  currency?: string | null
  accountReadinessState?: "ready" | "missing" | null
  eligibilityState?: string
  eligibilityObserved?: boolean
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  eligibilityMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function observedNumber(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function allocationSubject(input: SettlementAllocationLineageInput): string {
  if (input.allocationStage === "payout_request_locked") {
    return stableKeyPart(input.payoutRequestId)
  }

  return stableKeyPart(input.earningId)
}

function createAllocationLineageKeys(input: SettlementAllocationLineageInput) {
  const payment = stableKeyPart(input.paymentId)
  const earning = stableKeyPart(input.earningId)
  const payoutRequest = stableKeyPart(input.payoutRequestId)
  const subject = allocationSubject(input)
  const sourceType = stableKeyPart(input.sourceType)
  const stage = stableKeyPart(input.allocationStage)

  return {
    settlementEventKey: [
      "settlement_event",
      payment,
      earning,
      sourceType,
    ].join(":"),
    earningLineageKey: [
      "earning_lineage",
      "payment_to_earning",
      payment,
      earning,
    ].join(":"),
    settlementOrderingKey: [
      "settlement_ordering",
      payment,
      earning,
      sourceType,
    ].join(":"),
    allocationLineageKey: [
      "allocation_lineage",
      stage,
      stableKeyPart(input.creatorId),
      subject,
    ].join(":"),
    allocationOrderingKey: [
      "allocation_ordering",
      stage,
      stableKeyPart(input.creatorId),
      subject,
    ].join(":"),
    payoutEligibilityKey: [
      "payout_eligibility",
      stage,
      stableKeyPart(input.creatorId),
      payoutRequest,
    ].join(":"),
    allocationReconstructionKey: [
      "allocation_reconstruction",
      stage,
      stableKeyPart(input.creatorId),
      subject,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  earningObserved: boolean
  allocationObserved: boolean
  orderingObserved: boolean
  payoutEligibilityObserved: boolean
}): string {
  if (
    input.earningObserved &&
    input.allocationObserved &&
    input.orderingObserved &&
    input.payoutEligibilityObserved
  ) {
    return "allocation_runtime_reconstructable_complete"
  }

  if (
    input.earningObserved &&
    input.allocationObserved &&
    input.orderingObserved
  ) {
    return "allocation_runtime_reconstructable_partial"
  }

  return "allocation_runtime_reconstructable_incomplete"
}

export async function synchronizeSettlementAllocationLineageNoThrow(
  input: SettlementAllocationLineageInput
): Promise<void> {
  if (!isWave010SettlementAllocationLineageEnabled()) return

  try {
    const keys = createAllocationLineageKeys(input)
    const runtimeSurface =
      input.runtimeSurface ?? "earning_allocation_runtime"
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const earningObserved =
      observed(input.earningId) ||
      Boolean(input.earningIds && input.earningIds.length > 0)
    const allocationObserved = input.allocationStatus !== "failed"
    const orderingObserved = observed(orderingTimestamp)
    const payoutEligibilityObserved =
      input.eligibilityObserved ??
      observed(input.eligibilityState) ??
      input.allocationStage === "earning_created"
    const confidence = reconstructionConfidence({
      earningObserved,
      allocationObserved,
      orderingObserved,
      payoutEligibilityObserved,
    })
    const replaySafeReconstructable =
      confidence !== "allocation_runtime_reconstructable_incomplete"

    await writeCanonicalAllocationLineageNoThrow({
      ...keys,
      allocationStage: input.allocationStage,
      paymentId: input.paymentId ?? null,
      earningId: input.earningId ?? null,
      creatorId: input.creatorId,
      payoutRequestId: input.payoutRequestId ?? null,
      payoutId: input.payoutId ?? null,
      sourceType: input.sourceType ?? null,
      runtimeSurface,
      allocationSource:
        input.allocationSource ??
        `${runtimeSurface}.${input.allocationStage}`,
      allocationStatus: input.allocationStatus ?? "observed",
      sourceTable: "earnings",
      sourceRowId: input.earningId ?? null,
      targetTable:
        input.allocationStage === "payout_request_locked"
          ? "payout_requests"
          : null,
      targetRowId: input.payoutRequestId ?? null,
      orderingTimestamp,
      orderingSource:
        input.orderingSource ??
        `${runtimeSurface}.${input.allocationStage}.observed_ordering`,
      replayTimestampSource:
        input.replayTimestampSource ??
        (input.allocationStage === "payout_request_locked"
          ? "payout_requests.created_at"
          : "earnings.created_at"),
      orderingConfidence: allocationObserved
        ? "observed_runtime_allocation"
        : "allocation_runtime_observation_failed",
      requestedAmount: input.requestedAmount ?? null,
      requestableAmount: input.requestableAmount ?? null,
      currency: input.currency ?? null,
      accountReadinessState: input.accountReadinessState ?? null,
      eligibilityState:
        input.eligibilityState ??
        (input.allocationStage === "earning_created"
          ? "earning_created_pending_eligibility"
          : "eligibility_observed"),
      eligibilityObserved: payoutEligibilityObserved,
      reconstructionStatus: input.allocationStatus ?? "observed",
      reconstructionConfidence: confidence,
      earningObserved,
      allocationObserved,
      orderingObserved,
      payoutEligibilityObserved,
      replaySafeReconstructable,
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        earningIds: input.earningIds ?? [],
        runtimeAllocationAuthorityPreserved: true,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        replayOwnedSettlementMutationAllowed: false,
        orderingTimestamp,
      },
      eligibilityMetadata: {
        ...(input.eligibilityMetadata ?? {}),
        observedRequestedAmount: observedNumber(input.requestedAmount),
        observedRequestableAmount: observedNumber(input.requestableAmount),
        payoutEligibilityReplacementAllowed: false,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        allocationLineageCompletenessMeasurable: true,
        replaySafeAllocationReconstructionMeasurable: true,
        projectionBalanceAuthorityAllowed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface,
        advisoryOnly: true,
        synchronizedCandidateOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payout.traceability.settlement_allocation_lineage.failed_open",
      message: "Settlement allocation lineage failed open",
      error,
    })
  }
}
