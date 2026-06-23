import { logger } from "@/shared/observability/structured-logger"

import { writeCanonicalEntitlementReplayContinuityNoThrow } from "./canonical-entitlement-replay-continuity-repository"
import { isWave010EntitlementReplayContinuityEnabled } from "./feature-flags"

type JsonRecord = Record<string, unknown>

export type EntitlementReplayContinuityInput = Readonly<{
  entitlementBoundaryKey: string
  replayBoundaryKey: string
  topologyKey: string
  governanceBoundaryKey?: string | null
  rollbackBoundaryKey?: string | null
  replayRunId?: string | null
  reconciliationRunId?: string | null
  rollbackValidationId?: string | null
  subjectUserId?: string | null
  issuerCreatorId?: string | null
  subscriptionId?: string | null
  paymentId?: string | null
  sourceTable?: string | null
  sourceRowId?: string | null
  replaySequence?: number
  orderingTimestamp?: string | null
  observedReplaySignalCount: number
  expectedReplaySignalCount: number
  replayGapClass?: string
  replayGapSeverity?: string
  replayMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
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

function createKeys(input: EntitlementReplayContinuityInput) {
  const suffix = [
    stableKeyPart(input.entitlementBoundaryKey),
    stableKeyPart(input.replayBoundaryKey),
    stableKeyPart(input.topologyKey),
    stableKeyPart(input.replayRunId),
    stableKeyPart(input.rollbackBoundaryKey),
  ].join(":")

  return {
    entitlementReplayContinuityKey: [
      "canonical_entitlement_replay_continuity",
      suffix,
    ].join(":"),
    replayOrderingKey: [
      "canonical_entitlement_replay_continuity_ordering",
      suffix,
    ].join(":"),
    replayProvenanceKey: [
      "canonical_entitlement_replay_continuity_provenance",
      suffix,
    ].join(":"),
    replayReconstructionKey: [
      "canonical_entitlement_replay_continuity_reconstruction",
      suffix,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  replayObserved: boolean
  lineageObserved: boolean
  orderingObserved: boolean
  provenanceObserved: boolean
  replayGapDetected: boolean
}): string {
  if (
    input.replayObserved &&
    input.lineageObserved &&
    input.orderingObserved &&
    input.provenanceObserved &&
    !input.replayGapDetected
  ) {
    return "replay_reconstruction_complete"
  }

  if (input.replayObserved && input.orderingObserved) {
    return "replay_reconstruction_partial"
  }

  return "replay_reconstruction_incomplete"
}

export async function synchronizeEntitlementReplayContinuityNoThrow(
  input: EntitlementReplayContinuityInput
): Promise<void> {
  if (!isWave010EntitlementReplayContinuityEnabled()) return

  try {
    const keys = createKeys(input)
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const replaySequence = Math.max(1, input.replaySequence ?? 1)
    const replayObserved = Boolean(
      input.entitlementBoundaryKey && input.replayBoundaryKey
    )
    const lineageObserved = input.observedReplaySignalCount >= 0
    const orderingObserved = Boolean(orderingTimestamp)
    const provenanceObserved = true
    const replayGapDetected =
      input.expectedReplaySignalCount > 0 &&
      input.observedReplaySignalCount === 0
    const lineageCompletenessScore = clampScore(
      input.expectedReplaySignalCount === 0
        ? 1
        : input.observedReplaySignalCount / input.expectedReplaySignalCount
    )
    const reconstructionCompletenessScore = clampScore(
      [replayObserved, lineageObserved, orderingObserved, provenanceObserved]
        .filter(Boolean).length / 4
    )
    const confidence = reconstructionConfidence({
      replayObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
      replayGapDetected,
    })

    await writeCanonicalEntitlementReplayContinuityNoThrow({
      ...keys,
      replayRunId: uuidOrNull(input.replayRunId),
      reconciliationRunId: uuidOrNull(input.reconciliationRunId),
      rollbackValidationId: uuidOrNull(input.rollbackValidationId),
      entitlementBoundaryKey: input.entitlementBoundaryKey,
      replayBoundaryKey: input.replayBoundaryKey,
      governanceBoundaryKey: input.governanceBoundaryKey ?? null,
      rollbackBoundaryKey: input.rollbackBoundaryKey ?? null,
      subjectUserId: uuidOrNull(input.subjectUserId),
      issuerCreatorId: uuidOrNull(input.issuerCreatorId),
      subscriptionId: uuidOrNull(input.subscriptionId),
      paymentId: uuidOrNull(input.paymentId),
      sourceTable: input.sourceTable ?? null,
      sourceRowId: uuidOrNull(input.sourceRowId),
      replaySequence,
      orderingTimestamp,
      replayContinuityState: replayGapDetected
        ? "entitlement_replay_lineage_gap_observed"
        : "entitlement_replay_continuity_observed",
      replayGapClass: input.replayGapClass ?? "none",
      replayGapSeverity: input.replayGapSeverity ?? "none",
      lineageCompletenessScore,
      reconstructionCompletenessScore,
      reconstructionConfidence: confidence,
      replayObserved,
      lineageObserved,
      orderingObserved,
      provenanceObserved,
      replaySafeReconstructable: confidence !== "replay_reconstruction_incomplete",
      replayPayload: {
        observedReplaySignalCount: input.observedReplaySignalCount,
        expectedReplaySignalCount: input.expectedReplaySignalCount,
        synchronizedCandidateOnly: true,
        nonServing: true,
      },
      replayMetadata: {
        ...(input.replayMetadata ?? {}),
        entitlementRuntimeAuthorityPreserved: true,
        entitlementReplayContinuityAdvisoryOnly: true,
        replayEntitlementExecutionAllowed: false,
        governanceEntitlementAuthorityAllowed: false,
        projectionReplayExecutionAllowed: false,
      },
      orderingMetadata: {
        replaySafeEntitlementOrderingObservable: true,
      },
      replaySnapshot: {
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
        entitlementReplayContinuityObservable: true,
        replaySafeGapDetected: replayGapDetected,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        sourceBrief: "Wave-010-FEL-BR-082",
        advisoryOnly: true,
        replayReadOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "subscription.traceability.entitlement_replay_continuity_failed_open",
      error,
    })
  }
}

export function validateEntitlementReplayContinuityReadiness(
  input: Record<string, boolean | null | undefined>
) {
  const blockers = Object.entries(input)
    .filter(([, detected]) => detected === true)
    .map(([key]) => key)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    blockers,
    entitlementRuntimeAuthoritative: true,
    canonicalReplayAuthoritative: false,
    replayEntitlementExecutionAllowed: false,
    governanceEntitlementAuthorityAllowed: false,
    projectionReplayExecutionAllowed: false,
    authorityTransferAllowed: false,
    replayReadOnly: true,
  } as const
}
