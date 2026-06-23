import { writeCanonicalCrossAggregateCorrelationNoThrow } from "./canonical-cross-aggregate-correlation-repository"
import { isWave010CrossAggregateCorrelationEnabled } from "./feature-flags"
import { synchronizeFinancialCausalityGraphNoThrow } from "./financial-causality-graph-runtime"
import { synchronizeFinancialTimelineNoThrow } from "@/shared/observability/financial-timeline"
import { logger } from "@/shared/observability/structured-logger"

export {
  validateCrossAggregateCorrelationReadiness,
  type CrossAggregateCorrelationValidation,
  type CrossAggregateCorrelationValidationInput,
} from "./cross-aggregate-correlation-readiness-policy"

type JsonRecord = Record<string, unknown>

export type CrossAggregateCorrelationInput = Readonly<{
  sourceAggregate: string
  targetAggregate: string
  sourceTable?: string | null
  sourceRowId?: string | null
  targetTable?: string | null
  targetRowId?: string | null
  paymentId?: string | null
  subscriptionId?: string | null
  entitlementSubjectUserId?: string | null
  entitlementCreatorId?: string | null
  earningId?: string | null
  payoutRequestId?: string | null
  payoutId?: string | null
  orderingTimestamp?: string | null
  correlationMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function uuidOrNull(value: string | null | undefined): string | null {
  const candidate = value?.trim()

  if (!candidate) return null

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    candidate
  )
    ? candidate
    : null
}

function createCrossAggregateKeys(input: CrossAggregateCorrelationInput) {
  const sourceAggregate = stableKeyPart(input.sourceAggregate)
  const targetAggregate = stableKeyPart(input.targetAggregate)
  const sourceRow = stableKeyPart(input.sourceRowId)
  const targetRow = stableKeyPart(input.targetRowId)
  const payment = stableKeyPart(input.paymentId)
  const earning = stableKeyPart(input.earningId)
  const subscription = stableKeyPart(input.subscriptionId)
  const payout = stableKeyPart(input.payoutId ?? input.payoutRequestId)
  const keyParts = [
    sourceAggregate,
    targetAggregate,
    sourceRow,
    targetRow,
    payment,
    subscription,
    earning,
    payout,
  ]

  return {
    legacyCorrelationKey: ["financial_correlation", ...keyParts].join(":"),
    aggregateCorrelationKey: [
      "canonical_aggregate_correlation",
      ...keyParts,
    ].join(":"),
    crossAggregateCorrelationKey: [
      "canonical_cross_aggregate_correlation",
      ...keyParts,
    ].join(":"),
    aggregateOrderingKey: ["canonical_aggregate_ordering", ...keyParts].join(
      ":"
    ),
    aggregateProvenanceKey: [
      "canonical_aggregate_provenance",
      ...keyParts,
    ].join(":"),
    aggregateReconstructionKey: [
      "canonical_aggregate_reconstruction",
      ...keyParts,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  correlationObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
}): string {
  if (
    input.correlationObserved &&
    input.lineageObserved &&
    input.orderingObserved &&
    input.provenanceObserved
  ) {
    return "aggregate_reconstruction_complete"
  }

  if (input.correlationObserved && input.lineageObserved) {
    return "aggregate_reconstruction_partial"
  }

  return "aggregate_reconstruction_incomplete"
}

export async function synchronizeCrossAggregateCorrelationNoThrow(
  input: CrossAggregateCorrelationInput
): Promise<void> {
  if (!isWave010CrossAggregateCorrelationEnabled()) return

  try {
    const keys = createCrossAggregateKeys(input)
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const correlationObserved = Boolean(
      input.sourceAggregate && input.targetAggregate
    )
    const lineageObserved = Boolean(input.sourceRowId || input.targetRowId)
    const orderingObserved = Boolean(orderingTimestamp)
    const provenanceObserved = true
    const reconstructionCompletenessScore = clampScore(
      [
        correlationObserved,
        lineageObserved,
        orderingObserved,
        provenanceObserved,
      ].filter(Boolean).length / 4
    )
    const confidence = reconstructionConfidence({
      correlationObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
    })

    await writeCanonicalCrossAggregateCorrelationNoThrow({
      ...keys,
      sourceAggregate: input.sourceAggregate,
      targetAggregate: input.targetAggregate,
      sourceTable: input.sourceTable ?? null,
      sourceRowId: uuidOrNull(input.sourceRowId),
      targetTable: input.targetTable ?? null,
      targetRowId: uuidOrNull(input.targetRowId),
      paymentId: uuidOrNull(input.paymentId),
      subscriptionId: uuidOrNull(input.subscriptionId),
      entitlementSubjectUserId: uuidOrNull(input.entitlementSubjectUserId),
      entitlementCreatorId: uuidOrNull(input.entitlementCreatorId),
      earningId: uuidOrNull(input.earningId),
      payoutRequestId: uuidOrNull(input.payoutRequestId),
      payoutId: uuidOrNull(input.payoutId),
      orderingTimestamp,
      orderingSource: "cross_aggregate_correlation_runtime.observed_at",
      replayTimestampSource: "legacy_financial_runtime_timestamp",
      lineageCompletenessScore: lineageObserved ? 1 : 0,
      reconstructionCompletenessScore,
      reconstructionConfidence: confidence,
      correlationObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
      replaySafeReconstructable:
        confidence !== "aggregate_reconstruction_incomplete",
      correlationMetadata: {
        ...(input.correlationMetadata ?? {}),
        crossAggregateCorrelationAdvisoryOnly: true,
      },
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        runtimeAggregateAuthorityPreserved: true,
      },
      orderingMetadata: {
        orderingTimestamp,
        replaySafeAggregateOrderingObservable: true,
      },
      runtimeAggregateSnapshot: {
        paymentRuntimeAuthoritative: true,
        settlementRuntimeAuthoritative: true,
        payoutRuntimeAuthoritative: true,
        entitlementRuntimeAuthoritative: true,
      },
      correlationSnapshot: {
        canonicalAuthoritative: false,
        servingAuthoritative: false,
      },
      provenanceSnapshot: {
        runtimeAggregateAuthorityPreserved: true,
        replayAggregateMutationAbsent: true,
        governanceAggregateAuthorityAbsent: true,
        projectionSettlementAuthorityAbsent: true,
      },
      aggregateSnapshot: {
        replayOwnedAggregateMutationAllowed: false,
        governanceAggregateAuthorityAllowed: false,
        projectionSettlementAuthorityAllowed: false,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        aggregateReconstructionMeasurable: true,
        crossDomainLineageMeasurable: true,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        advisoryOnly: true,
        synchronizedCandidateOnly: true,
      },
    })
    await synchronizeFinancialCausalityGraphNoThrow({
      sourceAggregate: input.sourceAggregate,
      targetAggregate: input.targetAggregate,
      sourceTable: input.sourceTable ?? null,
      sourceRowId: input.sourceRowId ?? null,
      targetTable: input.targetTable ?? null,
      targetRowId: input.targetRowId ?? null,
      paymentId: input.paymentId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      entitlementSubjectUserId: input.entitlementSubjectUserId ?? null,
      entitlementCreatorId: input.entitlementCreatorId ?? null,
      earningId: input.earningId ?? null,
      payoutRequestId: input.payoutRequestId ?? null,
      payoutId: input.payoutId ?? null,
      orderingTimestamp,
      causalityMetadata: {
        ...(input.correlationMetadata ?? {}),
        sourceBrief: "Wave-010-FEL-BR-046",
        crossAggregateCorrelationNonServing: true,
      },
    })
    await synchronizeFinancialTimelineNoThrow({
      timelineSurface: "financial.timeline.cross_aggregate",
      timelineKey: keys.aggregateCorrelationKey,
      runtimeSurface: "legacy_financial_runtime",
      sourceAggregate: input.sourceAggregate,
      targetAggregate: input.targetAggregate,
      sourceTable: input.sourceTable ?? null,
      sourceRowId: input.sourceRowId ?? null,
      paymentId: input.paymentId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      earningId: input.earningId ?? null,
      payoutRequestId: input.payoutRequestId ?? null,
      payoutId: input.payoutId ?? null,
      entitlementSubjectUserId: input.entitlementSubjectUserId ?? null,
      entitlementCreatorId: input.entitlementCreatorId ?? null,
      lifecycleStage: "cross_aggregate_correlation",
      lifecycleSequence: 40,
      orderingTimestamp,
      orderingSource: "cross_aggregate_correlation_runtime.observed_at",
      replayTimestampSource: "legacy_financial_runtime_timestamp",
      lineageObserved,
      timelineMetadata: {
        aggregateCorrelationKey: keys.aggregateCorrelationKey,
        crossAggregateCorrelationKey: keys.crossAggregateCorrelationKey,
      },
      reconstructionMetadata: {
        aggregateReconstructionConfidence: confidence,
      },
      provenanceMetadata: {
        sourceBrief: "Wave-010-FEL-BR-036",
        advisoryOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payment.traceability.cross_aggregate_correlation.failed_open",
      message: "Cross-aggregate correlation failed open",
      error,
    })
  }
}
