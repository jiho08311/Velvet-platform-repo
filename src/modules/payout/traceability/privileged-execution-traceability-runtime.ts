import { writeCanonicalPrivilegedExecutionTraceabilityNoThrow } from "./canonical-privileged-execution-traceability-repository"
import { isWave010SecurityDefinerLineageEnabled } from "./feature-flags"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type PrivilegedExecutionTraceabilityLineageInput = Readonly<{
  lineageKind: string
  sourceTable: string
  sourceRowId: string
  targetTable: string
  targetRowId: string
  lineageMetadata?: JsonRecord
}>

export type PrivilegedExecutionTraceabilityInput = Readonly<{
  invocationSurface: string
  definedSecurityDefinerSurface?: string | null
  definedSecurityDefinerPresent: boolean
  observedSecurityDefinerInvoked: boolean
  observedRuntimeSurface: string
  serviceRoleSurface?: string
  mutationSurface: string
  sourceTable: string
  sourceRowId: string
  payoutRequestId?: string | null
  payoutId?: string | null
  creatorId?: string | null
  executionKind: string
  executedAt?: string | null
  orderingSequence: number
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  lineage: readonly PrivilegedExecutionTraceabilityLineageInput[]
  invocationMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type PrivilegedExecutionTraceabilityValidationInput = Readonly<{
  missingPrivilegedLineageDetected?: boolean
  privilegedOrderingDriftDetected?: boolean
  replaySafePrivilegedGapDetected?: boolean
  securityDefinerMismatchDetected?: boolean
  replayOwnedPrivilegedMutationDetected?: boolean
  governanceOwnedExecutionAuthorityDetected?: boolean
  payoutExecutionTransferDetected?: boolean
  privilegedAuthorityContaminationDetected?: boolean
}>

export type PrivilegedExecutionTraceabilityValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  privilegedExecutionRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  governanceExecutionAuthorityAllowed: false
  replayOwnedMutationAllowed: false
  replayOwnedExecutionAllowed: false
  payoutExecutionTransferAllowed: false
  privilegedExecutionReplacementAllowed: false
  reconciliationRepairAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function createPrivilegedExecutionKeys(
  input: PrivilegedExecutionTraceabilityInput
) {
  const invocation = stableKeyPart(input.invocationSurface)
  const source = stableKeyPart(input.sourceRowId)
  const payoutRequest = stableKeyPart(input.payoutRequestId)
  const payout = stableKeyPart(input.payoutId)

  return {
    privilegedExecutionKey: [
      "privileged_execution",
      invocation,
      source,
      payoutRequest,
      payout,
    ].join(":"),
    privilegedOrderingKey: [
      "privileged_ordering",
      invocation,
      source,
      input.orderingSequence,
    ].join(":"),
    privilegedReconstructionKey: [
      "privileged_reconstruction",
      invocation,
      source,
      payoutRequest,
      payout,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  invocationObserved: boolean
  securityDefinerDefinitionObserved: boolean
  runtimeSurfaceObserved: boolean
  mutationSurfaceObserved: boolean
  orderingObserved: boolean
  observedSecurityDefinerInvoked: boolean
  definedSecurityDefinerPresent: boolean
}): string {
  if (
    input.invocationObserved &&
    input.securityDefinerDefinitionObserved &&
    input.runtimeSurfaceObserved &&
    input.mutationSurfaceObserved &&
    input.orderingObserved &&
    input.observedSecurityDefinerInvoked
  ) {
    return "security_definer_invocation_complete"
  }

  if (
    input.invocationObserved &&
    input.definedSecurityDefinerPresent &&
    input.runtimeSurfaceObserved &&
    input.mutationSurfaceObserved &&
    input.orderingObserved
  ) {
    return "privileged_runtime_surface_complete"
  }

  return "privileged_runtime_surface_incomplete"
}

export async function synchronizePrivilegedExecutionTraceabilityNoThrow(
  input: PrivilegedExecutionTraceabilityInput
): Promise<void> {
  if (!isWave010SecurityDefinerLineageEnabled()) return

  try {
    const keys = createPrivilegedExecutionKeys(input)
    const invocationObserved = observed(input.invocationSurface)
    const securityDefinerDefinitionObserved =
      input.definedSecurityDefinerPresent &&
      observed(input.definedSecurityDefinerSurface)
    const runtimeSurfaceObserved = observed(input.observedRuntimeSurface)
    const mutationSurfaceObserved = observed(input.mutationSurface)
    const orderingObserved = observed(input.orderingTimestamp)
    const confidence = reconstructionConfidence({
      invocationObserved,
      securityDefinerDefinitionObserved,
      runtimeSurfaceObserved,
      mutationSurfaceObserved,
      orderingObserved,
      observedSecurityDefinerInvoked: input.observedSecurityDefinerInvoked,
      definedSecurityDefinerPresent: input.definedSecurityDefinerPresent,
    })

    await writeCanonicalPrivilegedExecutionTraceabilityNoThrow({
      ...keys,
      invocationSurface: input.invocationSurface,
      definedSecurityDefinerSurface: input.definedSecurityDefinerSurface ?? null,
      definedSecurityDefinerPresent: input.definedSecurityDefinerPresent,
      observedSecurityDefinerInvoked: input.observedSecurityDefinerInvoked,
      observedRuntimeSurface: input.observedRuntimeSurface,
      serviceRoleSurface:
        input.serviceRoleSurface ?? "service_role.payout_rpc_execution",
      mutationSurface: input.mutationSurface,
      sourceTable: input.sourceTable,
      sourceRowId: input.sourceRowId,
      payoutRequestId: input.payoutRequestId ?? null,
      payoutId: input.payoutId ?? null,
      creatorId: input.creatorId ?? null,
      executionStatus: "observed",
      executionKind: input.executionKind,
      orderingSequence: input.orderingSequence,
      orderingTimestamp: input.orderingTimestamp || new Date().toISOString(),
      orderingSource: input.orderingSource,
      replayTimestampSource: input.replayTimestampSource,
      orderingConfidence: confidence,
      reconstructionStatus: "observed",
      reconstructionConfidence: confidence,
      invocationObserved,
      securityDefinerDefinitionObserved,
      runtimeSurfaceObserved,
      mutationSurfaceObserved,
      orderingObserved,
      lineage: input.lineage.map((lineage) => ({
        securityDefinerLineageKey: [
          "security_definer_lineage",
          stableKeyPart(input.invocationSurface),
          stableKeyPart(lineage.lineageKind),
          stableKeyPart(lineage.sourceRowId),
          stableKeyPart(lineage.targetRowId),
        ].join(":"),
        ...lineage,
      })),
      invocationMetadata: {
        ...(input.invocationMetadata ?? {}),
        privilegedRuntimeAuthorityPreserved: true,
        observedSecurityDefinerInvoked: input.observedSecurityDefinerInvoked,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        replaySafePrivilegedOrderingMeasurable: true,
        orderingSequence: input.orderingSequence,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        replayOwnedPrivilegedMutationAllowed: false,
        governanceOwnedExecutionAuthorityAllowed: false,
        payoutExecutionTransferAllowed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        advisoryOnly: true,
        runtimeAuthoritative: true,
        privilegedExecutionRuntimeAuthoritative: true,
      },
      executedAt: input.executedAt ?? input.orderingTimestamp,
    })
  } catch (error) {
    logger.warn({
      event: "payout.traceability.privileged_execution.failed_open",
      message: "Privileged execution traceability failed open",
      error,
    })
  }
}

export function validatePrivilegedExecutionTraceabilityReadiness(
  input: PrivilegedExecutionTraceabilityValidationInput
): PrivilegedExecutionTraceabilityValidation {
  const blockers = [
    input.missingPrivilegedLineageDetected
      ? "missing_privileged_lineage_detected"
      : null,
    input.privilegedOrderingDriftDetected
      ? "privileged_ordering_drift_detected"
      : null,
    input.replaySafePrivilegedGapDetected
      ? "replay_safe_privileged_gap_detected"
      : null,
    input.securityDefinerMismatchDetected
      ? "security_definer_mismatch_detected"
      : null,
    input.replayOwnedPrivilegedMutationDetected
      ? "replay_owned_privileged_mutation_detected"
      : null,
    input.governanceOwnedExecutionAuthorityDetected
      ? "governance_owned_execution_authority_detected"
      : null,
    input.payoutExecutionTransferDetected
      ? "payout_execution_transfer_detected"
      : null,
    input.privilegedAuthorityContaminationDetected
      ? "privileged_authority_contamination_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass:
      blockers.length > 0
        ? "privileged_execution_traceability_promotion_blocked"
        : "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    privilegedExecutionRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    governanceExecutionAuthorityAllowed: false,
    replayOwnedMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    payoutExecutionTransferAllowed: false,
    privilegedExecutionReplacementAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
