import { logger } from "@/shared/observability/structured-logger"

import { writeCanonicalFinancialIdentityCorrelationNoThrow } from "./canonical-financial-identity-repository"
import { isWave010FinancialIdentityCorrelationEnabled } from "./feature-flags"

type JsonRecord = Record<string, unknown>

export type FinancialIdentityCorrelationInput = Readonly<{
  userId?: string | null
  creatorId?: string | null
  ownerUserId?: string | null
  financialActorKey?: string | null
  actorKind?: string
  ownershipSurface: string
  sourceTable?: string | null
  sourceRowId?: string | null
  targetTable?: string | null
  targetRowId?: string | null
  relatedSubscriptionId?: string | null
  relatedPaymentId?: string | null
  relatedEarningId?: string | null
  relatedPayoutRequestId?: string | null
  relatedPayoutId?: string | null
  orderingTimestamp?: string | null
  identityMetadata?: JsonRecord
  correlationMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type FinancialIdentityCorrelationValidationInput = Readonly<{
  identityLineageDivergenceDetected?: boolean
  identityOrderingDriftDetected?: boolean
  replaySafeIdentityGapDetected?: boolean
  ownershipMismatchDetected?: boolean
  orphanedFinancialActorLineageDetected?: boolean
  replayOwnedIdentityMutationDetected?: boolean
  governanceOwnedIdentityAuthorityDetected?: boolean
  projectionOwnedOwnershipAuthorityDetected?: boolean
}>

export type FinancialIdentityCorrelationValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  runtimeIdentityAuthoritative: true
  financialOwnershipRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  replayOwnedIdentityMutationAllowed: false
  governanceIdentityAuthorityAllowed: false
  projectionOwnershipAuthorityAllowed: false
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

function createFinancialIdentityKeys(input: FinancialIdentityCorrelationInput) {
  const user = stableKeyPart(input.userId)
  const creator = stableKeyPart(input.creatorId)
  const owner = stableKeyPart(input.ownerUserId)
  const actor = stableKeyPart(input.financialActorKey)
  const surface = stableKeyPart(input.ownershipSurface)
  const source = stableKeyPart(input.sourceRowId)

  return {
    legacyIdentityKey: [
      "financial_identity",
      surface,
      user,
      creator,
      owner,
      actor,
      source,
    ].join(":"),
    financialIdentityKey: [
      "canonical_financial_identity",
      surface,
      user,
      creator,
      owner,
      actor,
    ].join(":"),
    identityCorrelationKey: [
      "canonical_financial_identity_correlation",
      surface,
      user,
      creator,
      owner,
      actor,
      source,
    ].join(":"),
    identityOrderingKey: [
      "canonical_financial_identity_ordering",
      surface,
      user,
      creator,
      owner,
      actor,
      source,
    ].join(":"),
    ownershipProvenanceKey: [
      "canonical_financial_ownership_provenance",
      surface,
      user,
      creator,
      owner,
      actor,
      source,
    ].join(":"),
    identityReconstructionKey: [
      "canonical_financial_identity_reconstruction",
      surface,
      user,
      creator,
      owner,
      actor,
      source,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  identityObserved: boolean
  correlationObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
}): string {
  if (
    input.identityObserved &&
    input.correlationObserved &&
    input.orderingObserved &&
    input.provenanceObserved
  ) {
    return "identity_reconstruction_complete"
  }

  if (input.identityObserved && input.correlationObserved) {
    return "identity_reconstruction_partial"
  }

  return "identity_reconstruction_incomplete"
}

export async function synchronizeFinancialIdentityCorrelationNoThrow(
  input: FinancialIdentityCorrelationInput
): Promise<void> {
  if (!isWave010FinancialIdentityCorrelationEnabled()) return

  try {
    const keys = createFinancialIdentityKeys(input)
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const userId = uuidOrNull(input.userId)
    const creatorId = uuidOrNull(input.creatorId)
    const ownerUserId = uuidOrNull(input.ownerUserId)
    const identityObserved = Boolean(userId ?? ownerUserId ?? creatorId)
    const correlationObserved = Boolean(input.ownershipSurface)
    const orderingObserved = Boolean(orderingTimestamp)
    const provenanceObserved = true
    const reconstructionCompletenessScore = clampScore(
      [
        identityObserved,
        correlationObserved,
        orderingObserved,
        provenanceObserved,
      ].filter(Boolean).length / 4
    )
    const confidence = reconstructionConfidence({
      identityObserved,
      correlationObserved,
      orderingObserved,
      provenanceObserved,
    })

    await writeCanonicalFinancialIdentityCorrelationNoThrow({
      ...keys,
      userId,
      creatorId,
      ownerUserId,
      financialActorKey: input.financialActorKey ?? null,
      actorKind: input.actorKind ?? "runtime_user",
      ownershipSurface: input.ownershipSurface,
      sourceTable: input.sourceTable ?? null,
      sourceRowId: uuidOrNull(input.sourceRowId),
      targetTable: input.targetTable ?? null,
      targetRowId: uuidOrNull(input.targetRowId),
      relatedSubscriptionId: uuidOrNull(input.relatedSubscriptionId),
      relatedPaymentId: uuidOrNull(input.relatedPaymentId),
      relatedEarningId: uuidOrNull(input.relatedEarningId),
      relatedPayoutRequestId: uuidOrNull(input.relatedPayoutRequestId),
      relatedPayoutId: uuidOrNull(input.relatedPayoutId),
      orderingTimestamp,
      orderingSource: "financial_identity_correlation_runtime.observed_at",
      replayTimestampSource: "legacy_financial_ownership_runtime_timestamp",
      lineageCompletenessScore: identityObserved && correlationObserved ? 1 : 0,
      reconstructionCompletenessScore,
      reconstructionConfidence: confidence,
      identityObserved,
      correlationObserved,
      orderingObserved,
      provenanceObserved,
      replaySafeReconstructable:
        confidence !== "identity_reconstruction_incomplete",
      identityMetadata: {
        ...(input.identityMetadata ?? {}),
        runtimeIdentityAuthoritative: true,
      },
      correlationMetadata: {
        ...(input.correlationMetadata ?? {}),
        financialOwnershipRuntimeAuthoritative: true,
        canonicalFinancialIdentityServingAuthority: false,
      },
      orderingMetadata: {
        orderingTimestamp,
        replaySafeIdentityOrderingObservable: true,
      },
      runtimeIdentitySnapshot: {
        runtimeIdentityAuthoritative: true,
        runtimeIdentityReplacementAllowed: false,
      },
      ownershipSnapshot: {
        financialOwnershipRuntimeAuthoritative: true,
        entitlementOwnershipReplacementAllowed: false,
      },
      provenanceSnapshot: {
        runtimeIdentityPreserved: true,
        financialOwnershipRuntimePreserved: true,
        replayIdentityMutationAbsent: true,
        governanceIdentityAuthorityAbsent: true,
        projectionOwnershipAuthorityAbsent: true,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        identityReconstructionMeasurable: true,
        ownershipProvenanceMeasurable: true,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        advisoryOnly: true,
        synchronizedCandidateOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.financial_identity_correlation_failed_open",
      error,
    })
  }
}

export function validateFinancialIdentityCorrelationReadiness(
  input: FinancialIdentityCorrelationValidationInput
): FinancialIdentityCorrelationValidation {
  const blockers = [
    input.identityLineageDivergenceDetected
      ? "identity_lineage_divergence_detected"
      : null,
    input.identityOrderingDriftDetected
      ? "identity_ordering_drift_detected"
      : null,
    input.replaySafeIdentityGapDetected
      ? "replay_safe_identity_gap_detected"
      : null,
    input.ownershipMismatchDetected ? "ownership_mismatch_detected" : null,
    input.orphanedFinancialActorLineageDetected
      ? "orphaned_financial_actor_lineage_detected"
      : null,
    input.replayOwnedIdentityMutationDetected
      ? "replay_owned_identity_mutation_detected"
      : null,
    input.governanceOwnedIdentityAuthorityDetected
      ? "governance_owned_identity_authority_detected"
      : null,
    input.projectionOwnedOwnershipAuthorityDetected
      ? "projection_owned_ownership_authority_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    runtimeIdentityAuthoritative: true,
    financialOwnershipRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    replayOwnedIdentityMutationAllowed: false,
    governanceIdentityAuthorityAllowed: false,
    projectionOwnershipAuthorityAllowed: false,
  }
}
