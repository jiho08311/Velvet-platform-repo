import type { EarningSourceType } from "@/modules/payout/types"

import { synchronizeFinancialTimelineNoThrow } from "@/shared/observability/financial-timeline"
import { writeCanonicalSettlementEventTopologyNoThrow } from "./canonical-settlement-event-topology-repository"
import { isWave010SettlementEventTopologyEnabled } from "./feature-flags"
import { logger } from "@/shared/observability/structured-logger"

export {
  validateSettlementEventTopologyReadiness,
  type SettlementEventTopologyValidation,
  type SettlementEventTopologyValidationInput,
} from "./settlement-event-topology-readiness-policy"

type JsonRecord = Record<string, unknown>

export type SettlementEventTopologyInput = Readonly<{
  paymentId: string
  earningId: string
  creatorId: string
  sourceType: EarningSourceType
  earningStatus: string
  grossAmount: number
  feeAmount: number
  netAmount: number
  availableAt?: string | null
  earningCreatedAt?: string | null
  runtimeSurface?: string
  orderingSource?: string
  replayTimestampSource?: string
  provenanceSource?: string
  provenanceStatus?: "observed" | "skipped" | "failed"
  orderingMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
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

function createSettlementEventTopologyKeys(input: SettlementEventTopologyInput) {
  const payment = stableKeyPart(input.paymentId)
  const earning = stableKeyPart(input.earningId)
  const sourceType = stableKeyPart(input.sourceType)

  return {
    paymentEventKey: `payment_event:${payment}:confirmed`,
    paymentFanoutEventKey: [
      "payment_fanout_event",
      payment,
      20,
      "settlement_earning_creation",
      "observed",
    ].join(":"),
    paymentSideEffectLineageKey: [
      "payment_side_effect_lineage",
      payment,
      "settlement_earning_creation",
      "observed",
    ].join(":"),
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
    settlementOrderingKey: [
      "settlement_ordering",
      payment,
      earning,
      sourceType,
    ].join(":"),
    settlementProvenanceKey: [
      "settlement_provenance",
      payment,
      earning,
      sourceType,
    ].join(":"),
    settlementReconstructionKey: [
      "settlement_reconstruction",
      payment,
      earning,
      sourceType,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  paymentObserved: boolean
  earningObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  amountObserved: boolean
  payoutEligibilityObserved: boolean
}): string {
  if (
    input.paymentObserved &&
    input.earningObserved &&
    input.orderingObserved &&
    input.provenanceObserved &&
    input.amountObserved &&
    input.payoutEligibilityObserved
  ) {
    return "settlement_runtime_reconstructable_complete"
  }

  if (
    input.paymentObserved &&
    input.earningObserved &&
    input.orderingObserved &&
    input.provenanceObserved
  ) {
    return "settlement_runtime_reconstructable_partial"
  }

  return "settlement_runtime_reconstructable_incomplete"
}

export async function synchronizeSettlementEventTopologyNoThrow(
  input: SettlementEventTopologyInput
): Promise<void> {
  if (!isWave010SettlementEventTopologyEnabled()) return

  try {
    const keys = createSettlementEventTopologyKeys(input)
    const runtimeSurface = input.runtimeSurface ?? "earning_creation_server"
    const orderingTimestamp =
      input.earningCreatedAt ?? input.availableAt ?? new Date().toISOString()
    const paymentObserved = observed(input.paymentId)
    const earningObserved = observed(input.earningId)
    const orderingObserved = observed(orderingTimestamp)
    const provenanceObserved = input.provenanceStatus !== "failed"
    const amountFieldsObserved =
      amountObserved(input.grossAmount) &&
      amountObserved(input.feeAmount) &&
      amountObserved(input.netAmount)
    const payoutEligibilityObserved =
      input.earningStatus === "pending" && input.availableAt != null
    const confidence = reconstructionConfidence({
      paymentObserved,
      earningObserved,
      orderingObserved,
      provenanceObserved,
      amountObserved: amountFieldsObserved,
      payoutEligibilityObserved,
    })

    await writeCanonicalSettlementEventTopologyNoThrow({
      ...keys,
      paymentId: input.paymentId,
      earningId: input.earningId,
      creatorId: input.creatorId,
      sourceType: input.sourceType,
      runtimeSurface,
      orderingTimestamp,
      orderingSource:
        input.orderingSource ?? "earning_creation_server.insert_earnings",
      replayTimestampSource:
        input.replayTimestampSource ?? "earnings.created_at",
      orderingConfidence: paymentObserved
        ? "observed_runtime_settlement"
        : "settlement_payment_reference_missing",
      provenanceSource: input.provenanceSource ?? "runtime_earning_creation",
      provenanceStatus: input.provenanceStatus ?? "observed",
      reconstructionStatus: input.provenanceStatus ?? "observed",
      reconstructionConfidence: confidence,
      paymentObserved,
      earningObserved,
      orderingObserved,
      provenanceObserved,
      amountObserved: amountFieldsObserved,
      payoutEligibilityObserved,
      replaySafeReconstructable: confidence !== "settlement_runtime_reconstructable_incomplete",
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        earningCreatedAt: input.earningCreatedAt ?? null,
        availableAt: input.availableAt ?? null,
        replayOwnedSettlementMutationAllowed: false,
      },
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        paymentToEarningRuntimeObserved: true,
        settlementEventKey: keys.settlementEventKey,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        earningStatus: input.earningStatus,
        immutableLedgerPromotionAllowed: false,
        payoutEligibilityReplacementAllowed: false,
        replayOwnedSettlementMutationAllowed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        runtimeSurface,
        advisoryOnly: true,
        synchronizedCandidateOnly: true,
      },
    })
    await synchronizeFinancialTimelineNoThrow({
      timelineSurface: "financial.timeline.settlement",
      timelineKey: keys.settlementEventKey,
      runtimeSurface,
      sourceAggregate: "settlement",
      targetAggregate: "payout_eligibility",
      sourceTable: "earnings",
      sourceRowId: input.earningId,
      paymentId: input.paymentId,
      earningId: input.earningId,
      lifecycleStage: "settlement_earning_created",
      lifecycleSequence: 20,
      orderingTimestamp,
      orderingSource:
        input.orderingSource ?? "earning_creation_server.insert_earnings",
      replayTimestampSource:
        input.replayTimestampSource ?? "earnings.created_at",
      lineageObserved: earningObserved,
      timelineMetadata: {
        settlementEventKey: keys.settlementEventKey,
        earningLineageKey: keys.earningLineageKey,
      },
      reconstructionMetadata: {
        settlementReconstructionConfidence: confidence,
      },
      provenanceMetadata: {
        sourceBrief: "Wave-010-FEL-BR-036",
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payout.traceability.settlement_event_topology.failed_open",
      message: "Settlement event topology failed open",
      error,
    })
  }
}
