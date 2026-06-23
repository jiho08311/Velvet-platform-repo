import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalEntitlementDriftArbitrationInsert = Readonly<{
  entitlementDriftKey: string
  entitlementDriftOrderingKey: string
  entitlementDriftProvenanceKey: string
  entitlementDriftReconstructionMetadataKey: string
  replayRunId?: string | null
  reconciliationRunId?: string | null
  rollbackValidationId?: string | null
  entitlementBoundaryKey: string
  driftBoundaryKey: string
  reconciliationBoundaryKey?: string | null
  governanceBoundaryKey?: string | null
  entitlementSubjectUserId?: string | null
  entitlementIssuerCreatorId?: string | null
  relatedSubscriptionId?: string | null
  relatedPaymentId?: string | null
  sourceTable?: string | null
  sourceRowId?: string | null
  entitlementSequence: number
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  entitlementContinuityState: string
  entitlementDriftClass: string
  entitlementDriftSeverity: string
  lineageCompletenessScore: number
  reconstructionCompletenessScore: number
  reconstructionConfidence: string
  entitlementObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  replaySafeReconstructable: boolean
  driftPayload?: JsonRecord
  driftMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  driftSnapshot?: JsonRecord
  provenanceSnapshot?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

async function assertNoSupabaseError(
  operation: PromiseLike<{ error: unknown }>
): Promise<void> {
  const { error } = await operation

  if (error) throw error
}

export async function writeCanonicalEntitlementDriftArbitration(
  input: CanonicalEntitlementDriftArbitrationInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-079",
    aggregateRoot: "canonical_entitlement_drift.id",
    aggregateOwner: "entitlement_drift_arbitration",
    entitlementRuntimeAuthoritative: true,
    reconciliationRuntimeAuthoritative: true,
    governanceRuntimeAuthoritative: true,
    rollbackRuntimeAuthoritative: true,
    canonicalEntitlementAuthoritative: false,
    governanceEntitlementMutationAllowed: false,
    replayEntitlementExecutionAllowed: false,
    projectionEntitlementExecutionAllowed: false,
    entitlementRuntimeReplacementAllowed: false,
    authorityTransferAllowed: false,
    reconciliationRepairAllowed: false,
    servingAuthoritative: false,
    replayReadOnly: true,
    synchronizedCandidateOnly: true,
    advisoryOnly: true,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_drifts").upsert(
      {
        entitlement_drift_key: input.entitlementDriftKey,
        replay_run_id: input.replayRunId ?? null,
        reconciliation_run_id: input.reconciliationRunId ?? null,
        rollback_validation_id: input.rollbackValidationId ?? null,
        entitlement_boundary_key: input.entitlementBoundaryKey,
        drift_boundary_key: input.driftBoundaryKey,
        reconciliation_boundary_key: input.reconciliationBoundaryKey ?? null,
        governance_boundary_key: input.governanceBoundaryKey ?? null,
        entitlement_subject_user_id: input.entitlementSubjectUserId ?? null,
        entitlement_issuer_creator_id: input.entitlementIssuerCreatorId ?? null,
        related_subscription_id: input.relatedSubscriptionId ?? null,
        related_payment_id: input.relatedPaymentId ?? null,
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        entitlement_sequence: input.entitlementSequence,
        ordering_timestamp: input.orderingTimestamp,
        entitlement_continuity_state: input.entitlementContinuityState,
        entitlement_drift_class: input.entitlementDriftClass,
        entitlement_drift_severity: input.entitlementDriftSeverity,
        lineage_completeness_score: input.lineageCompletenessScore,
        reconstruction_confidence: input.reconstructionConfidence,
        drift_payload: input.driftPayload ?? {},
        drift_metadata: input.driftMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_drift_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_drift_ordering").upsert(
      {
        entitlement_drift_ordering_key: input.entitlementDriftOrderingKey,
        entitlement_drift_key: input.entitlementDriftKey,
        replay_run_id: input.replayRunId ?? null,
        reconciliation_run_id: input.reconciliationRunId ?? null,
        rollback_validation_id: input.rollbackValidationId ?? null,
        entitlement_sequence: input.entitlementSequence,
        lifecycle_sequence: 10,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.reconstructionConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_drift_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_drift_provenance").upsert(
      {
        entitlement_drift_provenance_key: input.entitlementDriftProvenanceKey,
        entitlement_drift_key: input.entitlementDriftKey,
        entitlement_drift_ordering_key: input.entitlementDriftOrderingKey,
        replay_run_id: input.replayRunId ?? null,
        reconciliation_run_id: input.reconciliationRunId ?? null,
        rollback_validation_id: input.rollbackValidationId ?? null,
        entitlement_advisory_only: true,
        entitlement_non_serving: true,
        replay_read_only: true,
        entitlement_runtime_authority_preserved: true,
        reconciliation_advisory_only: true,
        drift_snapshot: input.driftSnapshot ?? {},
        provenance_snapshot: input.provenanceSnapshot ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_drift_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin
      .from("canonical_entitlement_drift_reconstruction_metadata")
      .upsert(
        {
          entitlement_drift_reconstruction_metadata_key:
            input.entitlementDriftReconstructionMetadataKey,
          entitlement_drift_key: input.entitlementDriftKey,
          entitlement_drift_ordering_key: input.entitlementDriftOrderingKey,
          entitlement_drift_provenance_key: input.entitlementDriftProvenanceKey,
          replay_run_id: input.replayRunId ?? null,
          reconciliation_run_id: input.reconciliationRunId ?? null,
          rollback_validation_id: input.rollbackValidationId ?? null,
          reconstruction_confidence: input.reconstructionConfidence,
          entitlement_observed: input.entitlementObserved,
          lineage_observed: input.lineageObserved,
          ordering_observed: input.orderingObserved,
          provenance_observed: input.provenanceObserved,
          replay_safe_reconstructable: input.replaySafeReconstructable,
          reconstruction_completeness_score:
            input.reconstructionCompletenessScore,
          reconstruction_metadata: input.reconstructionMetadata ?? {},
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "entitlement_drift_reconstruction_metadata_key" }
      )
  )
}

export async function writeCanonicalEntitlementDriftArbitrationNoThrow(
  input: CanonicalEntitlementDriftArbitrationInsert
): Promise<void> {
  try {
    await writeCanonicalEntitlementDriftArbitration(input)
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.canonical_entitlement_drift_arbitration_write_failed",
      error,
    })
  }
}
