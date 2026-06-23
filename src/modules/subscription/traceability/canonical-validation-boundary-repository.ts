import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalValidationBoundaryInsert = Readonly<{
  validationEventKey: string
  validationLineageKey: string
  validationOrderingKey: string
  validationProvenanceKey: string
  validationReconstructionKey: string
  legacyValidationKey?: string | null
  subjectUserId?: string | null
  creatorId?: string | null
  subscriptionId?: string | null
  sourceTable?: string | null
  sourceRowId?: string | null
  validationResult: string
  accessGranted: boolean
  validationDriftClass: string
  validationDriftSeverity: string
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  lineageCompletenessScore: number
  reconstructionCompletenessScore: number
  reconstructionConfidence: string
  eventObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  replaySafeReconstructable: boolean
  eventMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  runtimeValidationSnapshot?: JsonRecord
  entitlementSnapshot?: JsonRecord
  provenanceSnapshot?: JsonRecord
  governanceSnapshot?: JsonRecord
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

export async function writeCanonicalValidationBoundary(
  input: CanonicalValidationBoundaryInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-031",
    aggregateRoot: "canonical_validation_event.id",
    aggregateOwner: "subscription_validation",
    runtimeAuthoritative: true,
    validationRuntimeAuthoritative: true,
    entitlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    replayAuthoritative: false,
    reconciliationAuthoritative: false,
    projectionAuthoritative: false,
    servingAuthoritative: false,
    synchronizedCandidateOnly: true,
    advisoryOnly: true,
    replayOwnedValidationMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    validationMutationAllowed: false,
    validationAuthorityTransferAllowed: false,
    projectionEntitlementAuthorityAllowed: false,
    runtimeValidationReplacementAllowed: false,
    reconciliationRepairAllowed: false,
    runtimeAuthorityTransferAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_validation_event").upsert(
      {
        validation_event_key: input.validationEventKey,
        legacy_validation_key: input.legacyValidationKey ?? null,
        aggregate_owner: "subscription_validation",
        validation_surface: "subscription.validation.boundary",
        runtime_surface: "subscription_validation_runtime",
        event_source: "runtime_validation_observation",
        event_status: input.eventObserved ? "observed" : "skipped",
        subject_user_id: input.subjectUserId ?? null,
        creator_id: input.creatorId ?? null,
        subscription_id: input.subscriptionId ?? null,
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        validation_result: input.validationResult,
        access_granted: input.accessGranted,
        validation_drift_class: input.validationDriftClass,
        validation_drift_severity: input.validationDriftSeverity,
        ordering_timestamp: input.orderingTimestamp,
        lineage_completeness_score: input.lineageCompletenessScore,
        reconstruction_confidence: input.reconstructionConfidence,
        event_metadata: input.eventMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "validation_event_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_validation_lineage").upsert(
      {
        validation_lineage_key: input.validationLineageKey,
        validation_event_key: input.validationEventKey,
        legacy_validation_key: input.legacyValidationKey ?? null,
        aggregate_owner: "subscription_validation",
        validation_surface: "subscription.validation.lineage",
        runtime_surface: "subscription_validation_runtime",
        lineage_source: "runtime_validation_observation",
        lineage_status: input.lineageObserved ? "observed" : "skipped",
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        target_table: "canonical_validation_event",
        target_row_id: null,
        runtime_validation_snapshot: input.runtimeValidationSnapshot ?? {},
        entitlement_snapshot: input.entitlementSnapshot ?? {},
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "validation_lineage_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_validation_ordering").upsert(
      {
        validation_ordering_key: input.validationOrderingKey,
        validation_event_key: input.validationEventKey,
        validation_lineage_key: input.validationLineageKey,
        aggregate_owner: "subscription_validation",
        validation_surface: "subscription.validation.ordering",
        ordering_surface: "subscription.validation.replay_safe_ordering",
        lifecycle_sequence: 10,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.reconstructionConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "validation_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_validation_provenance").upsert(
      {
        validation_provenance_key: input.validationProvenanceKey,
        validation_event_key: input.validationEventKey,
        validation_lineage_key: input.validationLineageKey,
        validation_ordering_key: input.validationOrderingKey,
        aggregate_owner: "subscription_validation",
        provenance_surface: "subscription.validation.provenance",
        provenance_source: "subscription_validation_runtime",
        provenance_status: input.provenanceObserved ? "observed" : "skipped",
        isolation_boundary_state: "isolated",
        runtime_authority_preserved: true,
        validation_runtime_preserved: true,
        entitlement_runtime_preserved: true,
        replay_read_only: true,
        validation_mutation_authority_absent: true,
        projection_entitlement_authority_absent: true,
        provenance_snapshot: input.provenanceSnapshot ?? {},
        governance_snapshot: input.governanceSnapshot ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "validation_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin
      .from("canonical_validation_reconstruction_metadata")
      .upsert(
        {
          validation_reconstruction_key: input.validationReconstructionKey,
          validation_event_key: input.validationEventKey,
          validation_lineage_key: input.validationLineageKey,
          validation_ordering_key: input.validationOrderingKey,
          validation_provenance_key: input.validationProvenanceKey,
          aggregate_owner: "subscription_validation",
          reconstruction_surface: "subscription.validation.reconstruction",
          reconstruction_status: "observed",
          reconstruction_confidence: input.reconstructionConfidence,
          event_observed: input.eventObserved,
          lineage_observed: input.lineageObserved,
          ordering_observed: input.orderingObserved,
          provenance_observed: input.provenanceObserved,
          replay_safe_reconstructable: input.replaySafeReconstructable,
          reconstruction_completeness_score:
            input.reconstructionCompletenessScore,
          reconstruction_metadata: input.reconstructionMetadata ?? {},
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "validation_reconstruction_key" }
      )
  )
}

export async function writeCanonicalValidationBoundaryNoThrow(
  input: CanonicalValidationBoundaryInsert
): Promise<void> {
  try {
    await writeCanonicalValidationBoundary(input)
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.canonical_validation_boundary_write_failed",
      error,
    })
  }
}
