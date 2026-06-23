import { writeCanonicalServiceRoleFinancialExecutionTraceabilityNoThrow } from "./canonical-service-role-financial-execution-repository"
import { isWave010ServiceRoleFinancialExecutionTraceabilityEnabled } from "./feature-flags"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type ServiceRoleFinancialExecutionLineageInput = Readonly<{
  lineageKind: string
  sourceTable: string
  sourceRowId: string
  targetTable: string
  targetRowId: string
  lineageMetadata?: JsonRecord
}>

export type ServiceRoleFinancialExecutionInput = Readonly<{
  executionSurface: string
  serviceRoleSurface: string
  runtimeSurface: string
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
  lineage: readonly ServiceRoleFinancialExecutionLineageInput[]
  executionMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type ServiceRoleFinancialExecutionValidationInput = Readonly<{
  missingServiceRoleLineageDetected?: boolean
  serviceRoleOrderingDriftDetected?: boolean
  replaySafeServiceRoleGapDetected?: boolean
  privilegedExecutionMismatchDetected?: boolean
  replayOwnedServiceRoleMutationDetected?: boolean
  governanceOwnedExecutionAuthorityDetected?: boolean
  serviceRoleAuthorityContaminationDetected?: boolean
  serviceRoleReplacementDetected?: boolean
}>

export type ServiceRoleFinancialExecutionValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  serviceRoleRuntimeAuthoritative: true
  privilegedRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  governanceExecutionAuthorityAllowed: false
  replayOwnedMutationAllowed: false
  replayOwnedExecutionAllowed: false
  serviceRoleReplacementAllowed: false
  runtimeServiceRoleReplacementAllowed: false
  reconciliationRepairAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function createServiceRoleFinancialExecutionKeys(
  input: ServiceRoleFinancialExecutionInput
) {
  const surface = stableKeyPart(input.executionSurface)
  const source = stableKeyPart(input.sourceRowId)
  const payoutRequest = stableKeyPart(input.payoutRequestId)
  const payout = stableKeyPart(input.payoutId)

  return {
    serviceRoleExecutionKey: [
      "service_role_financial_execution",
      surface,
      source,
      payoutRequest,
      payout,
    ].join(":"),
    serviceRoleOrderingKey: [
      "service_role_financial_ordering",
      surface,
      source,
      input.orderingSequence,
    ].join(":"),
    serviceRoleReconstructionKey: [
      "service_role_financial_reconstruction",
      surface,
      source,
      payoutRequest,
      payout,
    ].join(":"),
  }
}

function reconstructionConfidence(input: {
  executionObserved: boolean
  serviceRoleSurfaceObserved: boolean
  runtimeSurfaceObserved: boolean
  mutationSurfaceObserved: boolean
  orderingObserved: boolean
}): string {
  if (
    input.executionObserved &&
    input.serviceRoleSurfaceObserved &&
    input.runtimeSurfaceObserved &&
    input.mutationSurfaceObserved &&
    input.orderingObserved
  ) {
    return "service_role_financial_execution_complete"
  }

  return "service_role_financial_execution_incomplete"
}

export async function synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow(
  input: ServiceRoleFinancialExecutionInput
): Promise<void> {
  if (!isWave010ServiceRoleFinancialExecutionTraceabilityEnabled()) return

  try {
    const keys = createServiceRoleFinancialExecutionKeys(input)
    const executionObserved = observed(input.executionSurface)
    const serviceRoleSurfaceObserved = observed(input.serviceRoleSurface)
    const runtimeSurfaceObserved = observed(input.runtimeSurface)
    const mutationSurfaceObserved = observed(input.mutationSurface)
    const orderingObserved = observed(input.orderingTimestamp)
    const confidence = reconstructionConfidence({
      executionObserved,
      serviceRoleSurfaceObserved,
      runtimeSurfaceObserved,
      mutationSurfaceObserved,
      orderingObserved,
    })

    await writeCanonicalServiceRoleFinancialExecutionTraceabilityNoThrow({
      ...keys,
      executionSurface: input.executionSurface,
      serviceRoleSurface: input.serviceRoleSurface,
      runtimeSurface: input.runtimeSurface,
      mutationSurface: input.mutationSurface,
      sourceTable: input.sourceTable,
      sourceRowId: input.sourceRowId,
      payoutRequestId: input.payoutRequestId ?? null,
      payoutId: input.payoutId ?? null,
      creatorId: input.creatorId ?? null,
      executionKind: input.executionKind,
      executionStatus: "observed",
      orderingSequence: input.orderingSequence,
      orderingTimestamp: input.orderingTimestamp || new Date().toISOString(),
      orderingSource: input.orderingSource,
      replayTimestampSource: input.replayTimestampSource,
      orderingConfidence: confidence,
      reconstructionStatus: "observed",
      reconstructionConfidence: confidence,
      executionObserved,
      serviceRoleSurfaceObserved,
      runtimeSurfaceObserved,
      mutationSurfaceObserved,
      orderingObserved,
      lineage: input.lineage.map((lineage) => ({
        serviceRoleLineageKey: [
          "service_role_financial_lineage",
          stableKeyPart(input.executionSurface),
          stableKeyPart(lineage.lineageKind),
          stableKeyPart(lineage.sourceRowId),
          stableKeyPart(lineage.targetRowId),
        ].join(":"),
        ...lineage,
      })),
      executionMetadata: {
        ...(input.executionMetadata ?? {}),
        serviceRoleRuntimeAuthorityPreserved: true,
        serviceRoleExecutionReplacementAllowed: false,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        replaySafeServiceRoleOrderingMeasurable: true,
        orderingSequence: input.orderingSequence,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        replayOwnedServiceRoleMutationAllowed: false,
        governanceOwnedExecutionAuthorityAllowed: false,
        runtimeServiceRoleReplacementAllowed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        advisoryOnly: true,
        runtimeAuthoritative: true,
        serviceRoleRuntimeAuthoritative: true,
        privilegedRuntimeAuthoritative: true,
      },
      executedAt: input.executedAt ?? input.orderingTimestamp,
    })
  } catch (error) {
    logger.warn({
      event: "payout.traceability.service_role_financial_execution.failed_open",
      message: "Service-role financial execution failed open",
      error,
    })
  }
}

export function validateServiceRoleFinancialExecutionReadiness(
  input: ServiceRoleFinancialExecutionValidationInput
): ServiceRoleFinancialExecutionValidation {
  const blockers = [
    input.missingServiceRoleLineageDetected
      ? "missing_service_role_lineage_detected"
      : null,
    input.serviceRoleOrderingDriftDetected
      ? "service_role_ordering_drift_detected"
      : null,
    input.replaySafeServiceRoleGapDetected
      ? "replay_safe_service_role_gap_detected"
      : null,
    input.privilegedExecutionMismatchDetected
      ? "privileged_execution_mismatch_detected"
      : null,
    input.replayOwnedServiceRoleMutationDetected
      ? "replay_owned_service_role_mutation_detected"
      : null,
    input.governanceOwnedExecutionAuthorityDetected
      ? "governance_owned_execution_authority_detected"
      : null,
    input.serviceRoleAuthorityContaminationDetected
      ? "service_role_authority_contamination_detected"
      : null,
    input.serviceRoleReplacementDetected
      ? "service_role_replacement_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass:
      blockers.length > 0
        ? "service_role_financial_execution_promotion_blocked"
        : "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    serviceRoleRuntimeAuthoritative: true,
    privilegedRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    governanceExecutionAuthorityAllowed: false,
    replayOwnedMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    serviceRoleReplacementAllowed: false,
    runtimeServiceRoleReplacementAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
