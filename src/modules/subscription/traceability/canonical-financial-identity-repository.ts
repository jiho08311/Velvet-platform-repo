import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalFinancialIdentityInsert = Readonly<{
  financialIdentityKey: string
  identityCorrelationKey: string
  identityOrderingKey: string
  ownershipProvenanceKey: string
  identityReconstructionKey: string
  legacyIdentityKey?: string | null
  userId?: string | null
  creatorId?: string | null
  ownerUserId?: string | null
  financialActorKey?: string | null
  actorKind: string
  ownershipSurface: string
  sourceTable?: string | null
  sourceRowId?: string | null
  targetTable?: string | null
  targetRowId?: string | null
  relatedSubscriptionId?: string | null
  relatedPaymentId?: string | null
  relatedEarningId?: string | null
  relatedPayoutRequestId?: string | null
  relatedPayoutId?: string | null
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  lineageCompletenessScore: number
  reconstructionCompletenessScore: number
  reconstructionConfidence: string
  identityObserved: boolean
  correlationObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  replaySafeReconstructable: boolean
  identityMetadata?: JsonRecord
  correlationMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  runtimeIdentitySnapshot?: JsonRecord
  ownershipSnapshot?: JsonRecord
  provenanceSnapshot?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

async function assertNoSupabaseError(
  operation: PromiseLike<{ error: unknown }>
): Promise<void> {
  const { error } = await operation

  if (error) {
    throw error
  }
}

export async function writeCanonicalFinancialIdentityCorrelation(
  input: CanonicalFinancialIdentityInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-033",
    aggregateRoot: "canonical_financial_identity.id",
    aggregateOwner: "financial_identity",
    runtimeAuthoritative: true,
    runtimeIdentityAuthoritative: true,
    financialOwnershipRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    governanceAuthoritative: false,
    replayAuthoritative: false,
    reconciliationAuthoritative: false,
    projectionAuthoritative: false,
    servingAuthoritative: false,
    synchronizedCandidateOnly: true,
    advisoryOnly: true,
    replayOwnedIdentityMutationAllowed: false,
    governanceIdentityAuthorityAllowed: false,
    projectionOwnershipAuthorityAllowed: false,
    runtimeIdentityReplacementAllowed: false,
    entitlementOwnershipReplacementAllowed: false,
    runtimeAuthorityTransferAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_financial_identity").upsert(
      {
        financial_identity_key: input.financialIdentityKey,
        legacy_identity_key: input.legacyIdentityKey ?? null,
        aggregate_owner: "financial_identity",
        aggregate_root: "canonical_financial_identity.id",
        identity_surface: "financial.identity.correlation",
        runtime_surface: "runtime_user_identity",
        identity_source: "financial_identity_correlation_observation",
        identity_status: input.identityObserved ? "observed" : "skipped",
        user_id: input.userId ?? null,
        creator_id: input.creatorId ?? null,
        financial_actor_key: input.financialActorKey ?? null,
        actor_kind: input.actorKind,
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        related_subscription_id: input.relatedSubscriptionId ?? null,
        related_payment_id: input.relatedPaymentId ?? null,
        related_earning_id: input.relatedEarningId ?? null,
        related_payout_request_id: input.relatedPayoutRequestId ?? null,
        related_payout_id: input.relatedPayoutId ?? null,
        identity_drift_class: "none",
        identity_drift_severity: "none",
        ordering_timestamp: input.orderingTimestamp,
        lineage_completeness_score: input.lineageCompletenessScore,
        reconstruction_confidence: input.reconstructionConfidence,
        identity_metadata: input.identityMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "financial_identity_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_financial_identity_correlations").upsert(
      {
        identity_correlation_key: input.identityCorrelationKey,
        financial_identity_key: input.financialIdentityKey,
        legacy_identity_key: input.legacyIdentityKey ?? null,
        aggregate_owner: "financial_identity",
        correlation_surface: "financial.identity.correlation.lineage",
        runtime_surface: "financial_ownership_runtime",
        correlation_source: "financial_identity_correlation_observation",
        correlation_status: input.correlationObserved ? "observed" : "skipped",
        user_id: input.userId ?? null,
        creator_id: input.creatorId ?? null,
        owner_user_id: input.ownerUserId ?? null,
        financial_actor_key: input.financialActorKey ?? null,
        ownership_surface: input.ownershipSurface,
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        target_table: input.targetTable ?? null,
        target_row_id: input.targetRowId ?? null,
        related_subscription_id: input.relatedSubscriptionId ?? null,
        related_payment_id: input.relatedPaymentId ?? null,
        related_earning_id: input.relatedEarningId ?? null,
        related_payout_request_id: input.relatedPayoutRequestId ?? null,
        related_payout_id: input.relatedPayoutId ?? null,
        runtime_identity_snapshot: input.runtimeIdentitySnapshot ?? {},
        ownership_snapshot: input.ownershipSnapshot ?? {},
        correlation_metadata: input.correlationMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "identity_correlation_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_financial_identity_ordering").upsert(
      {
        identity_ordering_key: input.identityOrderingKey,
        financial_identity_key: input.financialIdentityKey,
        identity_correlation_key: input.identityCorrelationKey,
        aggregate_owner: "financial_identity",
        identity_surface: "financial.identity.ordering",
        ordering_surface: "financial.identity.replay_safe_ordering",
        lifecycle_sequence: 10,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.reconstructionConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "identity_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_financial_ownership_provenance").upsert(
      {
        ownership_provenance_key: input.ownershipProvenanceKey,
        financial_identity_key: input.financialIdentityKey,
        identity_correlation_key: input.identityCorrelationKey,
        identity_ordering_key: input.identityOrderingKey,
        aggregate_owner: "financial_identity",
        provenance_surface: "financial.identity.ownership_provenance",
        provenance_source: "financial_identity_advisory_runtime",
        provenance_status: input.provenanceObserved ? "observed" : "skipped",
        isolation_boundary_state: "isolated",
        runtime_identity_preserved: true,
        financial_ownership_runtime_preserved: true,
        replay_identity_mutation_absent: true,
        governance_identity_authority_absent: true,
        projection_ownership_authority_absent: true,
        provenance_snapshot: input.provenanceSnapshot ?? {},
        ownership_snapshot: input.ownershipSnapshot ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "ownership_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin
      .from("canonical_financial_identity_reconstruction_metadata")
      .upsert(
        {
          identity_reconstruction_key: input.identityReconstructionKey,
          financial_identity_key: input.financialIdentityKey,
          identity_correlation_key: input.identityCorrelationKey,
          identity_ordering_key: input.identityOrderingKey,
          ownership_provenance_key: input.ownershipProvenanceKey,
          aggregate_owner: "financial_identity",
          reconstruction_surface: "financial.identity.reconstruction",
          reconstruction_status: "observed",
          reconstruction_confidence: input.reconstructionConfidence,
          identity_observed: input.identityObserved,
          correlation_observed: input.correlationObserved,
          ordering_observed: input.orderingObserved,
          provenance_observed: input.provenanceObserved,
          replay_safe_reconstructable: input.replaySafeReconstructable,
          reconstruction_completeness_score:
            input.reconstructionCompletenessScore,
          reconstruction_metadata: input.reconstructionMetadata ?? {},
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "identity_reconstruction_key" }
      )
  )
}

export async function writeCanonicalFinancialIdentityCorrelationNoThrow(
  input: CanonicalFinancialIdentityInsert
): Promise<void> {
  try {
    await writeCanonicalFinancialIdentityCorrelation(input)
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.canonical_financial_identity_correlation_write_failed",
      error,
    })
  }
}
