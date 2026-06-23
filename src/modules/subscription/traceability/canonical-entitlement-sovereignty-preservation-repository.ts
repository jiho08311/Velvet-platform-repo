import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalEntitlementSovereigntyPreservationInsert = Readonly<{
  entitlementSovereigntyPreservationKey: string
  entitlementSovereigntyPreservationOrderingKey: string
  entitlementSovereigntyPreservationProvenanceKey: string
  entitlementSovereigntyPreservationReconstructionMetadataKey: string
  legacyEntitlementKey?: string | null
  replayRunId?: string | null
  reconciliationRunId?: string | null
  rollbackValidationId?: string | null
  entitlementBoundaryKey: string
  sovereigntyBoundaryKey: string
  governanceBoundaryKey?: string | null
  rollbackBoundaryKey?: string | null
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
  sovereigntyState: string
  sovereigntyGapClass: string
  sovereigntyGapSeverity: string
  lineageCompletenessScore: number
  reconstructionCompletenessScore: number
  reconstructionConfidence: string
  entitlementObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  replaySafeReconstructable: boolean
  preservationPayload?: JsonRecord
  preservationMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  sovereigntyPreservationSnapshot?: JsonRecord
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

export async function writeCanonicalEntitlementSovereigntyPreservation(
  input: CanonicalEntitlementSovereigntyPreservationInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-076",
    aggregateRoot: "canonical_entitlement_sovereignty_preservation.id",
    aggregateOwner: "entitlement_sovereignty_preservation",
    entitlementRuntimeAuthoritative: true,
    subscriptionRuntimeAuthoritative: true,
    governanceRuntimeAuthoritative: true,
    rollbackRuntimeAuthoritative: true,
    canonicalEntitlementAuthoritative: false,
    governanceEntitlementExecutionAllowed: false,
    replayEntitlementMutationAllowed: false,
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
    supabaseAdmin.from("canonical_entitlement_sovereignty_preservations").upsert(
      {
        entitlement_sovereignty_preservation_key:
          input.entitlementSovereigntyPreservationKey,
        legacy_entitlement_key: input.legacyEntitlementKey ?? null,
        replay_run_id: input.replayRunId ?? null,
        reconciliation_run_id: input.reconciliationRunId ?? null,
        rollback_validation_id: input.rollbackValidationId ?? null,
        entitlement_boundary_key: input.entitlementBoundaryKey,
        sovereignty_boundary_key: input.sovereigntyBoundaryKey,
        governance_boundary_key: input.governanceBoundaryKey ?? null,
        rollback_boundary_key: input.rollbackBoundaryKey ?? null,
        entitlement_subject_user_id: input.entitlementSubjectUserId ?? null,
        entitlement_issuer_creator_id: input.entitlementIssuerCreatorId ?? null,
        related_subscription_id: input.relatedSubscriptionId ?? null,
        related_payment_id: input.relatedPaymentId ?? null,
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        entitlement_sequence: input.entitlementSequence,
        ordering_timestamp: input.orderingTimestamp,
        sovereignty_state: input.sovereigntyState,
        sovereignty_gap_class: input.sovereigntyGapClass,
        sovereignty_gap_severity: input.sovereigntyGapSeverity,
        lineage_completeness_score: input.lineageCompletenessScore,
        reconstruction_confidence: input.reconstructionConfidence,
        preservation_payload: input.preservationPayload ?? {},
        preservation_metadata: input.preservationMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_sovereignty_preservation_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin
      .from("canonical_entitlement_sovereignty_preservation_ordering")
      .upsert(
        {
          entitlement_sovereignty_preservation_ordering_key:
            input.entitlementSovereigntyPreservationOrderingKey,
          entitlement_sovereignty_preservation_key:
            input.entitlementSovereigntyPreservationKey,
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
        { onConflict: "entitlement_sovereignty_preservation_ordering_key" }
      )
  )

  await assertNoSupabaseError(
    supabaseAdmin
      .from("canonical_entitlement_sovereignty_preservation_provenance")
      .upsert(
        {
          entitlement_sovereignty_preservation_provenance_key:
            input.entitlementSovereigntyPreservationProvenanceKey,
          entitlement_sovereignty_preservation_key:
            input.entitlementSovereigntyPreservationKey,
          entitlement_sovereignty_preservation_ordering_key:
            input.entitlementSovereigntyPreservationOrderingKey,
          replay_run_id: input.replayRunId ?? null,
          reconciliation_run_id: input.reconciliationRunId ?? null,
          rollback_validation_id: input.rollbackValidationId ?? null,
          entitlement_advisory_only: true,
          entitlement_non_serving: true,
          replay_read_only: true,
          entitlement_runtime_authority_preserved: true,
          sovereignty_preservation_snapshot:
            input.sovereigntyPreservationSnapshot ?? {},
          provenance_snapshot: input.provenanceSnapshot ?? {},
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "entitlement_sovereignty_preservation_provenance_key" }
      )
  )

  await assertNoSupabaseError(
    supabaseAdmin
      .from(
        "canonical_entitlement_sovereignty_preservation_reconstruction_metadata"
      )
      .upsert(
        {
          entitlement_sovereignty_preservation_reconstruction_metadata_key:
            input.entitlementSovereigntyPreservationReconstructionMetadataKey,
          entitlement_sovereignty_preservation_key:
            input.entitlementSovereigntyPreservationKey,
          entitlement_sovereignty_preservation_ordering_key:
            input.entitlementSovereigntyPreservationOrderingKey,
          entitlement_sovereignty_preservation_provenance_key:
            input.entitlementSovereigntyPreservationProvenanceKey,
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
        {
          onConflict:
            "entitlement_sovereignty_preservation_reconstruction_metadata_key",
        }
      )
  )
}

export async function writeCanonicalEntitlementSovereigntyPreservationNoThrow(
  input: CanonicalEntitlementSovereigntyPreservationInsert
): Promise<void> {
  try {
    await writeCanonicalEntitlementSovereigntyPreservation(input)
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.canonical_entitlement_sovereignty_preservation_write_failed",
      error,
    })
  }
}
