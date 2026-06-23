import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"
import { isWave010EntitlementSovereigntyMapEnabled } from "./feature-flags"

type JsonRecord = Record<string, unknown>

export type EntitlementSovereigntyMapInput = Readonly<{
  subjectUserId: string
  issuerCreatorId: string
  entitlementSurface: string
  entitlementKind: string
  subscriptionId?: string | null
  paymentId?: string | null
  sourceTable?: string | null
  sourceRowId?: string | null
  orderingTimestamp?: string | null
  metadata?: JsonRecord
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
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

async function assertNoSupabaseError(
  operation: PromiseLike<{ error: unknown }>
): Promise<void> {
  const { error } = await operation

  if (error) throw error
}

export async function synchronizeEntitlementSovereigntyMapNoThrow(
  input: EntitlementSovereigntyMapInput
): Promise<void> {
  if (!isWave010EntitlementSovereigntyMapEnabled()) return

  try {
    const subject = stableKeyPart(input.subjectUserId)
    const creator = stableKeyPart(input.issuerCreatorId)
    const subscription = stableKeyPart(input.subscriptionId)
    const surface = stableKeyPart(input.entitlementSurface)
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const entitlementSovereigntyKey = [
      "canonical_entitlement_sovereignty",
      surface,
      subject,
      creator,
      subscription,
    ].join(":")
    const entitlementOrderingKey = [
      "canonical_entitlement_sovereignty_ordering",
      surface,
      subject,
      creator,
      subscription,
    ].join(":")
    const entitlementProvenanceKey = [
      "canonical_entitlement_sovereignty_provenance",
      surface,
      subject,
      creator,
      subscription,
    ].join(":")
    const entitlementReconstructionKey = [
      "canonical_entitlement_sovereignty_reconstruction",
      surface,
      subject,
      creator,
      subscription,
    ].join(":")
    const provenanceMetadata = {
      ...(input.metadata ?? {}),
      brief: "Wave-010-FEL-BR-049",
      aggregateRoot: "canonical_entitlement_sovereignty.id",
      entitlementRuntimeAuthoritative: true,
      entitlementSovereigntyAuthoritative: false,
      replayEntitlementMutationAllowed: false,
      governanceEntitlementAuthorityAllowed: false,
      synchronizedCandidateOnly: true,
      advisoryOnly: true,
      rollbackSafe: true,
      failOpen: true,
    }

    await assertNoSupabaseError(
      supabaseAdmin.from("canonical_entitlement_sovereignties").upsert(
        {
          entitlement_sovereignty_key: entitlementSovereigntyKey,
          legacy_entitlement_key: entitlementSovereigntyKey,
          entitlement_subject_user_id: uuidOrNull(input.subjectUserId),
          entitlement_issuer_creator_id: uuidOrNull(input.issuerCreatorId),
          subscription_id: uuidOrNull(input.subscriptionId),
          payment_id: uuidOrNull(input.paymentId),
          entitlement_surface: input.entitlementSurface,
          entitlement_kind: input.entitlementKind,
          ownership_surface: "entitlement.runtime_ownership",
          source_table: input.sourceTable ?? null,
          source_row_id: uuidOrNull(input.sourceRowId),
          entitlement_sequence: 1,
          ordering_timestamp: orderingTimestamp,
          entitlement_sovereignty_state: "entitlement_sovereignty_observed",
          lineage_completeness_score: input.subscriptionId ? 1 : 0,
          reconstruction_confidence: input.subscriptionId
            ? "entitlement_sovereignty_reconstruction_complete"
            : "entitlement_sovereignty_reconstruction_partial",
          sovereignty_payload: {
            entitlementSovereigntyNonServing: true,
            subjectUserId: input.subjectUserId,
            issuerCreatorId: input.issuerCreatorId,
          },
          sovereignty_metadata: input.metadata ?? {},
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "entitlement_sovereignty_key" }
      )
    )

    await assertNoSupabaseError(
      supabaseAdmin.from("canonical_entitlement_ordering").upsert(
        {
          entitlement_ordering_key: entitlementOrderingKey,
          entitlement_event_key: entitlementSovereigntyKey,
          entitlement_sovereignty_key: entitlementSovereigntyKey,
          aggregate_owner: "entitlement_sovereignty",
          entitlement_surface: "financial.entitlement.replay_safe_ordering",
          ordering_surface: "financial.entitlement.replay_safe_ordering",
          entitlement_sequence: 1,
          lifecycle_sequence: 10,
          ordering_timestamp: orderingTimestamp,
          ordering_source: "runtime_entitlement_access_composition.observed_at",
          replay_timestamp_source: "legacy_entitlement_runtime_timestamp",
          ordering_confidence: "entitlement_sovereignty_reconstruction_complete",
          ordering_metadata: { replaySafeEntitlementOrderingObservable: true },
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "entitlement_ordering_key" }
      )
    )

    await assertNoSupabaseError(
      supabaseAdmin.from("canonical_entitlement_provenance").upsert(
        {
          entitlement_provenance_key: entitlementProvenanceKey,
          entitlement_event_key: entitlementSovereigntyKey,
          entitlement_sovereignty_key: entitlementSovereigntyKey,
          entitlement_ordering_key: entitlementOrderingKey,
          aggregate_owner: "entitlement_sovereignty",
          entitlement_sovereignty_advisory_only: true,
          entitlement_sovereignty_non_serving: true,
          replay_read_only: true,
          entitlement_runtime_authority_preserved: true,
          sovereignty_snapshot: { synchronizedCandidateOnly: true },
          provenance_snapshot: { entitlementRuntimeAuthorityPreserved: true },
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "entitlement_provenance_key" }
      )
    )

    await assertNoSupabaseError(
      supabaseAdmin.from("canonical_entitlement_reconstruction_metadata").upsert(
        {
          entitlement_reconstruction_key: entitlementReconstructionKey,
          entitlement_reconstruction_metadata_key: entitlementReconstructionKey,
          entitlement_event_key: entitlementSovereigntyKey,
          entitlement_sovereignty_key: entitlementSovereigntyKey,
          entitlement_ordering_key: entitlementOrderingKey,
          entitlement_provenance_key: entitlementProvenanceKey,
          aggregate_owner: "entitlement_sovereignty",
          reconstruction_surface:
            "financial.entitlement.sovereignty_reconstruction_metadata",
          reconstruction_confidence:
            "entitlement_sovereignty_reconstruction_complete",
          entitlement_observed: true,
          event_observed: true,
          lineage_observed: Boolean(input.subscriptionId),
          ordering_observed: true,
          provenance_observed: true,
          replay_safe_reconstructable: true,
          reconstruction_completeness_score: input.subscriptionId ? 1 : 0.75,
          reconstruction_metadata: {
            entitlementSovereigntyContinuityObservable: true,
          },
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "entitlement_reconstruction_key" }
      )
    )
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.entitlement_sovereignty_map_failed_open",
      error,
    })
  }
}

export function validateEntitlementSovereigntyMapReadiness(input: {
  entitlementLineageDivergenceDetected?: boolean
  replayOrderingInstabilityDetected?: boolean
  entitlementReconstructionInstabilityDetected?: boolean
  entitlementAuthorityContaminationDetected?: boolean
}) {
  const blockers = [
    input.entitlementLineageDivergenceDetected
      ? "entitlement_lineage_divergence_detected"
      : null,
    input.replayOrderingInstabilityDetected
      ? "replay_ordering_instability_detected"
      : null,
    input.entitlementReconstructionInstabilityDetected
      ? "entitlement_reconstruction_instability_detected"
      : null,
    input.entitlementAuthorityContaminationDetected
      ? "entitlement_authority_contamination_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    blockers,
    entitlementRuntimeAuthoritative: true,
    entitlementSovereigntyAuthoritative: false,
    replayEntitlementMutationAllowed: false,
    governanceEntitlementAuthorityAllowed: false,
    authorityTransferAllowed: false,
  } as const
}
