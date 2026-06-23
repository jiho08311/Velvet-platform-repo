import { logger } from "@/shared/observability/structured-logger"

import { writeCanonicalEntitlementReplayPreservationNoThrow } from "./canonical-entitlement-replay-preservation-repository"
import { isWave010EntitlementReplayPreservationEnabled } from "./feature-flags"

type JsonRecord = Record<string, unknown>

export type EntitlementReplayPreservationInput = Readonly<{
  entitlementBoundaryKey: string
  replayBoundaryKey: string
  governanceBoundaryKey?: string | null
  subjectUserId?: string | null
  issuerCreatorId?: string | null
  subscriptionId?: string | null
  paymentId?: string | null
  replayRunId?: string | null
  reconciliationRunId?: string | null
  rollbackValidationId?: string | null
  sourceTable?: string | null
  sourceRowId?: string | null
  entitlementSequence?: number
  orderingTimestamp?: string | null
  observedEntitlementSignalCount: number
  expectedEntitlementSignalCount: number
  entitlementGapClass?: string
  entitlementGapSeverity?: string
  entitlementMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type EntitlementReplayPreservationValidationInput = Readonly<{
  entitlementLineageDivergenceDetected?: boolean
  replayOrderingInstabilityDetected?: boolean
  entitlementReconstructionInstabilityDetected?: boolean
  entitlementAuthorityContaminationDetected?: boolean
  replayOwnedEntitlementMutationDetected?: boolean
  governanceOwnedEntitlementAuthorityDetected?: boolean
  entitlementContinuityCorruptionDetected?: boolean
}>

export type EntitlementReplayPreservationValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  entitlementRuntimeAuthoritative: true
  canonicalEntitlementAuthoritative: false
  replayEntitlementMutationAllowed: false
  governanceEntitlementAuthorityAllowed: false
  projectionEntitlementExecutionAllowed: false
  entitlementRuntimeReplacementAllowed: false
  authorityTransferAllowed: false
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

function createEntitlementReplayKeys(input: EntitlementReplayPreservationInput) {
  const entitlement = stableKeyPart(input.entitlementBoundaryKey)
  const replay = stableKeyPart(input.replayBoundaryKey)
  const subject = stableKeyPart(input.subjectUserId)
  const issuer = stableKeyPart(input.issuerCreatorId)
  const subscription = stableKeyPart(input.subscriptionId)

  return {
    legacyEntitlementReplayKey: [
      "legacy_entitlement_replay",
      entitlement,
      replay,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementReplayKey: [
      "canonical_entitlement_replay",
      entitlement,
      replay,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementReplayOrderingKey: [
      "canonical_entitlement_replay_ordering",
      entitlement,
      replay,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementReplayProvenanceKey: [
      "canonical_entitlement_replay_provenance",
      entitlement,
      replay,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementReplayReconstructionMetadataKey: [
      "canonical_entitlement_replay_reconstruction_metadata",
      entitlement,
      replay,
      subject,
      issuer,
      subscription,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  entitlementObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  entitlementGapDetected: boolean
}): string {
  if (
    input.entitlementObserved &&
    input.lineageObserved &&
    input.orderingObserved &&
    input.provenanceObserved &&
    !input.entitlementGapDetected
  ) {
    return "entitlement_reconstruction_complete"
  }

  if (input.entitlementObserved && input.orderingObserved) {
    return "entitlement_reconstruction_partial"
  }

  return "entitlement_reconstruction_incomplete"
}

export async function synchronizeEntitlementReplayPreservationNoThrow(
  input: EntitlementReplayPreservationInput
): Promise<void> {
  if (!isWave010EntitlementReplayPreservationEnabled()) return

  try {
    const keys = createEntitlementReplayKeys(input)
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const entitlementSequence = Math.max(1, input.entitlementSequence ?? 1)
    const entitlementObserved = Boolean(input.subjectUserId && input.issuerCreatorId)
    const lineageObserved = input.observedEntitlementSignalCount >= 0
    const orderingObserved = Boolean(orderingTimestamp)
    const provenanceObserved = true
    const entitlementGapDetected =
      input.expectedEntitlementSignalCount > 0 &&
      input.observedEntitlementSignalCount === 0
    const lineageCompletenessScore = clampScore(
      input.expectedEntitlementSignalCount === 0
        ? 1
        : input.observedEntitlementSignalCount /
            input.expectedEntitlementSignalCount
    )
    const reconstructionCompletenessScore = clampScore(
      [
        entitlementObserved,
        lineageObserved,
        orderingObserved,
        provenanceObserved,
      ].filter(Boolean).length / 4
    )
    const confidence = reconstructionConfidence({
      entitlementObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
      entitlementGapDetected,
    })

    await writeCanonicalEntitlementReplayPreservationNoThrow({
      ...keys,
      replayRunId: input.replayRunId ?? null,
      reconciliationRunId: input.reconciliationRunId ?? null,
      rollbackValidationId: input.rollbackValidationId ?? null,
      entitlementBoundaryKey: input.entitlementBoundaryKey,
      replayBoundaryKey: input.replayBoundaryKey,
      governanceBoundaryKey: input.governanceBoundaryKey ?? null,
      entitlementSubjectUserId: uuidOrNull(input.subjectUserId),
      entitlementIssuerCreatorId: uuidOrNull(input.issuerCreatorId),
      relatedSubscriptionId: uuidOrNull(input.subscriptionId),
      relatedPaymentId: uuidOrNull(input.paymentId),
      sourceTable: input.sourceTable ?? null,
      sourceRowId: uuidOrNull(input.sourceRowId),
      entitlementSequence,
      orderingTimestamp,
      orderingSource: "runtime_entitlement_access_composition.observed_at",
      replayTimestampSource: "legacy_entitlement_runtime_timestamp",
      entitlementContinuityState: entitlementGapDetected
        ? "entitlement_replay_gap_observed"
        : "entitlement_replay_continuity_observed",
      entitlementGapClass: input.entitlementGapClass ?? "none",
      entitlementGapSeverity: input.entitlementGapSeverity ?? "none",
      lineageCompletenessScore,
      reconstructionCompletenessScore,
      reconstructionConfidence: confidence,
      entitlementObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
      replaySafeReconstructable:
        confidence !== "entitlement_reconstruction_incomplete",
      entitlementPayload: {
        observedEntitlementSignalCount: input.observedEntitlementSignalCount,
        expectedEntitlementSignalCount: input.expectedEntitlementSignalCount,
        entitlementReplayNonServing: true,
      },
      entitlementMetadata: {
        ...(input.entitlementMetadata ?? {}),
        entitlementRuntimeAuthorityPreserved: true,
        entitlementReplayAdvisoryOnly: true,
      },
      orderingMetadata: {
        orderingTimestamp,
        replaySafeEntitlementOrderingObservable: true,
      },
      entitlementSnapshot: {
        canonicalEntitlementAuthoritative: false,
        synchronizedCandidateOnly: true,
        nonServing: true,
      },
      provenanceSnapshot: {
        replayReadOnly: true,
        entitlementRuntimeAuthorityPreserved: true,
        governanceEntitlementAuthorityAllowed: false,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        entitlementContinuityValidationObservable: true,
        entitlementReconstructionMeasurable: true,
        replaySafeEntitlementGapDetected: entitlementGapDetected,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        advisoryOnly: true,
        synchronizedCandidateOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.entitlement_replay_preservation_failed_open",
      error,
    })
  }
}

export function validateEntitlementReplayPreservationReadiness(
  input: EntitlementReplayPreservationValidationInput
): EntitlementReplayPreservationValidation {
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
    input.replayOwnedEntitlementMutationDetected
      ? "replay_owned_entitlement_mutation_detected"
      : null,
    input.governanceOwnedEntitlementAuthorityDetected
      ? "governance_owned_entitlement_authority_detected"
      : null,
    input.entitlementContinuityCorruptionDetected
      ? "entitlement_continuity_corruption_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass:
      blockers.length > 0 ? "entitlement_replay_drift_detected" : "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    entitlementRuntimeAuthoritative: true,
    canonicalEntitlementAuthoritative: false,
    replayEntitlementMutationAllowed: false,
    governanceEntitlementAuthorityAllowed: false,
    projectionEntitlementExecutionAllowed: false,
    entitlementRuntimeReplacementAllowed: false,
    authorityTransferAllowed: false,
  }
}
