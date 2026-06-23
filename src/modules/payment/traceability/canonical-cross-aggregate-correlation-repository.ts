import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalCrossAggregateCorrelationInsert = Readonly<{
  aggregateCorrelationKey: string
  crossAggregateCorrelationKey: string
  aggregateOrderingKey: string
  aggregateProvenanceKey: string
  aggregateReconstructionKey: string
  legacyCorrelationKey?: string | null
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
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  lineageCompletenessScore: number
  reconstructionCompletenessScore: number
  reconstructionConfidence: string
  correlationObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  replaySafeReconstructable: boolean
  correlationMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  runtimeAggregateSnapshot?: JsonRecord
  correlationSnapshot?: JsonRecord
  provenanceSnapshot?: JsonRecord
  aggregateSnapshot?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

async function assertNoSupabaseError(
  operation: PromiseLike<{ error: unknown }>
): Promise<void> {
  const { error } = await operation

  if (error) throw error
}

export async function writeCanonicalCrossAggregateCorrelation(
  input: CanonicalCrossAggregateCorrelationInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-034",
    aggregateRoot: "canonical_aggregate_correlation.id",
    aggregateOwner: "financial_correlation",
    runtimeAuthoritative: true,
    paymentRuntimeAuthoritative: true,
    settlementRuntimeAuthoritative: true,
    payoutRuntimeAuthoritative: true,
    entitlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    governanceAuthoritative: false,
    replayAuthoritative: false,
    reconciliationAuthoritative: false,
    projectionAuthoritative: false,
    servingAuthoritative: false,
    synchronizedCandidateOnly: true,
    advisoryOnly: true,
    replayOwnedAggregateMutationAllowed: false,
    governanceAggregateAuthorityAllowed: false,
    projectionSettlementAuthorityAllowed: false,
    runtimeAggregateReplacementAllowed: false,
    runtimeAuthorityTransferAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_aggregate_correlation").upsert(
      {
        aggregate_correlation_key: input.aggregateCorrelationKey,
        legacy_correlation_key: input.legacyCorrelationKey ?? null,
        aggregate_owner: "financial_correlation",
        aggregate_root: "canonical_aggregate_correlation.id",
        correlation_surface: "financial.cross_aggregate.correlation",
        runtime_surface: "legacy_financial_runtime",
        correlation_source: "cross_aggregate_correlation_observation",
        correlation_status: input.correlationObserved ? "observed" : "skipped",
        source_aggregate: input.sourceAggregate,
        target_aggregate: input.targetAggregate,
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        target_table: input.targetTable ?? null,
        target_row_id: input.targetRowId ?? null,
        payment_id: input.paymentId ?? null,
        subscription_id: input.subscriptionId ?? null,
        entitlement_subject_user_id: input.entitlementSubjectUserId ?? null,
        entitlement_creator_id: input.entitlementCreatorId ?? null,
        earning_id: input.earningId ?? null,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        correlation_state: "observed",
        correlation_drift_class: "none",
        correlation_drift_severity: "none",
        ordering_timestamp: input.orderingTimestamp,
        lineage_completeness_score: input.lineageCompletenessScore,
        reconstruction_confidence: input.reconstructionConfidence,
        correlation_metadata: input.correlationMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "aggregate_correlation_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_cross_aggregate_correlations").upsert(
      {
        cross_aggregate_correlation_key: input.crossAggregateCorrelationKey,
        aggregate_correlation_key: input.aggregateCorrelationKey,
        legacy_correlation_key: input.legacyCorrelationKey ?? null,
        aggregate_owner: "financial_correlation",
        correlation_surface: "financial.cross_aggregate.lineage",
        runtime_surface: "legacy_financial_runtime",
        lineage_source: "cross_aggregate_correlation_observation",
        lineage_status: input.lineageObserved ? "observed" : "skipped",
        source_aggregate: input.sourceAggregate,
        target_aggregate: input.targetAggregate,
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        target_table: input.targetTable ?? null,
        target_row_id: input.targetRowId ?? null,
        payment_id: input.paymentId ?? null,
        subscription_id: input.subscriptionId ?? null,
        entitlement_subject_user_id: input.entitlementSubjectUserId ?? null,
        entitlement_creator_id: input.entitlementCreatorId ?? null,
        earning_id: input.earningId ?? null,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        runtime_aggregate_snapshot: input.runtimeAggregateSnapshot ?? {},
        correlation_snapshot: input.correlationSnapshot ?? {},
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "cross_aggregate_correlation_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_aggregate_ordering").upsert(
      {
        aggregate_ordering_key: input.aggregateOrderingKey,
        aggregate_correlation_key: input.aggregateCorrelationKey,
        cross_aggregate_correlation_key: input.crossAggregateCorrelationKey,
        aggregate_owner: "financial_correlation",
        correlation_surface: "financial.cross_aggregate.ordering",
        ordering_surface: "financial.cross_aggregate.replay_safe_ordering",
        lifecycle_sequence: 10,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.reconstructionConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "aggregate_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_aggregate_provenance").upsert(
      {
        aggregate_provenance_key: input.aggregateProvenanceKey,
        aggregate_correlation_key: input.aggregateCorrelationKey,
        cross_aggregate_correlation_key: input.crossAggregateCorrelationKey,
        aggregate_ordering_key: input.aggregateOrderingKey,
        aggregate_owner: "financial_correlation",
        provenance_surface: "financial.cross_aggregate.provenance",
        provenance_source: "cross_aggregate_advisory_runtime",
        provenance_status: input.provenanceObserved ? "observed" : "skipped",
        isolation_boundary_state: "isolated",
        runtime_aggregate_authority_preserved: true,
        replay_aggregate_mutation_absent: true,
        governance_aggregate_authority_absent: true,
        projection_settlement_authority_absent: true,
        provenance_snapshot: input.provenanceSnapshot ?? {},
        aggregate_snapshot: input.aggregateSnapshot ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "aggregate_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_aggregate_reconstruction_metadata").upsert(
      {
        aggregate_reconstruction_key: input.aggregateReconstructionKey,
        aggregate_correlation_key: input.aggregateCorrelationKey,
        cross_aggregate_correlation_key: input.crossAggregateCorrelationKey,
        aggregate_ordering_key: input.aggregateOrderingKey,
        aggregate_provenance_key: input.aggregateProvenanceKey,
        aggregate_owner: "financial_correlation",
        reconstruction_surface: "financial.cross_aggregate.reconstruction",
        reconstruction_status: "observed",
        reconstruction_confidence: input.reconstructionConfidence,
        correlation_observed: input.correlationObserved,
        lineage_observed: input.lineageObserved,
        ordering_observed: input.orderingObserved,
        provenance_observed: input.provenanceObserved,
        replay_safe_reconstructable: input.replaySafeReconstructable,
        reconstruction_completeness_score:
          input.reconstructionCompletenessScore,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "aggregate_reconstruction_key" }
    )
  )
}

export async function writeCanonicalCrossAggregateCorrelationNoThrow(
  input: CanonicalCrossAggregateCorrelationInsert
): Promise<void> {
  try {
    await writeCanonicalCrossAggregateCorrelation(input)
  } catch (error) {
    logger.warn({
      event: "payment.traceability.canonical_cross_aggregate_correlation.write_failed",
      message: "Canonical cross-aggregate correlation write failed",
      error,
    })
  }
}
