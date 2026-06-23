import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalServiceRoleLineageInsert = Readonly<{
  serviceRoleLineageKey: string
  lineageKind: string
  sourceTable: string
  sourceRowId: string
  targetTable: string
  targetRowId: string
  lineageMetadata?: JsonRecord
}>

export type CanonicalServiceRoleFinancialExecutionInsert = Readonly<{
  serviceRoleExecutionKey: string
  serviceRoleOrderingKey: string
  serviceRoleReconstructionKey: string
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
  executionStatus: string
  orderingSequence: number
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  reconstructionStatus: string
  reconstructionConfidence: string
  executionObserved: boolean
  serviceRoleSurfaceObserved: boolean
  runtimeSurfaceObserved: boolean
  mutationSurfaceObserved: boolean
  orderingObserved: boolean
  lineage: readonly CanonicalServiceRoleLineageInsert[]
  executionMetadata?: JsonRecord
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

export async function writeCanonicalServiceRoleFinancialExecutionTraceability(
  input: CanonicalServiceRoleFinancialExecutionInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-019",
    aggregateRoot: "canonical_service_role_execution.id",
    financialAggregate: "financial_governance_aggregate",
    runtimeAuthoritative: true,
    serviceRoleRuntimeAuthoritative: true,
    privilegedRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    advisoryOnly: true,
    governanceExecutionAuthorityAllowed: false,
    replayOwnedMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    serviceRoleReplacementAllowed: false,
    runtimeServiceRoleReplacementAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_service_role_financial_execution").upsert(
      {
        service_role_execution_key: input.serviceRoleExecutionKey,
        execution_surface: input.executionSurface,
        service_role_surface: input.serviceRoleSurface,
        runtime_surface: input.runtimeSurface,
        mutation_surface: input.mutationSurface,
        source_table: input.sourceTable,
        source_row_id: input.sourceRowId,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        creator_id: input.creatorId ?? null,
        execution_kind: input.executionKind,
        execution_status: input.executionStatus,
        execution_metadata: input.executionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
        executed_at: input.executedAt ?? null,
      },
      { onConflict: "service_role_execution_key" }
    )
  )

  for (const item of input.lineage) {
    await assertNoSupabaseError(
      supabaseAdmin.from("canonical_service_role_lineage").upsert(
        {
          service_role_lineage_key: item.serviceRoleLineageKey,
          service_role_execution_key: input.serviceRoleExecutionKey,
          lineage_kind: item.lineageKind,
          lineage_status: "observed",
          execution_surface: input.executionSurface,
          service_role_surface: input.serviceRoleSurface,
          runtime_surface: input.runtimeSurface,
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
        { onConflict: "service_role_lineage_key" }
      )
    )
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_service_role_ordering").upsert(
      {
        service_role_ordering_key: input.serviceRoleOrderingKey,
        service_role_execution_key: input.serviceRoleExecutionKey,
        execution_surface: input.executionSurface,
        service_role_surface: input.serviceRoleSurface,
        runtime_surface: input.runtimeSurface,
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
      { onConflict: "service_role_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_service_role_reconstruction_metadata").upsert(
      {
        service_role_reconstruction_key: input.serviceRoleReconstructionKey,
        service_role_execution_key: input.serviceRoleExecutionKey,
        service_role_ordering_key: input.serviceRoleOrderingKey,
        execution_surface: input.executionSurface,
        service_role_surface: input.serviceRoleSurface,
        runtime_surface: input.runtimeSurface,
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        execution_observed: input.executionObserved,
        service_role_surface_observed: input.serviceRoleSurfaceObserved,
        runtime_surface_observed: input.runtimeSurfaceObserved,
        mutation_surface_observed: input.mutationSurfaceObserved,
        ordering_observed: input.orderingObserved,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        creator_id: input.creatorId ?? null,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "service_role_reconstruction_key" }
    )
  )
}

export async function writeCanonicalServiceRoleFinancialExecutionTraceabilityNoThrow(
  input: CanonicalServiceRoleFinancialExecutionInsert
): Promise<void> {
  try {
    await writeCanonicalServiceRoleFinancialExecutionTraceability(input)
  } catch (error) {
    logger.warn({
      event: "payout.traceability.canonical_service_role_financial_execution.write_failed",
      message: "Canonical service-role financial execution write failed",
      error,
    })
  }
}
