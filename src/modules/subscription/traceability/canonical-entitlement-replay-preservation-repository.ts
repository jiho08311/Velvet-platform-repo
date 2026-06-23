import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalEntitlementReplayPreservationInsert = Readonly<{
  entitlementReplayKey: string
  entitlementReplayOrderingKey: string
  entitlementReplayProvenanceKey: string
  entitlementReplayReconstructionMetadataKey: string
  legacyEntitlementReplayKey?: string | null
  replayRunId?: string | null
  reconciliationRunId?: string | null
  rollbackValidationId?: string | null
  entitlementBoundaryKey: string
  replayBoundaryKey: string
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
  entitlementGapClass: string
  entitlementGapSeverity: string
  lineageCompletenessScore: number
  reconstructionCompletenessScore: number
  reconstructionConfidence: string
  entitlementObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  replaySafeReconstructable: boolean
  entitlementPayload?: JsonRecord
  entitlementMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  entitlementSnapshot?: JsonRecord
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

export async function writeCanonicalEntitlementReplayPreservation(
  input: CanonicalEntitlementReplayPreservationInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-064",
    aggregateRoot: "canonical_entitlement_replay.id",
    aggregateOwner: "entitlement_replay_preservation",
    entitlementRuntimeAuthoritative: true,
    subscriptionRuntimeAuthoritative: true,
    replayRuntimeAuthoritative: true,
    governanceRuntimeAuthoritative: true,
    canonicalEntitlementAuthoritative: false,
    replayEntitlementMutationAllowed: false,
    governanceEntitlementAuthorityAllowed: false,
    projectionEntitlementExecutionAllowed: false,
    entitlementRuntimeReplacementAllowed: false,
    authorityTransferAllowed: false,
    servingAuthoritative: false,
    synchronizedCandidateOnly: true,
    advisoryOnly: true,
    replayReadOnly: true,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_replays").upsert(
      {
        entitlement_replay_key: input.entitlementReplayKey,
        legacy_entitlement_replay_key: input.legacyEntitlementReplayKey ?? null,
        replay_run_id: input.replayRunId ?? null,
        reconciliation_run_id: input.reconciliationRunId ?? null,
        rollback_validation_id: input.rollbackValidationId ?? null,
        entitlement_boundary_key: input.entitlementBoundaryKey,
        replay_boundary_key: input.replayBoundaryKey,
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
        entitlement_gap_class: input.entitlementGapClass,
        entitlement_gap_severity: input.entitlementGapSeverity,
        lineage_completeness_score: input.lineageCompletenessScore,
        reconstruction_confidence: input.reconstructionConfidence,
        entitlement_payload: input.entitlementPayload ?? {},
        entitlement_metadata: input.entitlementMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_replay_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_replay_ordering").upsert(
      {
        entitlement_replay_ordering_key: input.entitlementReplayOrderingKey,
        entitlement_replay_key: input.entitlementReplayKey,
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
      { onConflict: "entitlement_replay_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_replay_provenance").upsert(
      {
        entitlement_replay_provenance_key: input.entitlementReplayProvenanceKey,
        entitlement_replay_key: input.entitlementReplayKey,
        entitlement_replay_ordering_key: input.entitlementReplayOrderingKey,
        replay_run_id: input.replayRunId ?? null,
        reconciliation_run_id: input.reconciliationRunId ?? null,
        rollback_validation_id: input.rollbackValidationId ?? null,
        entitlement_advisory_only: true,
        entitlement_non_serving: true,
        replay_read_only: true,
        entitlement_runtime_authority_preserved: true,
        replay_entitlement_mutation_prevented: true,
        governance_entitlement_authority_prevented: true,
        entitlement_snapshot: input.entitlementSnapshot ?? {},
        provenance_snapshot: input.provenanceSnapshot ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_replay_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin
      .from("canonical_entitlement_replay_reconstruction_metadata")
      .upsert(
        {
          entitlement_replay_reconstruction_metadata_key:
            input.entitlementReplayReconstructionMetadataKey,
          entitlement_replay_key: input.entitlementReplayKey,
          entitlement_replay_ordering_key: input.entitlementReplayOrderingKey,
          entitlement_replay_provenance_key:
            input.entitlementReplayProvenanceKey,
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
        { onConflict: "entitlement_replay_reconstruction_metadata_key" }
      )
  )
}

export async function writeCanonicalEntitlementReplayPreservationNoThrow(
  input: CanonicalEntitlementReplayPreservationInsert
): Promise<void> {
  try {
    await writeCanonicalEntitlementReplayPreservation(input)
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.canonical_entitlement_replay_preservation_write_failed",
      error,
    })
  }
}
