import { logger } from "@/shared/observability/structured-logger"

import { writeCanonicalEntitlementSovereigntyPreservationNoThrow } from "./canonical-entitlement-sovereignty-preservation-repository"
import { isWave010EntitlementSovereigntyPreservationEnabled } from "./feature-flags"

type JsonRecord = Record<string, unknown>

export type EntitlementSovereigntyPreservationInput = Readonly<{
  entitlementBoundaryKey: string
  sovereigntyBoundaryKey: string
  governanceBoundaryKey?: string | null
  rollbackBoundaryKey?: string | null
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
  sovereigntyGapClass?: string
  sovereigntyGapSeverity?: string
  preservationMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type EntitlementSovereigntyPreservationValidationInput = Readonly<{
  entitlementLineageDivergenceDetected?: boolean
  replayOrderingInstabilityDetected?: boolean
  entitlementReconstructionInstabilityDetected?: boolean
  entitlementAuthorityContaminationDetected?: boolean
  governanceOwnedEntitlementExecutionDetected?: boolean
  replayOwnedEntitlementMutationDetected?: boolean
  entitlementContinuityCorruptionDetected?: boolean
}>

export type EntitlementSovereigntyPreservationValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  entitlementRuntimeAuthoritative: true
  canonicalEntitlementAuthoritative: false
  governanceEntitlementExecutionAllowed: false
  replayEntitlementMutationAllowed: false
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

function createEntitlementSovereigntyPreservationKeys(
  input: EntitlementSovereigntyPreservationInput
) {
  const entitlement = stableKeyPart(input.entitlementBoundaryKey)
  const sovereignty = stableKeyPart(input.sovereigntyBoundaryKey)
  const subject = stableKeyPart(input.subjectUserId)
  const issuer = stableKeyPart(input.issuerCreatorId)
  const subscription = stableKeyPart(input.subscriptionId)

  return {
    entitlementSovereigntyPreservationKey: [
      "canonical_entitlement_sovereignty_preservation",
      entitlement,
      sovereignty,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementSovereigntyPreservationOrderingKey: [
      "canonical_entitlement_sovereignty_preservation_ordering",
      entitlement,
      sovereignty,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementSovereigntyPreservationProvenanceKey: [
      "canonical_entitlement_sovereignty_preservation_provenance",
      entitlement,
      sovereignty,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementSovereigntyPreservationReconstructionMetadataKey: [
      "canonical_entitlement_sovereignty_preservation_reconstruction_metadata",
      entitlement,
      sovereignty,
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
  sovereigntyGapDetected: boolean
}): string {
  if (
    input.entitlementObserved &&
    input.lineageObserved &&
    input.orderingObserved &&
    input.provenanceObserved &&
    !input.sovereigntyGapDetected
  ) {
    return "entitlement_sovereignty_reconstruction_complete"
  }

  if (input.entitlementObserved && input.orderingObserved) {
    return "entitlement_sovereignty_reconstruction_partial"
  }

  return "entitlement_sovereignty_reconstruction_incomplete"
}

export async function synchronizeEntitlementSovereigntyPreservationNoThrow(
  input: EntitlementSovereigntyPreservationInput
): Promise<void> {
  if (!isWave010EntitlementSovereigntyPreservationEnabled()) return

  try {
    const keys = createEntitlementSovereigntyPreservationKeys(input)
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const entitlementSequence = Math.max(1, input.entitlementSequence ?? 1)
    const entitlementObserved = Boolean(input.subjectUserId && input.issuerCreatorId)
    const lineageObserved = input.observedEntitlementSignalCount >= 0
    const orderingObserved = Boolean(orderingTimestamp)
    const provenanceObserved = true
    const sovereigntyGapDetected =
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
      sovereigntyGapDetected,
    })

    await writeCanonicalEntitlementSovereigntyPreservationNoThrow({
      ...keys,
      legacyEntitlementKey: keys.entitlementSovereigntyPreservationKey,
      replayRunId: input.replayRunId ?? null,
      reconciliationRunId: input.reconciliationRunId ?? null,
      rollbackValidationId: input.rollbackValidationId ?? null,
      entitlementBoundaryKey: input.entitlementBoundaryKey,
      sovereigntyBoundaryKey: input.sovereigntyBoundaryKey,
      governanceBoundaryKey: input.governanceBoundaryKey ?? null,
      rollbackBoundaryKey: input.rollbackBoundaryKey ?? null,
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
      sovereigntyState: sovereigntyGapDetected
        ? "entitlement_sovereignty_gap_observed"
        : "entitlement_sovereignty_preservation_observed",
      sovereigntyGapClass: input.sovereigntyGapClass ?? "none",
      sovereigntyGapSeverity: input.sovereigntyGapSeverity ?? "none",
      lineageCompletenessScore,
      reconstructionCompletenessScore,
      reconstructionConfidence: confidence,
      entitlementObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
      replaySafeReconstructable:
        confidence !== "entitlement_sovereignty_reconstruction_incomplete",
      preservationPayload: {
        observedEntitlementSignalCount: input.observedEntitlementSignalCount,
        expectedEntitlementSignalCount: input.expectedEntitlementSignalCount,
        synchronizedCandidateOnly: true,
        nonServing: true,
      },
      preservationMetadata: {
        ...(input.preservationMetadata ?? {}),
        entitlementRuntimeAuthorityPreserved: true,
        entitlementSovereigntyPreservationAdvisoryOnly: true,
        governanceEntitlementExecutionAllowed: false,
        replayEntitlementMutationAllowed: false,
        projectionEntitlementExecutionAllowed: false,
      },
      orderingMetadata: {
        replaySafeEntitlementOrderingObservable: true,
      },
      sovereigntyPreservationSnapshot: {
        canonicalAuthoritative: false,
        synchronizedCandidateOnly: true,
        nonServing: true,
      },
      provenanceSnapshot: {
        entitlementRuntimeAuthorityPreserved: true,
        replayReadOnly: true,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        entitlementSovereigntyPreservationObservable: true,
        replaySafeGapDetected: sovereigntyGapDetected,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        sourceBrief: "Wave-010-FEL-BR-076",
        advisoryOnly: true,
        replayReadOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.entitlement_sovereignty_preservation_failed_open",
      error,
    })
  }
}

export function validateEntitlementSovereigntyPreservationReadiness(
  input: EntitlementSovereigntyPreservationValidationInput
): EntitlementSovereigntyPreservationValidation {
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
    input.governanceOwnedEntitlementExecutionDetected
      ? "governance_owned_entitlement_execution_detected"
      : null,
    input.replayOwnedEntitlementMutationDetected
      ? "replay_owned_entitlement_mutation_detected"
      : null,
    input.entitlementContinuityCorruptionDetected
      ? "entitlement_continuity_corruption_detected"
      : null,
  ].filter((blocker): blocker is string => Boolean(blocker))

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass:
      blockers.length > 0
        ? "entitlement_sovereignty_preservation_drift_detected"
        : "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    entitlementRuntimeAuthoritative: true,
    canonicalEntitlementAuthoritative: false,
    governanceEntitlementExecutionAllowed: false,
    replayEntitlementMutationAllowed: false,
    projectionEntitlementExecutionAllowed: false,
    entitlementRuntimeReplacementAllowed: false,
    authorityTransferAllowed: false,
  }
}
