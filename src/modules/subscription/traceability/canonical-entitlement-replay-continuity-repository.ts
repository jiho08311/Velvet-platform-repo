import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalEntitlementReplayContinuityInsert = Readonly<{
  entitlementReplayContinuityKey: string
  replayOrderingKey: string
  replayProvenanceKey: string
  replayReconstructionKey: string
  replayRunId?: string | null
  reconciliationRunId?: string | null
  rollbackValidationId?: string | null
  entitlementBoundaryKey: string
  replayBoundaryKey: string
  governanceBoundaryKey?: string | null
  rollbackBoundaryKey?: string | null
  subjectUserId?: string | null
  issuerCreatorId?: string | null
  subscriptionId?: string | null
  paymentId?: string | null
  sourceTable?: string | null
  sourceRowId?: string | null
  replaySequence: number
  orderingTimestamp: string
  replayContinuityState: string
  replayGapClass: string
  replayGapSeverity: string
  lineageCompletenessScore: number
  reconstructionCompletenessScore: number
  reconstructionConfidence: string
  replayObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  replaySafeReconstructable: boolean
  replayPayload?: JsonRecord
  replayMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  replaySnapshot?: JsonRecord
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

export async function writeCanonicalEntitlementReplayContinuity(
  input: CanonicalEntitlementReplayContinuityInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-082",
    aggregateRoot: "canonical_entitlement_replay_continuity.id",
    aggregateOwner: "entitlement_replay_continuity",
    entitlementRuntimeAuthoritative: true,
    canonicalReplayAuthoritative: false,
    replayAdvisoryOnly: true,
    replayReadOnly: true,
    replayEntitlementExecutionAllowed: false,
    governanceEntitlementAuthorityAllowed: false,
    projectionReplayExecutionAllowed: false,
    entitlementRuntimeReplacementAllowed: false,
    authorityTransferAllowed: false,
    synchronizedCandidateOnly: true,
    advisoryOnly: true,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_replay_continuities").upsert(
      {
        entitlement_replay_continuity_key:
          input.entitlementReplayContinuityKey,
        replay_run_id: input.replayRunId ?? null,
        reconciliation_run_id: input.reconciliationRunId ?? null,
        rollback_validation_id: input.rollbackValidationId ?? null,
        entitlement_boundary_key: input.entitlementBoundaryKey,
        replay_boundary_key: input.replayBoundaryKey,
        governance_boundary_key: input.governanceBoundaryKey ?? null,
        rollback_boundary_key: input.rollbackBoundaryKey ?? null,
        subject_user_id: input.subjectUserId ?? null,
        issuer_creator_id: input.issuerCreatorId ?? null,
        related_subscription_id: input.subscriptionId ?? null,
        related_payment_id: input.paymentId ?? null,
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        replay_sequence: input.replaySequence,
        ordering_timestamp: input.orderingTimestamp,
        replay_continuity_state: input.replayContinuityState,
        replay_gap_class: input.replayGapClass,
        replay_gap_severity: input.replayGapSeverity,
        lineage_completeness_score: input.lineageCompletenessScore,
        reconstruction_confidence: input.reconstructionConfidence,
        replay_payload: input.replayPayload ?? {},
        replay_metadata: input.replayMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_replay_continuity_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_replay_ordering").upsert(
      {
        replay_ordering_key: input.replayOrderingKey,
        replay_event_key: input.entitlementReplayContinuityKey,
        replay_lineage_key: input.entitlementReplayContinuityKey,
        replay_run_id: input.replayRunId ?? null,
        aggregate_owner: "entitlement_replay_continuity",
        replay_surface: "financial.entitlement_replay_continuity",
        ordering_surface:
          "financial.entitlement_replay_continuity.replay_safe_ordering",
        lifecycle_sequence: 10,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: "shadow_financial_replay_runs.completed_at",
        runtime_timestamp_source: "legacy_entitlement_runtime_timestamp",
        ordering_confidence: input.reconstructionConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "replay_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_replay_provenance").upsert(
      {
        replay_provenance_key: input.replayProvenanceKey,
        replay_event_key: input.entitlementReplayContinuityKey,
        replay_lineage_key: input.entitlementReplayContinuityKey,
        replay_ordering_key: input.replayOrderingKey,
        replay_run_id: input.replayRunId ?? null,
        aggregate_owner: "entitlement_replay_continuity",
        provenance_surface: "financial.entitlement_replay_continuity.provenance",
        provenance_source: "entitlement_replay_continuity_observation",
        provenance_status: "observed",
        isolation_boundary_state: "isolated",
        runtime_authority_preserved: true,
        replay_read_only: true,
        replay_execution_absent: true,
        replay_mutation_absent: true,
        provenance_snapshot: input.provenanceSnapshot ?? {},
        governance_snapshot: input.replaySnapshot ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "replay_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_replay_reconstruction_metadata").upsert(
      {
        replay_reconstruction_key: input.replayReconstructionKey,
        replay_event_key: input.entitlementReplayContinuityKey,
        replay_lineage_key: input.entitlementReplayContinuityKey,
        replay_ordering_key: input.replayOrderingKey,
        replay_provenance_key: input.replayProvenanceKey,
        replay_run_id: input.replayRunId ?? null,
        aggregate_owner: "entitlement_replay_continuity",
        reconstruction_surface:
          "financial.entitlement_replay_continuity.reconstruction_metadata",
        reconstruction_status: "observed",
        reconstruction_confidence: input.reconstructionConfidence,
        event_observed: input.replayObserved,
        lineage_observed: input.lineageObserved,
        ordering_observed: input.orderingObserved,
        provenance_observed: input.provenanceObserved,
        read_only_reconstructable: input.replaySafeReconstructable,
        reconstruction_completeness_score:
          input.reconstructionCompletenessScore,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "replay_reconstruction_key" }
    )
  )
}

export async function writeCanonicalEntitlementReplayContinuityNoThrow(
  input: CanonicalEntitlementReplayContinuityInsert
): Promise<void> {
  try {
    await writeCanonicalEntitlementReplayContinuity(input)
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.canonical_entitlement_replay_continuity_write_failed",
      error,
    })
  }
}
