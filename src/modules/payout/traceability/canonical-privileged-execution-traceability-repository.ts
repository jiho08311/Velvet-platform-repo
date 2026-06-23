import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalSecurityDefinerLineageInsert = Readonly<{
  securityDefinerLineageKey: string
  lineageKind: string
  sourceTable: string
  sourceRowId: string
  targetTable: string
  targetRowId: string
  lineageMetadata?: JsonRecord
}>

export type CanonicalPrivilegedExecutionTraceabilityInsert = Readonly<{
  privilegedExecutionKey: string
  privilegedOrderingKey: string
  privilegedReconstructionKey: string
  invocationSurface: string
  definedSecurityDefinerSurface?: string | null
  definedSecurityDefinerPresent: boolean
  observedSecurityDefinerInvoked: boolean
  observedRuntimeSurface: string
  serviceRoleSurface: string
  mutationSurface: string
  sourceTable: string
  sourceRowId: string
  payoutRequestId?: string | null
  payoutId?: string | null
  creatorId?: string | null
  executionStatus: string
  executionKind: string
  orderingSequence: number
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  reconstructionStatus: string
  reconstructionConfidence: string
  invocationObserved: boolean
  securityDefinerDefinitionObserved: boolean
  runtimeSurfaceObserved: boolean
  mutationSurfaceObserved: boolean
  orderingObserved: boolean
  lineage: readonly CanonicalSecurityDefinerLineageInsert[]
  invocationMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
  executedAt?: string | null
}>

async function assertNoSupabaseError(
  operation: PromiseLike<{ error: unknown }>
): Promise<void> {
  const { error } = await operation

  if (error) {
    throw error
  }
}

export async function writeCanonicalPrivilegedExecutionTraceability(
  input: CanonicalPrivilegedExecutionTraceabilityInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-018",
    aggregateRoot: "canonical_privileged_execution.id",
    financialAggregate: "financial_governance_aggregate",
    runtimeAuthoritative: true,
    privilegedExecutionRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    advisoryOnly: true,
    securityDefinerExecutionAuthorityPreserved: true,
    privilegedPayoutRpcExecutionAuthorityPreserved: true,
    governanceExecutionAuthorityAllowed: false,
    replayOwnedMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    payoutExecutionTransferAllowed: false,
    privilegedExecutionReplacementAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_financial_privileged_execution").upsert(
      {
        privileged_execution_key: input.privilegedExecutionKey,
        invocation_surface: input.invocationSurface,
        defined_security_definer_surface:
          input.definedSecurityDefinerSurface ?? null,
        defined_security_definer_present: input.definedSecurityDefinerPresent,
        observed_security_definer_invoked: input.observedSecurityDefinerInvoked,
        observed_runtime_surface: input.observedRuntimeSurface,
        service_role_surface: input.serviceRoleSurface,
        mutation_surface: input.mutationSurface,
        source_table: input.sourceTable,
        source_row_id: input.sourceRowId,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        creator_id: input.creatorId ?? null,
        execution_status: input.executionStatus,
        execution_kind: input.executionKind,
        invocation_metadata: input.invocationMetadata ?? {},
        provenance_metadata: provenanceMetadata,
        executed_at: input.executedAt ?? null,
      },
      { onConflict: "privileged_execution_key" }
    )
  )

  for (const item of input.lineage) {
    await assertNoSupabaseError(
      supabaseAdmin.from("canonical_security_definer_lineage").upsert(
        {
          security_definer_lineage_key: item.securityDefinerLineageKey,
          privileged_execution_key: input.privilegedExecutionKey,
          invocation_surface: input.invocationSurface,
          defined_security_definer_surface:
            input.definedSecurityDefinerSurface ?? null,
          observed_runtime_surface: input.observedRuntimeSurface,
          lineage_kind: item.lineageKind,
          lineage_status: "observed",
          source_table: item.sourceTable,
          source_row_id: item.sourceRowId,
          target_table: item.targetTable,
          target_row_id: item.targetRowId,
          payout_request_id: input.payoutRequestId ?? null,
          payout_id: input.payoutId ?? null,
          creator_id: input.creatorId ?? null,
          lineage_metadata: item.lineageMetadata ?? {},
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "security_definer_lineage_key" }
      )
    )
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_privileged_ordering").upsert(
      {
        privileged_ordering_key: input.privilegedOrderingKey,
        privileged_execution_key: input.privilegedExecutionKey,
        invocation_surface: input.invocationSurface,
        observed_runtime_surface: input.observedRuntimeSurface,
        ordering_sequence: input.orderingSequence,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.orderingConfidence,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        creator_id: input.creatorId ?? null,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "privileged_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_privileged_reconstruction_metadata").upsert(
      {
        privileged_reconstruction_key: input.privilegedReconstructionKey,
        privileged_execution_key: input.privilegedExecutionKey,
        privileged_ordering_key: input.privilegedOrderingKey,
        invocation_surface: input.invocationSurface,
        observed_runtime_surface: input.observedRuntimeSurface,
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        invocation_observed: input.invocationObserved,
        security_definer_definition_observed:
          input.securityDefinerDefinitionObserved,
        runtime_surface_observed: input.runtimeSurfaceObserved,
        mutation_surface_observed: input.mutationSurfaceObserved,
        ordering_observed: input.orderingObserved,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        creator_id: input.creatorId ?? null,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "privileged_reconstruction_key" }
    )
  )
}

export async function writeCanonicalPrivilegedExecutionTraceabilityNoThrow(
  input: CanonicalPrivilegedExecutionTraceabilityInsert
): Promise<void> {
  try {
    await writeCanonicalPrivilegedExecutionTraceability(input)
  } catch (error) {
    logger.warn({
      event: "payout.traceability.canonical_privileged_execution.write_failed",
      message: "Canonical privileged execution traceability write failed",
      error,
    })
  }
}
