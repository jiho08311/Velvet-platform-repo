import { logger } from "@/shared/observability/structured-logger"

import { writeCanonicalValidationBoundaryNoThrow } from "./canonical-validation-boundary-repository"
import { isWave010SubscriptionValidationBoundaryEnabled } from "./feature-flags"

type JsonRecord = Record<string, unknown>

export type SubscriptionValidationBoundaryInput = Readonly<{
  subjectUserId: string
  creatorId: string
  accessGranted: boolean
  validationResult?: "active" | "inactive" | "invalid"
  subscriptionId?: string | null
  sourceTable?: string | null
  sourceRowId?: string | null
  orderingTimestamp?: string | null
  eventMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type SubscriptionValidationBoundaryValidationInput = Readonly<{
  validationLineageDivergenceDetected?: boolean
  validationOrderingDriftDetected?: boolean
  replaySafeValidationGapDetected?: boolean
  validationIsolationMismatchDetected?: boolean
  unauthorizedValidationMutationDetected?: boolean
  replayOwnedValidationMutationDetected?: boolean
  projectionOwnedEntitlementAuthorityDetected?: boolean
  validationAuthorityContaminationDetected?: boolean
}>

export type SubscriptionValidationBoundaryValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  validationRuntimeAuthoritative: true
  entitlementRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  replayOwnedValidationMutationAllowed: false
  validationAuthorityTransferAllowed: false
  projectionEntitlementAuthorityAllowed: false
  runtimeValidationReplacementAllowed: false
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

function createValidationKeys(input: SubscriptionValidationBoundaryInput) {
  const subject = stableKeyPart(input.subjectUserId)
  const creator = stableKeyPart(input.creatorId)
  const subscription = stableKeyPart(input.subscriptionId)
  const result = stableKeyPart(
    input.validationResult ?? (input.accessGranted ? "active" : "inactive")
  )

  return {
    legacyValidationKey: [
      "subscription_validation",
      subject,
      creator,
      subscription,
    ].join(":"),
    validationEventKey: [
      "canonical_validation_event",
      subject,
      creator,
      subscription,
      result,
    ].join(":"),
    validationLineageKey: [
      "canonical_validation_lineage",
      subject,
      creator,
      subscription,
    ].join(":"),
    validationOrderingKey: [
      "canonical_validation_ordering",
      subject,
      creator,
      subscription,
    ].join(":"),
    validationProvenanceKey: [
      "canonical_validation_provenance",
      subject,
      creator,
      subscription,
    ].join(":"),
    validationReconstructionKey: [
      "canonical_validation_reconstruction",
      subject,
      creator,
      subscription,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  eventObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
}): string {
  if (
    input.eventObserved &&
    input.lineageObserved &&
    input.orderingObserved &&
    input.provenanceObserved
  ) {
    return "validation_reconstruction_complete"
  }

  if (input.eventObserved && input.orderingObserved) {
    return "validation_reconstruction_partial"
  }

  return "validation_reconstruction_incomplete"
}

export async function synchronizeSubscriptionValidationBoundaryNoThrow(
  input: SubscriptionValidationBoundaryInput
): Promise<void> {
  if (!isWave010SubscriptionValidationBoundaryEnabled()) return

  try {
    const keys = createValidationKeys(input)
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const validationResult =
      input.validationResult ?? (input.accessGranted ? "active" : "inactive")
    const eventObserved = Boolean(input.subjectUserId && input.creatorId)
    const lineageObserved = Boolean(input.subscriptionId)
    const orderingObserved = Boolean(orderingTimestamp)
    const provenanceObserved = true
    const reconstructionCompletenessScore = clampScore(
      [
        eventObserved,
        lineageObserved,
        orderingObserved,
        provenanceObserved,
      ].filter(Boolean).length / 4
    )
    const confidence = reconstructionConfidence({
      eventObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
    })

    await writeCanonicalValidationBoundaryNoThrow({
      ...keys,
      subjectUserId: uuidOrNull(input.subjectUserId),
      creatorId: uuidOrNull(input.creatorId),
      subscriptionId: uuidOrNull(input.subscriptionId),
      sourceTable: input.sourceTable ?? null,
      sourceRowId: uuidOrNull(input.sourceRowId),
      validationResult,
      accessGranted: input.accessGranted,
      validationDriftClass: "none",
      validationDriftSeverity: "none",
      orderingTimestamp,
      orderingSource: "subscription_validation_runtime.observed_at",
      replayTimestampSource: "legacy_subscription_runtime_timestamp",
      lineageCompletenessScore: lineageObserved ? 1 : 0,
      reconstructionCompletenessScore,
      reconstructionConfidence: confidence,
      eventObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
      replaySafeReconstructable:
        confidence !== "validation_reconstruction_incomplete",
      eventMetadata: {
        ...(input.eventMetadata ?? {}),
        validationResult,
        accessGranted: input.accessGranted,
      },
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        validationBoundaryLineageObservable: true,
        validationMutationAllowed: false,
      },
      orderingMetadata: {
        orderingTimestamp,
        replaySafeValidationOrderingObservable: true,
        replayOwnedValidationMutationAllowed: false,
      },
      runtimeValidationSnapshot: {
        validationRuntimeAuthoritative: true,
        runtimeValidationReplacementAllowed: false,
        accessGranted: input.accessGranted,
      },
      entitlementSnapshot: {
        entitlementRuntimeAuthoritative: true,
        projectionEntitlementAuthorityAllowed: false,
      },
      provenanceSnapshot: {
        validationRuntimePreserved: true,
        entitlementRuntimePreserved: true,
        replayReadOnly: true,
      },
      governanceSnapshot: {
        validationAuthorityTransferAllowed: false,
        runtimeAuthorityTransferAllowed: false,
        reconciliationRepairAllowed: false,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        validationLineageCompletenessMeasurable: true,
        validationReconstructionMeasurable: true,
        replaySafeReconstructable:
          confidence !== "validation_reconstruction_incomplete",
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        advisoryOnly: true,
        synchronizedCandidateOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.subscription_validation_boundary_failed_open",
      error,
    })
  }
}

export function validateSubscriptionValidationBoundaryReadiness(
  input: SubscriptionValidationBoundaryValidationInput
): SubscriptionValidationBoundaryValidation {
  const blockers = [
    input.validationLineageDivergenceDetected
      ? "validation_lineage_divergence_detected"
      : null,
    input.validationOrderingDriftDetected
      ? "validation_ordering_drift_detected"
      : null,
    input.replaySafeValidationGapDetected
      ? "replay_safe_validation_gap_detected"
      : null,
    input.validationIsolationMismatchDetected
      ? "validation_isolation_mismatch_detected"
      : null,
    input.unauthorizedValidationMutationDetected
      ? "unauthorized_validation_mutation_detected"
      : null,
    input.replayOwnedValidationMutationDetected
      ? "replay_owned_validation_mutation_detected"
      : null,
    input.projectionOwnedEntitlementAuthorityDetected
      ? "projection_owned_entitlement_authority_detected"
      : null,
    input.validationAuthorityContaminationDetected
      ? "validation_authority_contamination_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    validationRuntimeAuthoritative: true,
    entitlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    replayOwnedValidationMutationAllowed: false,
    validationAuthorityTransferAllowed: false,
    projectionEntitlementAuthorityAllowed: false,
    runtimeValidationReplacementAllowed: false,
  }
}
