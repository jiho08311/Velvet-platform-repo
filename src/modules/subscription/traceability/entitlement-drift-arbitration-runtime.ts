import { logger } from "@/shared/observability/structured-logger"

import { writeCanonicalEntitlementDriftArbitrationNoThrow } from "./canonical-entitlement-drift-arbitration-repository"
import { isWave010EntitlementDriftArbitrationEnabled } from "./feature-flags"

type JsonRecord = Record<string, unknown>

export type EntitlementDriftArbitrationInput = Readonly<{
  entitlementBoundaryKey: string
  driftBoundaryKey: string
  reconciliationBoundaryKey?: string | null
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
  entitlementDriftClass?: string
  entitlementDriftSeverity?: string
  driftMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type EntitlementDriftArbitrationValidationInput = Readonly<{
  entitlementLineageDivergenceDetected?: boolean
  replayOrderingInstabilityDetected?: boolean
  entitlementReconstructionInstabilityDetected?: boolean
  entitlementAuthorityContaminationDetected?: boolean
  governanceOwnedEntitlementMutationDetected?: boolean
  replayOwnedEntitlementExecutionDetected?: boolean
  entitlementContinuityCorruptionDetected?: boolean
}>

export type EntitlementDriftArbitrationValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "promotion_blocking"
  blockers: readonly string[]
  entitlementRuntimeAuthoritative: true
  canonicalEntitlementAuthoritative: false
  governanceEntitlementMutationAllowed: false
  replayEntitlementExecutionAllowed: false
  projectionEntitlementExecutionAllowed: false
  entitlementRuntimeReplacementAllowed: false
  authorityTransferAllowed: false
  reconciliationRepairAllowed: false
  replayReadOnly: true
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

function createEntitlementDriftKeys(input: EntitlementDriftArbitrationInput) {
  const entitlement = stableKeyPart(input.entitlementBoundaryKey)
  const drift = stableKeyPart(input.driftBoundaryKey)
  const subject = stableKeyPart(input.subjectUserId)
  const issuer = stableKeyPart(input.issuerCreatorId)
  const subscription = stableKeyPart(input.subscriptionId)

  return {
    entitlementDriftKey: [
      "canonical_entitlement_drift",
      entitlement,
      drift,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementDriftOrderingKey: [
      "canonical_entitlement_drift_ordering",
      entitlement,
      drift,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementDriftProvenanceKey: [
      "canonical_entitlement_drift_provenance",
      entitlement,
      drift,
      subject,
      issuer,
      subscription,
    ].join(":"),
    entitlementDriftReconstructionMetadataKey: [
      "canonical_entitlement_drift_reconstruction_metadata",
      entitlement,
      drift,
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

export async function synchronizeEntitlementDriftArbitrationNoThrow(
  input: EntitlementDriftArbitrationInput
): Promise<void> {
  if (!isWave010EntitlementDriftArbitrationEnabled()) return

  try {
    const keys = createEntitlementDriftKeys(input)
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

    await writeCanonicalEntitlementDriftArbitrationNoThrow({
      ...keys,
      replayRunId: input.replayRunId ?? null,
      reconciliationRunId: input.reconciliationRunId ?? null,
      rollbackValidationId: input.rollbackValidationId ?? null,
      entitlementBoundaryKey: input.entitlementBoundaryKey,
      driftBoundaryKey: input.driftBoundaryKey,
      reconciliationBoundaryKey: input.reconciliationBoundaryKey ?? null,
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
        ? "entitlement_drift_gap_observed"
        : "entitlement_drift_arbitration_observed",
      entitlementDriftClass: input.entitlementDriftClass ?? "none",
      entitlementDriftSeverity: input.entitlementDriftSeverity ?? "none",
      lineageCompletenessScore,
      reconstructionCompletenessScore,
      reconstructionConfidence: confidence,
      entitlementObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
      replaySafeReconstructable:
        confidence !== "entitlement_reconstruction_incomplete",
      driftPayload: {
        observedEntitlementSignalCount: input.observedEntitlementSignalCount,
        expectedEntitlementSignalCount: input.expectedEntitlementSignalCount,
        synchronizedCandidateOnly: true,
        nonServing: true,
      },
      driftMetadata: {
        ...(input.driftMetadata ?? {}),
        entitlementRuntimeAuthorityPreserved: true,
        entitlementDriftArbitrationAdvisoryOnly: true,
        governanceEntitlementMutationAllowed: false,
        replayEntitlementExecutionAllowed: false,
        projectionEntitlementExecutionAllowed: false,
        reconciliationRepairAllowed: false,
      },
      orderingMetadata: {
        replaySafeEntitlementOrderingObservable: true,
      },
      driftSnapshot: {
        canonicalAuthoritative: false,
        synchronizedCandidateOnly: true,
        nonServing: true,
      },
      provenanceSnapshot: {
        entitlementRuntimeAuthorityPreserved: true,
        reconciliationAdvisoryOnly: true,
        replayReadOnly: true,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        entitlementDriftArbitrationObservable: true,
        replaySafeGapDetected: entitlementGapDetected,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        sourceBrief: "Wave-010-FEL-BR-079",
        advisoryOnly: true,
        replayReadOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.entitlement_drift_arbitration_failed_open",
      error,
    })
  }
}

export function validateEntitlementDriftArbitrationReadiness(
  input: EntitlementDriftArbitrationValidationInput
): EntitlementDriftArbitrationValidation {
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
    input.governanceOwnedEntitlementMutationDetected
      ? "governance_owned_entitlement_mutation_detected"
      : null,
    input.replayOwnedEntitlementExecutionDetected
      ? "replay_owned_entitlement_execution_detected"
      : null,
    input.entitlementContinuityCorruptionDetected
      ? "entitlement_continuity_corruption_detected"
      : null,
  ].filter((blocker): blocker is string => Boolean(blocker))

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass:
      blockers.length > 0 ? "entitlement_drift_arbitration_detected" : "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    entitlementRuntimeAuthoritative: true,
    canonicalEntitlementAuthoritative: false,
    governanceEntitlementMutationAllowed: false,
    replayEntitlementExecutionAllowed: false,
    projectionEntitlementExecutionAllowed: false,
    entitlementRuntimeReplacementAllowed: false,
    authorityTransferAllowed: false,
    reconciliationRepairAllowed: false,
    replayReadOnly: true,
  }
}
