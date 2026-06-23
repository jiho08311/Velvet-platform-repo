import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalEntitlementEventInsert = Readonly<{
  entitlementEventKey: string
  entitlementOrderingKey: string
  entitlementProvenanceKey: string
  entitlementReconstructionKey: string
  legacyEntitlementKey?: string | null
  entitlementSubjectUserId?: string | null
  entitlementIssuerCreatorId?: string | null
  relatedSubscriptionId?: string | null
  relatedPaymentId?: string | null
  sourceTable?: string | null
  sourceRowId?: string | null
  entitlementSurface: string
  entitlementKind: string
  entitlementLifecycleState: string
  subscriptionLineageKey?: string | null
  entitlementIssuanceProvenanceKey?: string | null
  entitlementDriftClass: string
  entitlementDriftSeverity: string
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  lineageCompletenessScore: number
  reconstructionCompletenessScore: number
  reconstructionConfidence: string
  eventObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  subscriptionLineageObserved: boolean
  replaySafeReconstructable: boolean
  eventMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
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

export async function writeCanonicalEntitlementEvent(
  input: CanonicalEntitlementEventInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-030",
    aggregateRoot: "canonical_entitlement_event.id",
    aggregateOwner: "subscription_validation",
    runtimeAuthoritative: true,
    subscriptionRuntimeAuthoritative: true,
    entitlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    replayAuthoritative: false,
    reconciliationAuthoritative: false,
    projectionAuthoritative: false,
    servingAuthoritative: false,
    synchronizedCandidateOnly: true,
    advisoryOnly: true,
    replayOwnedEntitlementMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    entitlementMutationAllowed: false,
    entitlementAuthorityPromotionAllowed: false,
    subscriptionServingReplacementAllowed: false,
    reconciliationRepairAllowed: false,
    projectionEntitlementAuthorityAllowed: false,
    runtimeAuthorityTransferAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_event").upsert(
      {
        entitlement_event_key: input.entitlementEventKey,
        legacy_entitlement_key: input.legacyEntitlementKey ?? null,
        aggregate_owner: "subscription_validation",
        entitlement_surface: input.entitlementSurface,
        runtime_surface: "runtime_entitlement_access_composition",
        event_source: "runtime_entitlement_observation",
        event_status: input.eventObserved ? "observed" : "skipped",
        entitlement_subject_user_id: input.entitlementSubjectUserId ?? null,
        entitlement_issuer_creator_id: input.entitlementIssuerCreatorId ?? null,
        related_subscription_id: input.relatedSubscriptionId ?? null,
        related_payment_id: input.relatedPaymentId ?? null,
        source_table: input.sourceTable ?? null,
        source_row_id: input.sourceRowId ?? null,
        entitlement_kind: input.entitlementKind,
        entitlement_lifecycle_state: input.entitlementLifecycleState,
        subscription_lineage_key: input.subscriptionLineageKey ?? null,
        entitlement_issuance_provenance_key:
          input.entitlementIssuanceProvenanceKey ?? null,
        entitlement_drift_class: input.entitlementDriftClass,
        entitlement_drift_severity: input.entitlementDriftSeverity,
        ordering_timestamp: input.orderingTimestamp,
        lineage_completeness_score: input.lineageCompletenessScore,
        reconstruction_confidence: input.reconstructionConfidence,
        event_metadata: input.eventMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_event_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_ordering").upsert(
      {
        entitlement_ordering_key: input.entitlementOrderingKey,
        entitlement_event_key: input.entitlementEventKey,
        aggregate_owner: "subscription_validation",
        entitlement_surface: "subscription.entitlement.ordering",
        ordering_surface: "subscription.entitlement.replay_safe_ordering",
        lifecycle_sequence: 10,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.reconstructionConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_entitlement_provenance").upsert(
      {
        entitlement_provenance_key: input.entitlementProvenanceKey,
        entitlement_event_key: input.entitlementEventKey,
        entitlement_ordering_key: input.entitlementOrderingKey,
        aggregate_owner: "subscription_validation",
        provenance_surface: "subscription.entitlement.provenance",
        provenance_source: "runtime_entitlement_access_composition",
        provenance_status: input.provenanceObserved ? "observed" : "skipped",
        isolation_boundary_state: "isolated",
        runtime_authority_preserved: true,
        subscription_runtime_preserved: true,
        entitlement_runtime_preserved: true,
        replay_read_only: true,
        entitlement_mutation_authority_absent: true,
        entitlement_promotion_absent: true,
        provenance_snapshot: input.provenanceSnapshot ?? {},
        governance_snapshot: input.governanceSnapshot ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "entitlement_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin
      .from("canonical_entitlement_reconstruction_metadata")
      .upsert(
        {
          entitlement_reconstruction_key: input.entitlementReconstructionKey,
          entitlement_event_key: input.entitlementEventKey,
          entitlement_ordering_key: input.entitlementOrderingKey,
          entitlement_provenance_key: input.entitlementProvenanceKey,
          aggregate_owner: "subscription_validation",
          reconstruction_surface: "subscription.entitlement.reconstruction",
          reconstruction_status: "observed",
          reconstruction_confidence: input.reconstructionConfidence,
          event_observed: input.eventObserved,
          ordering_observed: input.orderingObserved,
          provenance_observed: input.provenanceObserved,
          subscription_lineage_observed: input.subscriptionLineageObserved,
          replay_safe_reconstructable: input.replaySafeReconstructable,
          reconstruction_completeness_score:
            input.reconstructionCompletenessScore,
          reconstruction_metadata: input.reconstructionMetadata ?? {},
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "entitlement_reconstruction_key" }
      )
  )
}

export async function writeCanonicalEntitlementEventNoThrow(
  input: CanonicalEntitlementEventInsert
): Promise<void> {
  try {
    await writeCanonicalEntitlementEvent(input)
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.canonical_entitlement_event_write_failed",
      error,
    })
  }
}
